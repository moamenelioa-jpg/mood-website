// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING — Abstract Base Adapter  (ShippingProviderInterface)
//
// Every carrier adapter MUST extend this class and implement all abstract methods.
// The service layer works exclusively through this interface — never directly
// with a concrete carrier class.
//
// Full interface contract:
//   validateAddress()              ← check coverage + normalize address before dispatch
//   createShipment()               ← create shipment with carrier (admin-triggered only)
//   cancelShipment()               ← cancel an existing shipment
//   getTrackingDetails()           ← poll carrier for current tracking events
//   parseWebhook()                 ← parse inbound carrier webhook into normalized event
//   mapExternalStatusToInternal()  ← map carrier status code → InternalShippingStatus
//
// To add a new carrier:
//   1. Create app/lib/shipping/adapters/<carrierId>.ts
//   2. Extend ShippingAdapter
//   3. Implement all abstract methods
//   4. Register in registry.ts  (one line)
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AddressValidationInput,
  AddressValidationResult,
  CarrierId,
  CarrierCredentials,
  InternalShippingStatus,
  ShipmentRequest,
  ShipmentResult,
  TrackingDetails,
  WebhookEvent,
} from "../types";

export abstract class ShippingAdapter {
  constructor(protected readonly credentials: CarrierCredentials) {}

  // ── Identity ──────────────────────────────────────────────────────────────

  /** Unique stable ID matching CarrierId union */
  abstract getCarrierId(): CarrierId;

  /** Human-readable name for logging and admin UI */
  abstract getCarrierName(): string;

  // ── Core Shipment Operations ──────────────────────────────────────────────

  /**
   * Validate a recipient address against the carrier's coverage network.
   * Call this BEFORE createShipment to surface address errors early.
   *
   * Returns { valid: true } if the address is in coverage zone.
   * Returns { valid: false, issues: [...] } with human-readable problems.
   *
   * Default implementation: skips validation (returns valid).
   * Override for carriers that provide an address validation API.
   */
  async validateAddress(
    _input: AddressValidationInput
  ): Promise<AddressValidationResult> {
    return { valid: true };
  }

  /**
   * Create a shipment with the carrier.
   * MUST only be called when the admin explicitly clicks Dispatch.
   * NEVER call this automatically on order creation.
   */
  abstract createShipment(request: ShipmentRequest): Promise<ShipmentResult>;

  /**
   * Cancel an existing shipment by tracking number.
   * Throw ShippingError("CANCEL_NOT_SUPPORTED") if the carrier doesn't allow it.
   */
  abstract cancelShipment(trackingNumber: string): Promise<void>;

  /**
   * Poll the carrier API for the latest tracking events.
   * Used for manual refresh or background status sync jobs.
   */
  abstract getTrackingDetails(trackingNumber: string): Promise<TrackingDetails>;

  /**
   * Parse a raw inbound webhook body from this carrier into a normalized WebhookEvent.
   * Returns null if the payload is a ping/test call or an unrecognized event type.
   */
  abstract parseWebhook(
    rawBody: unknown,
    signature?: string
  ): Promise<WebhookEvent | null>;

  /**
   * Map a carrier-specific status code/string to an InternalShippingStatus.
   * This is the single place where carrier vocabulary is translated.
   *
   * Example:
   *   Bosta:  "OUT_FOR_DELIVERY" → "out_for_delivery"
   *   Aramex: "SH014"            → "delivered"
   *   SMSA:   "Delivered"        → "delivered"
   */
  abstract mapExternalStatusToInternal(
    carrierStatus: string
  ): InternalShippingStatus;

  // ── Webhook Signature Verification ───────────────────────────────────────

  /**
   * Verify that a webhook request truly came from the carrier.
   * Default: returns true (no verification).
   * Override for carriers that send HMAC signatures.
   */
  protected verifyWebhookSignature(
    _rawBody: string,
    _signature: string
  ): boolean {
    return true;
  }

  // ── HTTP Helper ───────────────────────────────────────────────────────────

  /**
   * Make an HTTP call to the carrier API with automatic timeout.
   * Throws a plain Error on non-2xx responses (adapters should catch and wrap).
   */
  protected async callApi<T>(
    url: string,
    options: RequestInit,
    timeoutMs = 15000
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const body = await res.json() as T;
      if (!res.ok) {
        throw new Error(`Carrier API ${res.status}: ${JSON.stringify(body)}`);
      }
      return body;
    } finally {
      clearTimeout(timeout);
    }
  }
}

