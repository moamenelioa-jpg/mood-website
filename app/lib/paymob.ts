/**
 * Paymob Egypt - Server-side helper
 *
 * Uses the new Intention API (V1) with fallback to Legacy Accept API.
 * All amounts are in PIASTERS (cents) — multiply EGP by 100.
 */

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  street: string;
  city: string;
  state: string;
  country: string;
  apartment: string;
  building: string;
  floor: string;
  postal_code?: string;
  shipping_method?: string;
}

export interface PaymobItem {
  name: string;
  amount: number; // piasters
  quantity: number;
}

export interface PaymobPaymentResult {
  paymentUrl: string;
  paymobOrderId?: string;
}

// ────────────────────────────────────────────
// ENV
// ────────────────────────────────────────────

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

// ────────────────────────────────────────────
// Intention API (recommended, new dashboard)
// ────────────────────────────────────────────

export async function createPaymobIntention(opts: {
  amountCents: number;
  currency?: string;
  items: PaymobItem[];
  billing: PaymobBillingData;
  orderNumber: string;
  redirectUrl: string;
}): Promise<PaymobPaymentResult> {
  const secretKey = getEnv("PAYMOB_SECRET_KEY");
  const publicKey = getEnv("PAYMOB_PUBLIC_KEY");
  const integrationId = getEnv("PAYMOB_INTEGRATION_ID");

  const body = {
    amount: opts.amountCents,
    currency: opts.currency || "EGP",
    payment_methods: [Number(integrationId)],
    items: opts.items,
    billing_data: opts.billing,
    customer: {
      first_name: opts.billing.first_name,
      last_name: opts.billing.last_name,
      email: opts.billing.email,
      extras: { order_number: opts.orderNumber },
    },
    extras: { order_number: opts.orderNumber },
    redirection_url: opts.redirectUrl,
    notification_url: opts.redirectUrl.replace(/\/success.*/, "/api/paymob/callback"),
  };

  const res = await fetch("https://accept.paymob.com/v1/intention/", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${secretKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || !data?.client_secret) {
    console.error("[Paymob] Intention API failed:", data);
    throw new Error(data?.message || data?.detail || "Paymob intention creation failed");
  }

  return {
    paymentUrl: `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${data.client_secret}`,
    paymobOrderId: data.id?.toString(),
  };
}

// ────────────────────────────────────────────
// Legacy Accept API (fallback)
// ────────────────────────────────────────────

async function legacyAuth(): Promise<string> {
  const apiKey = getEnv("PAYMOB_API_KEY");
  const res = await fetch("https://accept.paymob.com/api/auth/tokens", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  const data = await res.json();
  if (!res.ok || !data?.token) {
    throw new Error("Paymob auth failed");
  }
  return data.token;
}

async function legacyCreateOrder(
  token: string,
  amountCents: number,
  items: PaymobItem[]
): Promise<number> {
  const res = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      items: items.map((i) => ({
        name: i.name,
        amount_cents: i.amount,
        quantity: i.quantity,
      })),
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.id) {
    throw new Error("Paymob order creation failed");
  }
  return data.id;
}

async function legacyPaymentKey(
  token: string,
  amountCents: number,
  orderId: number,
  billing: PaymobBillingData,
  integrationId: number
): Promise<string> {
  const res = await fetch(
    "https://accept.paymob.com/api/acceptance/payment_keys",
    {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          ...billing,
          shipping_method: billing.shipping_method || "NA",
          postal_code: billing.postal_code || "NA",
        },
        currency: "EGP",
        integration_id: integrationId,
      }),
    }
  );
  const data = await res.json();
  if (!res.ok || !data?.token) {
    throw new Error("Paymob payment key creation failed");
  }
  return data.token;
}

export async function createPaymobLegacy(opts: {
  amountCents: number;
  items: PaymobItem[];
  billing: PaymobBillingData;
}): Promise<PaymobPaymentResult> {
  const integrationId = Number(getEnv("PAYMOB_INTEGRATION_ID"));

  const authToken = await legacyAuth();
  const paymobOrderId = await legacyCreateOrder(
    authToken,
    opts.amountCents,
    opts.items
  );
  const paymentKey = await legacyPaymentKey(
    authToken,
    opts.amountCents,
    paymobOrderId,
    opts.billing,
    integrationId
  );

  return {
    paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${getEnv("PAYMOB_INTEGRATION_ID")}?payment_token=${paymentKey}`,
    paymobOrderId: paymobOrderId.toString(),
  };
}

// ────────────────────────────────────────────
// HMAC verification for callbacks / webhooks
// ────────────────────────────────────────────

import crypto from "crypto";

/**
 * Verify Paymob transaction callback HMAC.
 * Paymob sends an `hmac` query param computed over specific fields.
 */
export function verifyPaymobHmac(
  transactionData: Record<string, unknown>,
  receivedHmac: string
): boolean {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  if (!hmacSecret) {
    console.error("[Paymob] PAYMOB_HMAC_SECRET not set — cannot verify");
    return false;
  }

  // Paymob concatenates these fields in this exact order
  const fields = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success",
  ];

  const concatenated = fields
    .map((field) => {
      const parts = field.split(".");
      let value: unknown = transactionData;
      for (const part of parts) {
        value = (value as Record<string, unknown>)?.[part];
      }
      return String(value ?? "");
    })
    .join("");

  const computed = crypto
    .createHmac("sha512", hmacSecret)
    .update(concatenated)
    .digest("hex");

  return computed === receivedHmac;
}
