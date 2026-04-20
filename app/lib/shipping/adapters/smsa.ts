// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING — SMSA Adapter  (stub — ready for implementation)
//
// SMSA Express — Saudi Arabia / GCC carrier
// Docs: https://www.smsaexpress.com/developer
//
// Credentials required in Firestore /shipping_carriers/smsa/credentials/{env}:
//   apiKeyEnc   → encrypted SMSA passkey
//   accountId   → SMSA sender code (plain)
//
// To complete implementation:
//   1. Replace all TODO comments with real SMSA API calls
//   2. Fill in SMSA_STATUS_MAP with actual status codes from SMSA docs
//   3. Register in registry.ts: smsa: (creds) => new SMSAAdapter(creds)
// ─────────────────────────────────────────────────────────────────────────────

import { ShippingAdapter } from "./base";
import { ShippingError } from "../types";
import type {
  CarrierId,
  InternalShippingStatus,
  ShipmentRequest,
  ShipmentResult,
  TrackingDetails,
  WebhookEvent,
} from "../types";

// Update this map with real SMSA status codes from their docs
const SMSA_STATUS_MAP: Record<string, InternalShippingStatus> = {
  "Picked Up":          "picked_up",
  "In Transit":         "in_transit",
  "Out for Delivery":   "out_for_delivery",
  "Delivered":          "delivered",
  "Returned":           "returned",
  "Shipment Cancelled": "cancelled",
};

export class SMSAAdapter extends ShippingAdapter {

  getCarrierId(): CarrierId { return "smsa"; }
  getCarrierName(): string  { return "SMSA Express"; }

  private get baseUrl(): string {
    return this.credentials.baseUrl
      ?? "https://www.smsaexpress.com/api";  // TODO: confirm real API base URL
  }

  // ── mapExternalStatusToInternal ─────────────────────────────────────────

  mapExternalStatusToInternal(carrierStatus: string): InternalShippingStatus {
    return SMSA_STATUS_MAP[carrierStatus] ?? "in_transit";
  }

  // ── createShipment ──────────────────────────────────────────────────────

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    // TODO: Build SMSA-specific payload and call their Create Shipment API
    // See: https://www.smsaexpress.com/developer/api-create-shipment
    throw new ShippingError(
      "NOT_IMPLEMENTED",
      "SMSA createShipment is not yet implemented. See adapters/smsa.ts.",
      "smsa"
    );
    // Suppress TS unreachable warning — remove when implemented
    return request as never;
  }

  // ── cancelShipment ──────────────────────────────────────────────────────

  async cancelShipment(_trackingNumber: string): Promise<void> {
    // TODO: Call SMSA cancel endpoint
    throw new ShippingError("NOT_IMPLEMENTED", "SMSA cancelShipment is not yet implemented.", "smsa");
  }

  // ── getTrackingDetails ──────────────────────────────────────────────────

  async getTrackingDetails(trackingNumber: string): Promise<TrackingDetails> {
    // TODO: Call SMSA tracking API
    throw new ShippingError("NOT_IMPLEMENTED", "SMSA getTrackingDetails is not yet implemented.", "smsa");
    return trackingNumber as never;
  }

  // ── parseWebhook ────────────────────────────────────────────────────────

  async parseWebhook(rawBody: unknown): Promise<WebhookEvent | null> {
    // TODO: Parse SMSA webhook payload structure
    const body = rawBody as Record<string, unknown>;
    if (!body?.trackingNumber) return null;

    return {
      trackingNumber: body.trackingNumber as string,
      carrierEvent:   body.status as string ?? "",
      internalStatus: this.mapExternalStatusToInternal(body.status as string ?? ""),
      timestamp:      new Date(),
      rawPayload:     rawBody,
    };
  }
}
