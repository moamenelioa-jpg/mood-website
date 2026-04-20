// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING — Mock Adapter (development / testing)
//
// Returns realistic fake data instantly. No real API calls.
// Used when SHIPPING_ENV=test or no real carrier is configured.
// ─────────────────────────────────────────────────────────────────────────────

import { ShippingAdapter } from "./base";
import type {
  CarrierId,
  InternalShippingStatus,
  ShipmentRequest,
  ShipmentResult,
  TrackingDetails,
  WebhookEvent,
} from "../types";

const MOCK_STATUS_MAP: Record<string, InternalShippingStatus> = {
  PICKED_UP:        "picked_up",
  IN_TRANSIT:       "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED:        "delivered",
};

export class MockAdapter extends ShippingAdapter {

  getCarrierId(): CarrierId { return "mock"; }
  getCarrierName(): string  { return "Mock Carrier (Test)"; }

  mapExternalStatusToInternal(carrierStatus: string): InternalShippingStatus {
    return MOCK_STATUS_MAP[carrierStatus] ?? "in_transit";
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    await new Promise((r) => setTimeout(r, 200));
    const trackingNumber = `MOCK-${Date.now()}-${request.orderId.slice(-4).toUpperCase()}`;
    return {
      carrierShipmentId: `MOCK_SHP_${Date.now()}`,
      trackingNumber,
      trackingUrl: `https://mock-carrier.test/track/${trackingNumber}`,
      rawResponse: { mock: true, orderId: request.orderId, trackingNumber },
    };
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    console.log(`[MockAdapter] Cancelled shipment: ${trackingNumber}`);
  }

  async getTrackingDetails(trackingNumber: string): Promise<TrackingDetails> {
    return {
      trackingNumber,
      currentStatus: "in_transit",
      events: [
        {
          status: "picked_up",
          carrierStatus: "PICKED_UP",
          description: "Package picked up from sender",
          location: "Cairo Hub",
          timestamp: new Date(Date.now() - 3600_000),
        },
        {
          status: "in_transit",
          carrierStatus: "IN_TRANSIT",
          description: "Package is on its way",
          location: "Cairo → Alexandria Route",
          timestamp: new Date(),
        },
      ],
      rawResponse: { mock: true, trackingNumber },
    };
  }

  async parseWebhook(rawBody: unknown): Promise<WebhookEvent | null> {
    const body = rawBody as Record<string, unknown>;
    if (!body?.trackingNumber) return null;
    return {
      trackingNumber: body.trackingNumber as string,
      carrierEvent:   body.event as string ?? "DELIVERED",
      internalStatus: this.mapExternalStatusToInternal(body.event as string ?? ""),
      timestamp:      new Date(),
      rawPayload:     rawBody,
    };
  }
}

