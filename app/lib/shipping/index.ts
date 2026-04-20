// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING MODULE — Public API
//
// Everything the rest of the application needs is exported from here.
// Import from "@/app/lib/shipping" — never from deep paths like
// "@/app/lib/shipping/adapters/bosta" directly.
// ─────────────────────────────────────────────────────────────────────────────

// Types
export type {
  CarrierId,
  CarrierInfo,
  CarrierCredentials,
  ShipmentRecipient,
  ShipmentPackage,
  ShipmentRequest,
  ShipmentResult,
  AddressValidationInput,
  AddressValidationResult,
  TrackingEvent,
  TrackingDetails,
  InternalShippingStatus,
  WebhookEvent,
  DispatchInput,
} from "./types";

export { ShippingError } from "./types";

// Service (business logic)
export { dispatchShipment, handleWebhookEvent } from "./service";

// Registry (adapter resolution)
export { getAdapter, getRegisteredCarriers } from "./registry";

// Credential utilities (server-only — never import on client)
export { encrypt, decrypt } from "./crypto";
