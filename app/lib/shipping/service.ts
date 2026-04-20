// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING — Service Layer (Core Business Logic)
//
// This is the ONLY place that coordinates between:
//   - Firestore (order data)
//   - The adapter registry (carrier resolution)
//   - The carrier adapter (API call)
//
// The API route calls dispatchShipment().
// The webhook handler calls handleWebhookEvent().
// Nothing else should import from adapters directly.
// ─────────────────────────────────────────────────────────────────────────────

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/app/lib/firebase-admin";
import { getAdapter } from "./registry";
import type {
  CarrierId,
  DispatchInput,
  InternalShippingStatus,
  ShipmentRequest,
  ShipmentResult,
  WebhookEvent,
} from "./types";
import { ShippingError, getErrorMeta } from "./types";

const ORDERS = "orders";
const SHIPMENT_LOGS = "shipping_logs";

// ── Status ordering ───────────────────────────────────────────────────────────
// Higher rank = further along the delivery lifecycle.
// A webhook event is silently dropped if it would move the status BACKWARDS.
// This prevents delayed/out-of-order carrier callbacks from corrupting the order.
//
// Example: Bosta sends DELIVERED (rank 6), then 10 minutes later resends
//          OUT_FOR_DELIVERY (rank 5) — the second event is ignored.

const STATUS_RANK: Record<InternalShippingStatus, number> = {
  pending:          0,
  picked_up:        1,
  in_transit:       2,
  out_for_delivery: 3,
  delivered:        4,
  returned:         5,   // terminal — same rank tier as delivered
  cancelled:        5,   // terminal
  failed:           5,   // terminal
};

/**
 * Returns true if the new status is the same rank or higher than the current.
 * Terminal statuses (delivered/returned/cancelled/failed) are never overwritten.
 */
function isStatusProgression(
  current: InternalShippingStatus,
  next: InternalShippingStatus
): boolean {
  // Never overwrite a terminal status
  const TERMINAL: InternalShippingStatus[] = ["delivered", "returned", "cancelled", "failed"];
  if (TERMINAL.includes(current)) return false;
  return STATUS_RANK[next] >= STATUS_RANK[current];
}

// ── Weight limits per carrier (grams) ─────────────────────────────────────────
const MAX_WEIGHT_GRAMS: Partial<Record<CarrierId, number>> = {
  bosta:  30_000,   // 30 kg
  aramex: 70_000,   // 70 kg
  smsa:   50_000,   // 50 kg
  mock:   Infinity,
};

// ── Retry helper ──────────────────────────────────────────────────────────────
// Only retries when err.retryable === true. Max 2 total attempts (1 retry).
// Waits 1 second before the retry to avoid hammering a struggling carrier.

async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  carrierId: string
): Promise<{ result: T; attempts: number }> {
  const MAX_ATTEMPTS = 2;
  const RETRY_DELAY_MS = 1000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await fn(attempt);
      return { result, attempts: attempt };
    } catch (err) {
      const isRetryable = err instanceof ShippingError ? err.retryable : false;
      if (!isRetryable || attempt === MAX_ATTEMPTS) throw err;
      console.warn(
        `[Shipping:${carrierId}] Attempt ${attempt} failed (retryable). ` +
        `Retrying in ${RETRY_DELAY_MS}ms…`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  // Unreachable — TypeScript needs this
  throw new ShippingError("UNKNOWN_ERROR", "Retry loop exited unexpectedly", carrierId);
}

// ── Validation ────────────────────────────────────────────────────────────────

const DISPATCHABLE_STATUSES = new Set(["confirmed", "processing"]);

function validateDispatchInput(input: DispatchInput): void {
  const { recipient, packageInfo, carrierId } = input;

  const missing: string[] = [];
  if (!recipient.name?.trim())    missing.push("recipient name");
  if (!recipient.phone?.trim())   missing.push("recipient phone");
  if (!recipient.address?.trim()) missing.push("recipient address");
  if (!recipient.city?.trim())    missing.push("recipient city");
  if (!packageInfo.weightGrams || packageInfo.weightGrams <= 0)
    missing.push("package weight (must be > 0)");
  if (packageInfo.codAmount < 0)
    missing.push("COD amount (cannot be negative)");

  if (missing.length > 0) {
    throw new ShippingError(
      "VALIDATION_FAILED",
      `Missing required dispatch fields: ${missing.join(", ")}`,
      carrierId
    );
  }

  // ── Weight limit check ──────────────────────────────────────────────────
  const maxGrams = MAX_WEIGHT_GRAMS[carrierId] ?? 30_000;
  if (packageInfo.weightGrams > maxGrams) {
    throw new ShippingError(
      "WEIGHT_EXCEEDED",
      `Package weight ${packageInfo.weightGrams}g exceeds ${carrierId} limit of ${maxGrams}g (${maxGrams / 1000}kg).`,
      carrierId
    );
  }

  // ── Phone format (Egyptian numbers) ─────────────────────────────────────
  const phone = recipient.phone.replace(/\s|-/g, "");
  if (!/^(0|\+20)?1[0-2,5]\d{8}$/.test(phone)) {
    throw new ShippingError(
      "VALIDATION_FAILED",
      `Recipient phone "${recipient.phone}" does not look like a valid Egyptian mobile number.`,
      carrierId
    );
  }
}

// ── Main Dispatch Function ────────────────────────────────────────────────────

export interface DispatchResult {
  shipmentResult: ShipmentResult;
  orderId: string;
  carrierId: CarrierId;
}

/**
 * Dispatch a shipment for an order.
 *
 * Called by: POST /api/admin/orders/[id]/ship
 *
 * Steps:
 *  1. Load order from Firestore
 *  2. Validate order is eligible for dispatch
 *  3. Validate input fields
 *  4. Mark order as "processing" (prevents double-submit)
 *  5. Resolve carrier adapter
 *  6. Call carrier API
 *  7. On success: update order + write shipment log
 *  8. On failure: rollback order status + write error log
 */
export async function dispatchShipment(
  orderId: string,
  input: DispatchInput,
  dispatchedBy: string
): Promise<DispatchResult> {
  // ── Step 1: Load order ────────────────────────────────────────────────────
  const orderRef = adminDb.collection(ORDERS).doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new ShippingError("ORDER_NOT_FOUND", `Order ${orderId} not found`, input.carrierId);
  }

  const order = orderSnap.data() as Record<string, unknown>;

  // ── Step 2: Validate order eligibility ───────────────────────────────────
  const currentStatus = String(order.orderStatus ?? "");
  if (!DISPATCHABLE_STATUSES.has(currentStatus)) {
    throw new ShippingError(
      "ORDER_NOT_DISPATCHABLE",
      `Order status is "${currentStatus}". Only confirmed or processing orders can be dispatched.`,
      input.carrierId
    );
  }

  if (order.trackingNumber) {
    throw new ShippingError(
      "ALREADY_DISPATCHED",
      `Order already has tracking number: ${order.trackingNumber}`,
      input.carrierId
    );
  }

  // ── Step 3: Validate input ────────────────────────────────────────────────
  validateDispatchInput(input);

  // ── Step 4: Lock order (prevent double-click dispatch) ────────────────────
  await orderRef.update({
    orderStatus: "processing",
    dispatchingAt: FieldValue.serverTimestamp(),
  });

  // ── Step 5: Resolve carrier adapter ──────────────────────────────────────
  const adapter = await getAdapter(input.carrierId);

  // ── Step 5b: Pre-validate address (non-blocking — warn but don't fail) ───
  try {
    const addrResult = await adapter.validateAddress(input.recipient);
    if (!addrResult.valid) {
      // Hard-fail: carrier explicitly says this address is unreachable
      await orderRef.update({
        orderStatus: "confirmed",
        dispatchingAt: FieldValue.delete(),
        shipDispatchError: {
          carrier: input.carrierId,
          code: "ADDRESS_INVALID",
          category: "carrier_reject",
          message: addrResult.issues?.join("; ") ?? "Address not in coverage zone",
          retryable: false,
          at: new Date().toISOString(),
        },
      });
      throw new ShippingError(
        "ADDRESS_INVALID",
        addrResult.issues?.join("; ") ?? "Address not in coverage zone",
        input.carrierId
      );
    }
  } catch (err) {
    if (err instanceof ShippingError && err.code === "ADDRESS_INVALID") throw err;
    // validateAddress itself threw unexpectedly — log and continue (non-blocking)
    console.warn(`[Shipping:${input.carrierId}] Address validation error (non-blocking):`, err);
  }

  // ── Step 6: Build normalized request ─────────────────────────────────────
  const shipmentRequest: ShipmentRequest = {
    orderId,
    orderNumber: String(order.orderNumber ?? orderId),
    recipient: input.recipient,
    packageInfo: input.packageInfo,
    currency: "EGP",
  };

  let shipmentResult: ShipmentResult;
  let attempts = 1;
  const dispatchStart = Date.now();

  try {
    ({ result: shipmentResult, attempts } = await withRetry(
      () => adapter.createShipment(shipmentRequest),
      input.carrierId
    ));
  } catch (err) {
    // ── Step 8 (failure path): rollback + log ─────────────────────────────
    const errorMsg  = err instanceof Error ? err.message : String(err);
    const errorCode = err instanceof ShippingError ? err.code : "UNKNOWN_ERROR";
    const meta      = getErrorMeta(errorCode);
    const durationMs = Date.now() - dispatchStart;

    await orderRef.update({
      orderStatus: "confirmed",
      dispatchingAt: FieldValue.delete(),
      shipDispatchError: {
        carrier:   input.carrierId,
        code:      errorCode,
        category:  meta.category,
        message:   errorMsg,
        retryable: meta.retryable,
        attempts,
        durationMs,
        at: new Date().toISOString(),
      },
    });

    await writeShippingLog({
      orderId,
      carrierId:       input.carrierId,
      action:          "dispatch",
      success:         false,
      errorCode,
      errorCategory:   meta.category,
      errorMessage:    errorMsg,
      retryable:       meta.retryable,
      attempts,
      durationMs,
      requestPayload:  shipmentRequest,
      responsePayload: null,
    });

    throw err;
  }

  // ── Step 7 (success path): persist result ────────────────────────────────
  await orderRef.update({
    orderStatus: "shipped",
    shippingStatus: "in_transit",
    shippingCompany: input.carrierId,
    shipmentId: shipmentResult.carrierShipmentId,
    trackingNumber: shipmentResult.trackingNumber,
    trackingUrl: shipmentResult.trackingUrl ?? null,
    labelUrl: shipmentResult.labelUrl ?? null,
    shippedAt: FieldValue.serverTimestamp(),
    dispatchedBy,
    shipToSnapshot: input.recipient,
    shipmentSnapshot: input.packageInfo,
    shipDispatchError: null,
    dispatchingAt: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await writeShippingLog({
    orderId,
    carrierId:       input.carrierId,
    action:          "dispatch",
    success:         true,
    attempts,
    durationMs:      Date.now() - dispatchStart,
    requestPayload:  shipmentRequest,
    responsePayload: shipmentResult.rawResponse,
  });

  return { shipmentResult, orderId, carrierId: input.carrierId };
}

// ── Webhook Handler ───────────────────────────────────────────────────────────

/**
 * Process a normalized webhook event and update the order in Firestore.
 * Called by: POST /api/webhooks/shipping/[carrier]
 *
 * Guards applied:
 *  1. Duplicate detection  — checks order.lastWebhookEventId (idempotency key)
 *  2. Out-of-order check   — skips event if it would regress the status
 *  3. Terminal-lock        — never overwrites delivered/returned/cancelled/failed
 */
export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  if (!event.trackingNumber) return;

  // ── Find order by tracking number ────────────────────────────────────────
  const snapshot = await adminDb
    .collection(ORDERS)
    .where("trackingNumber", "==", event.trackingNumber)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.warn(
      `[Webhook] No order found for tracking number "${event.trackingNumber}" ` +
      `(carrier event: ${event.carrierEvent})`
    );
    return;
  }

  const doc  = snapshot.docs[0];
  const orderId = doc.id;
  const order = doc.data() as Record<string, unknown>;

  // ── Guard 1: Duplicate event (idempotency) ───────────────────────────────
  // Carriers can fire the same event multiple times (network retry, resend).
  // We store the last processed event ID on the order and skip duplicates.
  if (event.eventId && order.lastWebhookEventId === event.eventId) {
    console.info(
      `[Webhook] Duplicate event skipped — ` +
      `orderId=${orderId} eventId=${event.eventId} status=${event.carrierEvent}`
    );
    return;
  }

  // ── Guard 2 + 3: Out-of-order and terminal-lock ──────────────────────────
  const currentShippingStatus = (order.shippingStatus ?? "pending") as InternalShippingStatus;

  if (!isStatusProgression(currentShippingStatus, event.internalStatus)) {
    console.info(
      `[Webhook] Out-of-order / terminal event dropped — ` +
      `orderId=${orderId} current="${currentShippingStatus}" incoming="${event.internalStatus}" ` +
      `carrierEvent="${event.carrierEvent}"`
    );
    // Still log it for diagnostics — but don't update the order
    await writeShippingLog({
      orderId,
      carrierId: "webhook",
      action:    "webhook",
      success:   true,
      errorCode: "WEBHOOK_DROPPED_OUT_OF_ORDER",
      errorMessage:
        `Dropped: ${event.internalStatus} would regress from current "${currentShippingStatus}"`,
      requestPayload:  null,
      responsePayload: event.rawPayload,
    });
    return;
  }

  // ── Build Firestore update ────────────────────────────────────────────────
  const update: Record<string, unknown> = {
    shippingStatus:      event.internalStatus,
    lastWebhookEventId:  event.eventId ?? null,
    lastWebhookAt:       FieldValue.serverTimestamp(),
    updatedAt:           FieldValue.serverTimestamp(),
  };

  // Promote orderStatus on terminal events
  if (event.internalStatus === "delivered") {
    update.orderStatus  = "delivered";
    update.deliveredAt  = FieldValue.serverTimestamp();
  } else if (event.internalStatus === "returned") {
    update.orderStatus  = "processing";  // back to admin attention
    update.returnedAt   = FieldValue.serverTimestamp();
  } else if (event.internalStatus === "cancelled") {
    update.orderStatus  = "cancelled";
    update.cancelledAt  = FieldValue.serverTimestamp();
  } else if (event.internalStatus === "failed") {
    update.orderStatus  = "processing";  // admin must handle
  }

  await doc.ref.update(update);

  await writeShippingLog({
    orderId,
    carrierId:       "webhook",
    action:          "webhook",
    success:         true,
    requestPayload:  null,
    responsePayload: event.rawPayload,
  });
}

// ── Internal log writer ───────────────────────────────────────────────────────
//
// Log document schema (stored in Firestore /shipping_logs/{auto-id}):
//
//   orderId         — Firestore order ID
//   carrierId       — "bosta" | "aramex" | "mock" | "webhook"
//   action          — "dispatch" | "webhook" | "cancel"
//   success         — boolean
//   attempts        — number of carrier API calls made (1 = first try, 2 = 1 retry)
//   durationMs      — total time from dispatch start to response/error (ms)
//   errorCode       — SHIPPING_ERROR_CATALOG key if failed
//   errorCategory   — "validation" | "carrier_error" | ... (from catalog)
//   errorMessage    — full human-readable error string
//   retryable       — whether admin should see a Retry button
//   requestPayload  — the normalized ShipmentRequest sent to carrier
//   responsePayload — raw carrier response (or webhook body)
//   createdAt       — Firestore server timestamp

interface LogEntry {
  orderId: string;
  carrierId: string;
  action: "dispatch" | "webhook" | "cancel";
  success: boolean;
  attempts?: number;
  durationMs?: number;
  errorCode?: string;
  errorCategory?: string;
  errorMessage?: string;
  retryable?: boolean;
  requestPayload: unknown;
  responsePayload: unknown;
}

async function writeShippingLog(entry: LogEntry): Promise<void> {
  try {
    await adminDb.collection(SHIPMENT_LOGS).add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Log writing must never block or crash the main flow
    console.error("[Shipping] Failed to write shipping log:", err);
  }
}
