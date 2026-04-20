// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING — Adapter Registry
//
// Maps carrierId strings to adapter instances.
// Credentials are loaded from Firestore and decrypted at call time.
//
// To add a new carrier: import its class, add one line to ADAPTER_FACTORIES.
// Nothing else in the codebase needs to change.
// ─────────────────────────────────────────────────────────────────────────────

import { adminDb } from "@/app/lib/firebase-admin";
import { decrypt } from "./crypto";
import { ShippingAdapter } from "./adapters/base";
import { BostaAdapter } from "./adapters/bosta";
import { AramexAdapter } from "./adapters/aramex";
import { MockAdapter } from "./adapters/mock";
// import { SMSAAdapter } from "./adapters/smsa";   // uncomment when ready
import type { CarrierId, CarrierCredentials } from "./types";
import { ShippingError } from "./types";

// ── Factory map ───────────────────────────────────────────────────────────────
// Add new carriers here. One line per carrier.
type AdapterFactory = (creds: CarrierCredentials) => ShippingAdapter;

const ADAPTER_FACTORIES: Record<string, AdapterFactory> = {
  bosta:  (creds) => new BostaAdapter(creds),
  aramex: (creds) => new AramexAdapter(creds),
  mock:   (creds) => new MockAdapter(creds),
  // smsa: (creds) => new SMSAAdapter(creds),   // uncomment when SMSA is implemented
};

// ── Credential loader ─────────────────────────────────────────────────────────
// Loads encrypted credentials from Firestore and decrypts them in memory.
// Credentials are stored in the "shipping_carriers" collection as:
//   /shipping_carriers/{carrierId}/credentials/{env}

interface StoredCredential {
  apiKeyEnc?: string;
  secretKeyEnc?: string;
  accountId?: string;
  username?: string;
  baseUrl?: string;
  webhookSecretEnc?: string;
  env?: "test" | "live";
}

async function loadCredentials(carrierId: string): Promise<CarrierCredentials> {
  const env = (process.env.SHIPPING_ENV as "test" | "live") ?? "live";

  const docRef = adminDb
    .collection("shipping_carriers")
    .doc(carrierId)
    .collection("credentials")
    .doc(env);

  const snap = await docRef.get();

  // If no credentials stored yet, return empty creds (mock adapter handles this gracefully)
  if (!snap.exists) {
    if (carrierId === "mock") {
      return { env };
    }
    throw new ShippingError(
      "NO_CREDENTIALS",
      `No ${env} credentials found for carrier "${carrierId}". Configure them in /admin/settings/shipping.`,
      carrierId
    );
  }

  const data = snap.data() as StoredCredential;

  return {
    env: data.env ?? env,
    apiKey:        decrypt(data.apiKeyEnc)       ?? undefined,
    secretKey:     decrypt(data.secretKeyEnc)    ?? undefined,
    accountId:     data.accountId,
    username:      data.username,
    baseUrl:       data.baseUrl,
    webhookSecret: decrypt(data.webhookSecretEnc) ?? undefined,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolve a carrier adapter by ID.
 * Loads and decrypts credentials from Firestore, then instantiates the adapter.
 * The credentials object lives only in memory for the duration of the request.
 */
export async function getAdapter(carrierId: CarrierId): Promise<ShippingAdapter> {
  const factory = ADAPTER_FACTORIES[carrierId];
  if (!factory) {
    throw new ShippingError(
      "UNKNOWN_CARRIER",
      `Carrier "${carrierId}" is not registered. Add its adapter to registry.ts.`,
      carrierId
    );
  }

  const credentials = await loadCredentials(carrierId);
  return factory(credentials);
}

/** List all registered carrier IDs (useful for the admin dropdown) */
export function getRegisteredCarriers(): CarrierId[] {
  return Object.keys(ADAPTER_FACTORIES) as CarrierId[];
}
