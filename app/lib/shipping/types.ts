// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING MODULE — Shared Types
// All carrier adapters and the service layer use these types exclusively.
// No carrier-specific types should leak outside their adapter file.
// ─────────────────────────────────────────────────────────────────────────────

// ── Carrier IDs ──────────────────────────────────────────────────────────────

export type CarrierId = "bosta" | "aramex" | "smsa" | "mock";

export interface CarrierInfo {
  id: CarrierId;
  name: string;
  type: "express" | "standard" | "same_day";
  active: boolean;
}

// ── Shipment Request ─────────────────────────────────────────────────────────
// Normalized input sent from the service layer to every adapter.
// Adapters translate this into their own carrier-specific payload.

export interface ShipmentRecipient {
  name: string;
  phone: string;
  address: string;
  city: string;
  governorate?: string;
  postalCode?: string;
}

export interface ShipmentPackage {
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  /** COD amount in local currency. 0 = prepaid, >0 = collect on delivery. */
  codAmount: number;
  /** Number of items/packages */
  packageCount?: number;
  notes?: string;
}

export interface ShipmentRequest {
  /** Your internal order ID (Firestore doc ID) */
  orderId: string;
  /** Human-readable order number e.g. MOOD-20260420-001 */
  orderNumber: string;
  recipient: ShipmentRecipient;
  packageInfo: ShipmentPackage;
  /** ISO currency code */
  currency?: string;
}

// ── Shipment Result ───────────────────────────────────────────────────────────
// Normalized output every adapter must return on success.

export interface ShipmentResult {
  /** Carrier's internal shipment/delivery ID */
  carrierShipmentId: string;
  /** Public tracking number shown to customers */
  trackingNumber: string;
  /** Direct tracking page URL (optional — not all carriers provide one) */
  trackingUrl?: string;
  /** Hosted label URL if carrier provides one */
  labelUrl?: string;
  /** Base64-encoded label PDF/PNG for direct printing */
  labelBase64?: string;
  /** Full raw response from carrier API — stored for audit/debug */
  rawResponse: unknown;
}

// ── Carrier Credentials ───────────────────────────────────────────────────────
// Decrypted credentials passed to the adapter at call time.
// Never stored in this form — only exists in memory briefly.

export interface CarrierCredentials {
  apiKey?: string;
  secretKey?: string;
  accountId?: string;
  username?: string;
  baseUrl?: string;
  webhookSecret?: string;
  env: "test" | "live";
}

// ── Shipping Status ───────────────────────────────────────────────────────────
// Internal canonical status values. Carrier events are mapped to these.

export type InternalShippingStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "cancelled"
  | "failed";

// ── Webhook Event ─────────────────────────────────────────────────────────────
// Normalized webhook payload every adapter must parse and return.

export interface WebhookEvent {
  trackingNumber: string;
  carrierEvent: string;
  internalStatus: InternalShippingStatus;
  timestamp: Date;
  /**
   * Carrier-supplied unique event ID for idempotency.
   * Not all carriers provide this — adapters should set it when available.
   * Stored as order.lastWebhookEventId to deduplicate redelivered webhooks.
   */
  eventId?: string;
  /** Raw webhook body for logging */
  rawPayload: unknown;
}

// ── Address Validation ────────────────────────────────────────────────────────
// Input and output for validateAddress()

export interface AddressValidationInput {
  name: string;
  phone: string;
  address: string;
  city: string;
  governorate?: string;
  postalCode?: string;
}

export interface AddressValidationResult {
  valid: boolean;
  /** Carrier-normalized address fields (may differ from input) */
  normalizedAddress?: Partial<AddressValidationInput>;
  /** Coverage zone ID returned by carrier (used when creating shipment) */
  zoneId?: string;
  /** Human-readable issues if invalid */
  issues?: string[];
  /** Full raw carrier response for debugging */
  rawResponse?: unknown;
}

// ── Tracking Details ──────────────────────────────────────────────────────────
// Output for getTrackingDetails()

export interface TrackingEvent {
  status: InternalShippingStatus;
  carrierStatus: string;
  description: string;
  location?: string;
  timestamp: Date;
}

export interface TrackingDetails {
  trackingNumber: string;
  currentStatus: InternalShippingStatus;
  estimatedDelivery?: Date;
  events: TrackingEvent[];          // most recent first
  rawResponse: unknown;
}

// ── Dispatch Input ────────────────────────────────────────────────────────────
// What the admin sends to POST /api/admin/orders/[id]/ship

export interface DispatchInput {
  carrierId: CarrierId;
  recipient: ShipmentRecipient;
  packageInfo: ShipmentPackage;
}

// ── Error Classification ──────────────────────────────────────────────────────
//
// Every error code has a category. The category drives:
//   - Whether the admin sees a "Retry" button
//   - Which HTTP status the API route returns
//   - How the error is displayed in the dashboard

export type ShippingErrorCategory =
  | "validation"      // bad input — fix the form, no retry
  | "configuration"   // missing credentials / bad setup — admin must fix settings
  | "order_state"     // wrong order status / already dispatched
  | "carrier_reject"  // carrier rejected the request (bad address, weight limit, etc.)
  | "carrier_timeout" // carrier API timed out — safe to retry
  | "carrier_error"   // carrier returned 5xx — may retry
  | "auth"            // API key invalid or expired
  | "unknown";        // unexpected / unclassified

export interface ShippingErrorMeta {
  category: ShippingErrorCategory;
  /** Whether the admin should see a Retry button */
  retryable: boolean;
  /** HTTP status code the API route should return */
  httpStatus: number;
  /** Short human-readable label for the dashboard */
  adminLabel: string;
}

/**
 * Central catalog — maps every error code to its metadata.
 * Used by the API route (HTTP status), the service (retry logic), and the UI (display).
 */
export const SHIPPING_ERROR_CATALOG: Record<string, ShippingErrorMeta> = {
  // ── Order state errors ───────────────────────────────────────────────────
  ORDER_NOT_FOUND:          { category: "order_state",     retryable: false, httpStatus: 404, adminLabel: "Order not found" },
  ORDER_NOT_DISPATCHABLE:   { category: "order_state",     retryable: false, httpStatus: 422, adminLabel: "Order not ready for dispatch" },
  ALREADY_DISPATCHED:       { category: "order_state",     retryable: false, httpStatus: 409, adminLabel: "Already dispatched" },

  // ── Validation errors ────────────────────────────────────────────────────
  VALIDATION_FAILED:        { category: "validation",      retryable: false, httpStatus: 400, adminLabel: "Missing or invalid fields" },
  WEIGHT_EXCEEDED:          { category: "validation",      retryable: false, httpStatus: 400, adminLabel: "Package too heavy for carrier" },
  ADDRESS_INVALID:          { category: "carrier_reject",  retryable: false, httpStatus: 400, adminLabel: "Address not in coverage zone" },

  // ── Authentication errors ────────────────────────────────────────────────
  NO_CREDENTIALS:           { category: "configuration",   retryable: false, httpStatus: 503, adminLabel: "Carrier not configured" },
  MISSING_CREDENTIALS:      { category: "configuration",   retryable: false, httpStatus: 503, adminLabel: "API key missing" },
  AUTH_FAILED:              { category: "auth",            retryable: false, httpStatus: 503, adminLabel: "Carrier authentication failed" },

  // ── Carrier API errors ───────────────────────────────────────────────────
  CARRIER_REJECTED:         { category: "carrier_reject",  retryable: false, httpStatus: 400, adminLabel: "Carrier rejected request" },
  CARRIER_API_ERROR:        { category: "carrier_error",   retryable: true,  httpStatus: 502, adminLabel: "Carrier API error" },
  CARRIER_TIMEOUT:          { category: "carrier_timeout", retryable: true,  httpStatus: 502, adminLabel: "Carrier timed out" },
  CARRIER_UNAVAILABLE:      { category: "carrier_error",   retryable: true,  httpStatus: 503, adminLabel: "Carrier temporarily unavailable" },

  // ── Webhook errors ───────────────────────────────────────────────────────
  WEBHOOK_SIGNATURE_INVALID:{ category: "auth",            retryable: false, httpStatus: 401, adminLabel: "Webhook signature mismatch" },
  WEBHOOK_MALFORMED:        { category: "validation",      retryable: false, httpStatus: 400, adminLabel: "Malformed webhook payload" },

  // ── Misc ─────────────────────────────────────────────────────────────────
  CANCEL_NOT_SUPPORTED:     { category: "carrier_reject",  retryable: false, httpStatus: 400, adminLabel: "Carrier does not support cancellation" },
  CANCEL_FAILED:            { category: "carrier_error",   retryable: true,  httpStatus: 502, adminLabel: "Cancellation failed" },
  NOT_IMPLEMENTED:          { category: "configuration",   retryable: false, httpStatus: 503, adminLabel: "Not implemented for this carrier" },
  UNKNOWN_ERROR:            { category: "unknown",         retryable: true,  httpStatus: 500, adminLabel: "Unknown error" },
};

/** Look up metadata for a code. Falls back to UNKNOWN_ERROR if not in catalog. */
export function getErrorMeta(code: string): ShippingErrorMeta {
  return SHIPPING_ERROR_CATALOG[code] ?? SHIPPING_ERROR_CATALOG["UNKNOWN_ERROR"];
}

// ── Structured Error ──────────────────────────────────────────────────────────

export class ShippingError extends Error {
  public readonly category: ShippingErrorCategory;
  public readonly retryable: boolean;

  constructor(
    public readonly code: string,
    message: string,
    public readonly carrierId?: string,
    /** Override retryable — if omitted, derived from catalog */
    retryableOverride?: boolean
  ) {
    super(message);
    this.name = "ShippingError";
    const meta = getErrorMeta(code);
    this.category = meta.category;
    this.retryable = retryableOverride ?? meta.retryable;
  }
}
