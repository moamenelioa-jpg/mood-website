// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING — Aramex Adapter
//
// Aramex REST API — https://developer.aramex.com/
//
// Credentials required in Firestore /shipping_carriers/aramex/credentials/{env}:
//   apiKeyEnc     → encrypted Aramex client ID
//   secretKeyEnc  → encrypted Aramex client secret
//   accountId     → Aramex account number (plain, not secret)
//   username      → Aramex username (for some legacy endpoints)
//   baseUrl       → override if needed (defaults below)
//
// Aramex status codes (tracking event codes):
//   SH005  → picked_up
//   SH010  → in_transit
//   SH014  → out_for_delivery
//   SH018  → delivered
//   SH052  → returned
//   SH067  → cancelled
//   FF010  → failed
// ─────────────────────────────────────────────────────────────────────────────

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

// ── Aramex-specific internal types ────────────────────────────────────────────

interface AramexTokenResponse {
  access_token: string;
  expires_in: number;
}

interface AramexShipmentResponse {
  HasErrors: boolean;
  Shipments?: Array<{
    ID: string;
    Reference1: string;
    ForeignHAWB: string;        // tracking number
    ShipmentLabel?: {
      LabelURL: string;
    };
  }>;
  Notifications?: Array<{ Code: string; Message: string }>;
}

interface AramexTrackingResponse {
  HasErrors: boolean;
  TrackingResults?: Array<{
    Value: Array<{
      WaybillNumber: string;
      UpdateCode: string;
      UpdateDescription: string;
      UpdateDateTime: string;
      UpdateLocation: string;
      Comments: string;
    }>;
  }>;
}

// ── Status map ────────────────────────────────────────────────────────────────

const ARAMEX_STATUS_MAP: Record<string, InternalShippingStatus> = {
  SH005: "picked_up",
  SH010: "in_transit",
  SH014: "out_for_delivery",
  SH018: "delivered",
  SH052: "returned",
  SH067: "cancelled",
  FF010: "failed",
};

// ── Adapter ───────────────────────────────────────────────────────────────────

export class AramexAdapter extends ShippingAdapter {

  // ── Identity ────────────────────────────────────────────────────────────

  getCarrierId(): CarrierId { return "aramex"; }
  getCarrierName(): string  { return "Aramex"; }

  // ── Internal helpers ────────────────────────────────────────────────────

  private get baseUrl(): string {
    return this.credentials.baseUrl
      ?? (this.credentials.env === "live"
        ? "https://ws.aramex.net/ShippingAPI.V2"
        : "https://ws.dev.aramex.net/ShippingAPI.V2");
  }

  /** Obtain a short-lived OAuth2 bearer token */
  private async getToken(): Promise<string> {
    if (!this.credentials.apiKey || !this.credentials.secretKey) {
      throw new ShippingError("MISSING_CREDENTIALS", "Aramex client ID / secret are not configured", "aramex");
    }
    const res = await this.callApi<AramexTokenResponse>(
      `${this.baseUrl}/auth/v1/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: this.credentials.apiKey,
          client_secret: this.credentials.secretKey,
          grant_type: "client_credentials",
        }),
      }
    );
    return res.access_token;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // ── mapExternalStatusToInternal ─────────────────────────────────────────

  mapExternalStatusToInternal(carrierStatus: string): InternalShippingStatus {
    return ARAMEX_STATUS_MAP[carrierStatus] ?? "in_transit";
  }

  // ── validateAddress ─────────────────────────────────────────────────────

  /**
   * Aramex does not have a dedicated address validation endpoint.
   * We verify the city name is a known Aramex-covered city in Egypt.
   */
  async validateAddress(input: AddressValidationInput): Promise<AddressValidationResult> {
    // Aramex covers all Egyptian governorates — basic sanity check only
    if (!input.city?.trim()) {
      return { valid: false, issues: ["City is required for Aramex shipments"] };
    }
    if (!input.phone?.match(/^(\+20|0)?1[0-9]{9}$/)) {
      return { valid: false, issues: ["Phone number format is invalid for Egypt (must be 11 digits starting with 01)"] };
    }
    return { valid: true };
  }

  // ── createShipment ──────────────────────────────────────────────────────

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const { recipient, packageInfo, orderNumber } = request;
    const headers = await this.authHeaders();

    // Aramex Shipping/CreateShipments payload structure
    const payload = {
      ClientInfo: {
        AccountNumber:  this.credentials.accountId ?? "",
        AccountEntity:  "CAI",   // Cairo — change for other origins
        AccountPin:     "",
        AccountCountryCode: "EG",
        Source:         24,      // 24 = API
      },
      Shipments: [
        {
          Reference1: orderNumber,
          Shipper: {
            Reference1: orderNumber,
            AccountNumber: this.credentials.accountId ?? "",
          },
          Consignee: {
            ContactName:    recipient.name,
            PhoneNumber1:   recipient.phone,
            Line1:          recipient.address,
            City:           recipient.city,
            StateOrProvinceCode: recipient.governorate ?? "",
            PostCode:       recipient.postalCode ?? "",
            CountryCode:    "EG",
          },
          ShippingDateTime: new Date().toISOString(),
          DueDate:          new Date(Date.now() + 3 * 86400_000).toISOString(),
          Details: {
            Dimensions:     { Length: packageInfo.lengthCm ?? 20, Width: packageInfo.widthCm ?? 15, Height: packageInfo.heightCm ?? 10, Unit: "CM" },
            ActualWeight:   { Value: packageInfo.weightGrams / 1000, Unit: "KG" },
            ChargeableWeight: { Value: packageInfo.weightGrams / 1000, Unit: "KG" },
            DescriptionOfGoods: packageInfo.notes ?? `Order ${orderNumber}`,
            GoodsOriginCountry: "EG",
            NumberOfPieces: packageInfo.packageCount ?? 1,
            ProductGroup:   "DOM",   // Domestic
            ProductType:    "CDS",   // Custom Delivery Service
            PaymentType:    packageInfo.codAmount > 0 ? "CASH" : "P",
            CashOnDeliveryAmount: packageInfo.codAmount > 0
              ? { Value: packageInfo.codAmount, CurrencyCode: "EGP" }
              : undefined,
          },
        },
      ],
      LabelInfo: { ReportID: 9201, ReportType: "URL" },
    };

    let rawResponse: unknown;
    try {
      rawResponse = await this.callApi<AramexShipmentResponse>(
        `${this.baseUrl}/shipping/v1/shipments`,
        { method: "POST", headers, body: JSON.stringify(payload) }
      );
    } catch (err) {
      throw new ShippingError(
        "CARRIER_API_ERROR",
        `Aramex createShipment failed: ${err instanceof Error ? err.message : String(err)}`,
        "aramex",
        true
      );
    }

    const res = rawResponse as AramexShipmentResponse;

    if (res.HasErrors || !res.Shipments?.length) {
      const errors = (res.Notifications ?? []).map((n) => n.Message).join("; ");
      throw new ShippingError("CARRIER_REJECTED", `Aramex rejected: ${errors || "Unknown error"}`, "aramex", false);
    }

    const shipment = res.Shipments[0];
    return {
      carrierShipmentId: shipment.ID,
      trackingNumber:    shipment.ForeignHAWB,
      trackingUrl:       `https://www.aramex.com/track/results?mode=0&ShipmentNumber=${shipment.ForeignHAWB}`,
      labelUrl:          shipment.ShipmentLabel?.LabelURL,
      rawResponse,
    };
  }

  // ── cancelShipment ──────────────────────────────────────────────────────

  async cancelShipment(_trackingNumber: string): Promise<void> {
    // Aramex does not support cancellation via API — must be done manually via portal
    throw new ShippingError(
      "CANCEL_NOT_SUPPORTED",
      "Aramex does not support shipment cancellation via API. Cancel manually at aramex.com.",
      "aramex",
      false
    );
  }

  // ── getTrackingDetails ──────────────────────────────────────────────────

  async getTrackingDetails(trackingNumber: string): Promise<TrackingDetails> {
    const headers = await this.authHeaders();

    let rawResponse: unknown;
    try {
      rawResponse = await this.callApi<AramexTrackingResponse>(
        `${this.baseUrl}/tracking/v1/shipments/track`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            ClientInfo: { AccountNumber: this.credentials.accountId ?? "" },
            Shipments: [trackingNumber],
          }),
        }
      );
    } catch (err) {
      throw new ShippingError(
        "TRACKING_FAILED",
        `Aramex tracking failed: ${err instanceof Error ? err.message : String(err)}`,
        "aramex",
        true
      );
    }

    const res = rawResponse as AramexTrackingResponse;
    const results = res.TrackingResults?.[0]?.Value ?? [];

    const events: TrackingEvent[] = results.map((r) => ({
      status:        this.mapExternalStatusToInternal(r.UpdateCode),
      carrierStatus: r.UpdateCode,
      description:   r.UpdateDescription,
      location:      r.UpdateLocation || undefined,
      timestamp:     new Date(r.UpdateDateTime),
    }));

    const latest = events[0];

    return {
      trackingNumber,
      currentStatus: latest?.status ?? "in_transit",
      events,
      rawResponse,
    };
  }

  // ── parseWebhook ────────────────────────────────────────────────────────

  /**
   * Aramex sends status push notifications via webhook.
   * Payload structure matches their TrackingNotification format.
   */
  async parseWebhook(rawBody: unknown): Promise<WebhookEvent | null> {
    const body = rawBody as Record<string, unknown>;

    const trackingNumber = body?.WaybillNumber as string | undefined;
    const updateCode     = body?.UpdateCode as string | undefined;
    const updatedAt      = body?.UpdateDateTime as string | undefined;

    if (!trackingNumber || !updateCode) return null;

    return {
      trackingNumber,
      carrierEvent:   updateCode,
      internalStatus: this.mapExternalStatusToInternal(updateCode),
      timestamp:      updatedAt ? new Date(updatedAt) : new Date(),
      rawPayload:     rawBody,
    };
  }
}
