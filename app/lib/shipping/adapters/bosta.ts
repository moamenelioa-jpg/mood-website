// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING — Bosta Adapter
//
// Bosta API v2 — Egyptian last-mile delivery
// Docs: https://docs.bosta.co/
//
// Credentials required in Firestore /shipping_carriers/bosta/credentials/{env}:
//   apiKeyEnc      → encrypted Bosta API key
//   env            → "test" | "live"
//
// Status mapping:
//   PACKAGE_RECEIVED      → picked_up
//   PACKAGE_IN_TRANSIT    → in_transit
//   OUT_FOR_DELIVERY      → out_for_delivery
//   DELIVERED             → delivered
//   DELIVERY_FAILED       → in_transit  (re-attempt pending)
//   RETURNED_TO_ORIGIN    → returned
//   CANCELLED             → cancelled
//   LOST                  → failed
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac } from "crypto";
import { ShippingAdapter } from "./base";
import { ShippingError } from "../types";
import type {
  AddressValidationInput,
  AddressValidationResult,
  CarrierId,
  InternalShippingStatus,
  ShipmentRequest,
  ShipmentResult,
  TrackingDetails,
  TrackingEvent,
  WebhookEvent,
} from "../types";

// ── Bosta-specific internal types ─────────────────────────────────────────────

interface BostaDelivery {
  _id: string;
  trackingNumber: string;
  awbLabel?: { url?: string; base64?: string };
}

interface BostaCreateResponse {
  success: boolean;
  message?: string;
  delivery?: BostaDelivery;
}

interface BostaCityResponse {
  success: boolean;
  data?: { _id: string; name: string; otherName?: string }[];
}

interface BostaTrackingResponse {
  success: boolean;
  delivery?: {
    trackingNumber: string;
    state?: { code: string; value: string };
    promisedDate?: string;
    timeline?: Array<{
      state: { code: string; value: string };
      hub?: { name: string };
      createdAt: string;
    }>;
  };
}

interface BostaWebhookPayload {
  trackingNumber: string;
  state: { code: string; value: string };
  updatedAt?: string;
  /** Bosta includes _id on webhook events — use as idempotency key */
  _id?: string;
}

// ── Status map ────────────────────────────────────────────────────────────────

const BOSTA_STATUS_MAP: Record<string, InternalShippingStatus> = {
  PACKAGE_RECEIVED:   "picked_up",
  PACKAGE_IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY:   "out_for_delivery",
  DELIVERED:          "delivered",
  DELIVERY_FAILED:    "in_transit",
  RETURNED_TO_ORIGIN: "returned",
  CANCELLED:          "cancelled",
  LOST:               "failed",
};

// ── Adapter ───────────────────────────────────────────────────────────────────

export class BostaAdapter extends ShippingAdapter {

  // ── Identity ────────────────────────────────────────────────────────────

  getCarrierId(): CarrierId { return "bosta"; }
  getCarrierName(): string  { return "Bosta"; }

  // ── Internal helpers ────────────────────────────────────────────────────

  private get baseUrl(): string {
    return this.credentials.env === "live"
      ? "https://app.bosta.co/api/v2"
      : "https://staging.bosta.co/api/v2";
  }

  private get headers(): Record<string, string> {
    if (!this.credentials.apiKey) {
      throw new ShippingError("MISSING_CREDENTIALS", "Bosta API key is not configured", "bosta");
    }
    return { "Content-Type": "application/json", Authorization: this.credentials.apiKey };
  }

  private getDimSize(weightGrams: number): string {
    if (weightGrams <= 500)  return "SMALL";
    if (weightGrams <= 2000) return "MEDIUM";
    if (weightGrams <= 10000) return "LARGE";
    return "XLARGE";
  }

  // ── mapExternalStatusToInternal ─────────────────────────────────────────

  /**
   * Translates any Bosta state code into the internal canonical status.
   * Unknown codes default to "in_transit" so the order is never stuck.
   */
  mapExternalStatusToInternal(carrierStatus: string): InternalShippingStatus {
    return BOSTA_STATUS_MAP[carrierStatus] ?? "in_transit";
  }

  // ── validateAddress ─────────────────────────────────────────────────────

  /**
   * Checks if the recipient city is covered by Bosta by querying their
   * cities API. If the city is not found, returns invalid + a useful message.
   */
  async validateAddress(input: AddressValidationInput): Promise<AddressValidationResult> {
    let rawResponse: unknown;
    try {
      rawResponse = await this.callApi<BostaCityResponse>(
        `${this.baseUrl}/cities`,
        { method: "GET", headers: this.headers }
      );
    } catch {
      // If cities API fails, allow dispatch to proceed (non-blocking validation)
      return { valid: true };
    }

    const res = rawResponse as BostaCityResponse;
    const cities = res.data ?? [];
    const inputCity = input.city.trim().toLowerCase();

    const match = cities.find(
      (c) =>
        c.name.toLowerCase() === inputCity ||
        (c.otherName ?? "").toLowerCase() === inputCity
    );

    if (!match) {
      return {
        valid: false,
        issues: [
          `City "${input.city}" is not in Bosta's coverage zone. ` +
          `Available cities: ${cities.slice(0, 5).map((c) => c.name).join(", ")}...`,
        ],
        rawResponse,
      };
    }

    return {
      valid: true,
      normalizedAddress: { city: match.name },
      zoneId: match._id,
      rawResponse,
    };
  }

  // ── createShipment ──────────────────────────────────────────────────────

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const { recipient, packageInfo, orderNumber } = request;

    const payload = {
      type: packageInfo.codAmount > 0 ? 10 : 25,
      specs: {
        packageType: "Parcel",
        size: this.getDimSize(packageInfo.weightGrams),
        weight: packageInfo.weightGrams / 1000,
        numOfItems: packageInfo.packageCount ?? 1,
        description: packageInfo.notes ?? `Order ${orderNumber}`,
      },
      cod: packageInfo.codAmount > 0 ? { amount: packageInfo.codAmount } : undefined,
      dropOffAddress: {
        city: { nameAr: recipient.city, nameEn: recipient.city },
        firstLine: recipient.address,
        zone: recipient.governorate ?? "",
        district: "",
      },
      receiver: {
        firstName: recipient.name.split(" ")[0] ?? recipient.name,
        lastName: recipient.name.split(" ").slice(1).join(" ") || "-",
        phone: recipient.phone,
        email: "",
      },
      notes: packageInfo.notes ?? "",
      businessReference: orderNumber,
    };

    let rawResponse: unknown;
    try {
      rawResponse = await this.callApi<BostaCreateResponse>(
        `${this.baseUrl}/deliveries`,
        { method: "POST", headers: this.headers, body: JSON.stringify(payload) }
      );
    } catch (err) {
      throw new ShippingError(
        "CARRIER_API_ERROR",
        `Bosta createShipment failed: ${err instanceof Error ? err.message : String(err)}`,
        "bosta",
        true
      );
    }

    const res = rawResponse as BostaCreateResponse;
    if (!res.success || !res.delivery) {
      throw new ShippingError(
        "CARRIER_REJECTED",
        `Bosta rejected the shipment: ${res.message ?? "Unknown error"}`,
        "bosta",
        false
      );
    }

    const d = res.delivery;
    return {
      carrierShipmentId: d._id,
      trackingNumber: d.trackingNumber,
      trackingUrl: `https://bosta.co/tracking-shipment/${d.trackingNumber}`,
      labelUrl: d.awbLabel?.url,
      labelBase64: d.awbLabel?.base64,
      rawResponse,
    };
  }

  // ── cancelShipment ──────────────────────────────────────────────────────

  async cancelShipment(trackingNumber: string): Promise<void> {
    try {
      await this.callApi(
        `${this.baseUrl}/deliveries/${trackingNumber}`,
        { method: "DELETE", headers: this.headers }
      );
    } catch (err) {
      throw new ShippingError(
        "CANCEL_FAILED",
        `Bosta cancel failed: ${err instanceof Error ? err.message : String(err)}`,
        "bosta",
        false
      );
    }
  }

  // ── getTrackingDetails ──────────────────────────────────────────────────

  async getTrackingDetails(trackingNumber: string): Promise<TrackingDetails> {
    let rawResponse: unknown;
    try {
      rawResponse = await this.callApi<BostaTrackingResponse>(
        `${this.baseUrl}/deliveries/business/tracking/${trackingNumber}`,
        { method: "GET", headers: this.headers }
      );
    } catch (err) {
      throw new ShippingError(
        "TRACKING_FAILED",
        `Bosta tracking failed: ${err instanceof Error ? err.message : String(err)}`,
        "bosta",
        true
      );
    }

    const res = rawResponse as BostaTrackingResponse;
    if (!res.success || !res.delivery) {
      throw new ShippingError("TRACKING_NOT_FOUND", `Tracking number ${trackingNumber} not found on Bosta`, "bosta");
    }

    const d = res.delivery;
    const currentStatus = this.mapExternalStatusToInternal(d.state?.code ?? "");

    const events: TrackingEvent[] = (d.timeline ?? []).map((t) => ({
      status: this.mapExternalStatusToInternal(t.state.code),
      carrierStatus: t.state.code,
      description: t.state.value,
      location: t.hub?.name,
      timestamp: new Date(t.createdAt),
    }));

    return {
      trackingNumber,
      currentStatus,
      estimatedDelivery: d.promisedDate ? new Date(d.promisedDate) : undefined,
      events,
      rawResponse,
    };
  }

  // ── parseWebhook ────────────────────────────────────────────────────────

  async parseWebhook(rawBody: unknown, signature?: string): Promise<WebhookEvent | null> {
    if (this.credentials.webhookSecret && signature) {
      const valid = this.verifyWebhookSignature(JSON.stringify(rawBody), signature);
      if (!valid) {
        throw new ShippingError("INVALID_WEBHOOK_SIGNATURE", "Bosta webhook signature verification failed", "bosta");
      }
    }

    const body = rawBody as BostaWebhookPayload;
    if (!body?.trackingNumber || !body?.state?.code) return null;

    return {
      trackingNumber: body.trackingNumber,
      carrierEvent:   body.state.code,
      internalStatus: this.mapExternalStatusToInternal(body.state.code),
      timestamp:      body.updatedAt ? new Date(body.updatedAt) : new Date(),
      eventId:        body._id,   // ← idempotency key
      rawPayload:     rawBody,
    };
  }

  // ── verifyWebhookSignature ──────────────────────────────────────────────

  protected verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.credentials.webhookSecret) return true;
    const expected = createHmac("sha256", this.credentials.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  }
}

//
// Bosta API v2 — Egyptian last-mile delivery
// Docs: https://docs.bosta.co/
//
// Credentials required in CarrierCredential (Firestore):
//   apiKeyEnc    → encrypted Bosta API key
//   env          → "test" | "live"
//
// Webhook events mapped:
//   PACKAGE_RECEIVED      → picked_up
//   PACKAGE_IN_TRANSIT    → in_transit
//   OUT_FOR_DELIVERY      → out_for_delivery
//   DELIVERED             → delivered
//   DELIVERY_FAILED       → in_transit  (re-attempt pending)
//   RETURNED_TO_ORIGIN    → returned
//   CANCELLED             → cancelled
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac } from "crypto";
import { ShippingAdapter } from "./base";
import { ShippingError } from "../types";
import type {
  CarrierId,
  ShipmentRequest,
  ShipmentResult,
  WebhookEvent,
  InternalShippingStatus,
} from "../types";

// Bosta-specific response types (internal — not exported)
interface BostaDelivery {
  _id: string;
  trackingNumber: string;
  awbLabel?: {
    url?: string;
    base64?: string;
  };
}

interface BostaCreateResponse {
  success: boolean;
  message?: string;
  delivery?: BostaDelivery;
}

interface BostaWebhookPayload {
  trackingNumber: string;
  state: {
    code: string;
    value: string;
  };
  updatedAt?: string;
}

// Map Bosta state codes to internal shipping statuses
const BOSTA_STATUS_MAP: Record<string, InternalShippingStatus> = {
  PACKAGE_RECEIVED: "picked_up",
  PACKAGE_IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  DELIVERY_FAILED: "in_transit",     // courier will retry
  RETURNED_TO_ORIGIN: "returned",
  CANCELLED: "cancelled",
  LOST: "failed",
};

export class BostaAdapter extends ShippingAdapter {
  private get baseUrl(): string {
    return this.credentials.env === "live"
      ? "https://app.bosta.co/api/v2"
      : "https://staging.bosta.co/api/v2";
  }

  private get headers(): Record<string, string> {
    if (!this.credentials.apiKey) {
      throw new ShippingError(
        "MISSING_CREDENTIALS",
        "Bosta API key is not configured",
        "bosta"
      );
    }
    return {
      "Content-Type": "application/json",
      Authorization: this.credentials.apiKey,
    };
  }

  getCarrierId(): CarrierId {
    return "bosta";
  }

  getCarrierName(): string {
    return "Bosta";
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const { recipient, packageInfo, orderNumber } = request;

    // Build Bosta-specific payload
    // See: https://docs.bosta.co/#create-delivery
    const payload = {
      type: packageInfo.codAmount > 0 ? 10 : 25, // 10 = COD, 25 = Prepaid
      specs: {
        packageType: "Parcel",
        size: this.getDimSize(packageInfo),
        weight: packageInfo.weightGrams / 1000, // Bosta uses kg
        numOfItems: packageInfo.packageCount ?? 1,
        description: packageInfo.notes ?? `Order ${orderNumber}`,
      },
      cod: packageInfo.codAmount > 0
        ? { amount: packageInfo.codAmount }
        : undefined,
      dropOffAddress: {
        city: { nameAr: recipient.city, nameEn: recipient.city },
        firstLine: recipient.address,
        zone: recipient.governorate ?? "",
        district: "",
      },
      receiver: {
        firstName: recipient.name.split(" ")[0] ?? recipient.name,
        lastName: recipient.name.split(" ").slice(1).join(" ") || "-",
        phone: recipient.phone,
        email: "",
      },
      notes: packageInfo.notes ?? "",
      businessReference: orderNumber,
    };

    let rawResponse: unknown;
    try {
      rawResponse = await this.callApi<BostaCreateResponse>(
        `${this.baseUrl}/deliveries`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(payload),
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ShippingError(
        "CARRIER_API_ERROR",
        `Bosta createShipment failed: ${msg}`,
        "bosta",
        true // retryable
      );
    }

    const res = rawResponse as BostaCreateResponse;

    if (!res.success || !res.delivery) {
      throw new ShippingError(
        "CARRIER_REJECTED",
        `Bosta rejected the shipment: ${res.message ?? "Unknown error"}`,
        "bosta",
        false
      );
    }

    const delivery = res.delivery;

    return {
      carrierShipmentId: delivery._id,
      trackingNumber: delivery.trackingNumber,
      trackingUrl: `https://bosta.co/tracking-shipment/${delivery.trackingNumber}`,
      labelUrl: delivery.awbLabel?.url,
      labelBase64: delivery.awbLabel?.base64,
      rawResponse,
    };
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    try {
      await this.callApi(
        `${this.baseUrl}/deliveries/${trackingNumber}`,
        { method: "DELETE", headers: this.headers }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ShippingError(
        "CANCEL_FAILED",
        `Bosta cancel failed: ${msg}`,
        "bosta",
        false
      );
    }
  }

  async parseWebhook(
    rawBody: unknown,
    signature?: string
  ): Promise<WebhookEvent | null> {
    // Verify HMAC signature if configured
    if (this.credentials.webhookSecret && signature) {
      const valid = this.verifyWebhookSignature(
        JSON.stringify(rawBody),
        signature
      );
      if (!valid) {
        throw new ShippingError(
          "INVALID_WEBHOOK_SIGNATURE",
          "Bosta webhook signature verification failed",
          "bosta"
        );
      }
    }

    const body = rawBody as BostaWebhookPayload;
    if (!body?.trackingNumber || !body?.state?.code) return null;

    const internalStatus: InternalShippingStatus =
      BOSTA_STATUS_MAP[body.state.code] ?? "in_transit";

    return {
      trackingNumber: body.trackingNumber,
      carrierEvent: body.state.code,
      internalStatus,
      timestamp: body.updatedAt ? new Date(body.updatedAt) : new Date(),
      rawPayload: rawBody,
    };
  }

  protected verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.credentials.webhookSecret) return true;
    const expected = createHmac("sha256", this.credentials.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return expected === signature;
  }

  /** Map package dimensions to Bosta's size categories */
  private getDimSize(pkg: ShipmentRequest["packageInfo"]): string {
    const w = pkg.weightGrams;
    if (w <= 500) return "SMALL";
    if (w <= 2000) return "MEDIUM";
    if (w <= 10000) return "LARGE";
    return "XLARGE";
  }
}
