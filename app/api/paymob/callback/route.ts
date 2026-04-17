import { NextRequest, NextResponse } from "next/server";
import {
  getFirestoreOrderByNumber,
  updateFirestoreOrder,
} from "@/app/lib/firestore-orders-admin";
import { verifyPaymobHmac } from "@/app/lib/paymob";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────
// Paymob callback payload types
// ─────────────────────────────────────────────────────────────

interface PaymobSourceData {
  pan?: string;
  sub_type?: string;
  type?: string;
}

interface PaymobOrderExtras {
  order_number?: string;
  [key: string]: unknown;
}

interface PaymobOrder {
  id?: string | number;
  merchant_order_id?: string;
  extras?: PaymobOrderExtras;
}

interface PaymobPaymentKeyClaims {
  extra?: {
    order_number?: string;
    [key: string]: unknown;
  };
}

interface PaymobTransactionData {
  message?: string;
  [key: string]: unknown;
}

/**
 * Represents the `obj` field inside a Paymob server-to-server callback body.
 * All fields are optional because Paymob docs leave some situationally absent.
 */
interface PaymobTransaction {
  id?: string | number;
  success?: boolean;
  pending?: boolean;
  amount_cents?: number;
  currency?: string;
  created_at?: string;
  error_occured?: boolean;
  has_parent_transaction?: boolean;
  integration_id?: number;
  is_3d_secure?: boolean;
  is_auth?: boolean;
  is_capture?: boolean;
  is_refunded?: boolean;
  is_standalone_payment?: boolean;
  is_voided?: boolean;
  owner?: string | number;
  order?: PaymobOrder;
  source_data?: PaymobSourceData;
  payment_key_claims?: PaymobPaymentKeyClaims;
  data?: PaymobTransactionData;
}

/** Top-level shape of the Paymob server-to-server POST body. */
interface PaymobCallbackBody {
  obj?: PaymobTransaction;
  type?: string;
}

// ─────────────────────────────────────────────────────────────
// Body parsing — tolerates JSON and form-encoded payloads
// ─────────────────────────────────────────────────────────────

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

async function parseCallbackBody(req: NextRequest): Promise<PaymobCallbackBody | null> {
  const rawBody = await req.text();
  const body = rawBody.trim();

  if (!body) return null;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(body);

    // Paymob may encode the whole transaction as an `obj` param
    const objParam = params.get("obj");
    if (objParam) {
      const parsed = tryParseJson(objParam);
      if (isPlainObject(parsed)) {
        return { obj: parsed as PaymobTransaction };
      }
    }

    // Some integrations wrap it in `payload` or `data`
    const payloadParam = params.get("payload") ?? params.get("data");
    if (payloadParam) {
      const parsed = tryParseJson(payloadParam);
      if (isPlainObject(parsed)) {
        return parsed as PaymobCallbackBody;
      }
    }

    return null;
  }

  // Default: JSON (application/json or unknown content-type)
  const parsed = tryParseJson(body);
  if (isPlainObject(parsed)) {
    return parsed as PaymobCallbackBody;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// POST — server-to-server webhook from Paymob
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await parseCallbackBody(req);

    if (!body) {
      console.error("[Paymob Callback] Empty or non-object body", {
        contentType: req.headers.get("content-type"),
      });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const txn: PaymobTransaction | undefined = body.obj;

    if (!txn || typeof txn !== "object") {
      console.error("[Paymob Callback] Missing transaction object (body.obj)", body);
      return NextResponse.json({ error: "Missing transaction object" }, { status: 400 });
    }

    const txnId = txn.id != null ? String(txn.id) : null;
    const txnSuccess = txn.success === true;

    console.log("[Paymob Callback] Transaction ID:", txnId, "Success:", txnSuccess);

    // Verify HMAC when present
    const hmac = new URL(req.url).searchParams.get("hmac") ?? "";
    if (hmac) {
      // verifyPaymobHmac expects Record<string,unknown> — safe cast because
      // PaymobTransaction is a strict subset of that shape.
      const txnRecord = txn as Record<string, unknown>;
      if (!verifyPaymobHmac(txnRecord, hmac)) {
        console.error("[Paymob Callback] HMAC verification failed");
        return NextResponse.json({ error: "Invalid HMAC" }, { status: 403 });
      }
    }

    // Extract our internal order number from wherever Paymob puts it
    const orderNumber: string | undefined =
      txn.order?.extras?.order_number ??
      txn.order?.merchant_order_id ??
      txn.payment_key_claims?.extra?.order_number;

    if (!orderNumber) {
      console.error("[Paymob Callback] Could not extract order number from transaction", txn);
      return NextResponse.json({ error: "No order number" }, { status: 400 });
    }

    const order = await getFirestoreOrderByNumber(orderNumber);
    if (!order) {
      console.error("[Paymob Callback] Order not found:", orderNumber);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const paymobOrderId =
      txn.order?.id != null ? String(txn.order.id) : "";

    const updateData: Record<string, unknown> = {
      paymobTransactionId: txnId ?? "",
      paymobOrderId,
    };

    if (txnSuccess) {
      updateData.paymentStatus = "paid";
      updateData.orderStatus = "confirmed";
      console.log("[Paymob Callback] Payment SUCCESS for order:", orderNumber);
    } else {
      updateData.paymentStatus = "failed";
      const errorMessage = txn.data?.message;
      console.log(
        "[Paymob Callback] Payment FAILED for order:",
        orderNumber,
        "Error:",
        errorMessage,
      );
    }

    await updateFirestoreOrder(order.id, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Paymob Callback] Unhandled error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// GET — browser redirect from Paymob after payment
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const success = params.get("success") === "true";
  const txnId = params.get("id") ?? "";
  const orderId = params.get("order") ?? "";
  const merchantOrderId = params.get("merchant_order_id") ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  console.log("[Paymob Redirect] success:", success, "txnId:", txnId, "orderId:", orderId);

  const orderNumber = merchantOrderId || orderId;

  if (orderNumber) {
    const order = await getFirestoreOrderByNumber(orderNumber);

    if (order) {
      if (success) {
        await updateFirestoreOrder(order.id, {
          paymentStatus: "paid",
          orderStatus: "confirmed",
          paymobTransactionId: txnId,
        });
        return NextResponse.redirect(`${baseUrl}/success?order=${orderNumber}`);
      } else {
        await updateFirestoreOrder(order.id, {
          paymentStatus: "failed",
          paymobTransactionId: txnId,
        });
        return NextResponse.redirect(`${baseUrl}/cancel?order=${orderNumber}`);
      }
    }
  }

  return NextResponse.redirect(success ? `${baseUrl}/success` : `${baseUrl}/cancel`);
}
