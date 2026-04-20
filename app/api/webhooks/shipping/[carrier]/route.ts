// POST /api/webhooks/shipping/[carrier]
//
// Receives status update callbacks from shipping carriers.
// Each carrier posts to its own URL:
//   POST /api/webhooks/shipping/bosta
//   POST /api/webhooks/shipping/aramex
//   POST /api/webhooks/shipping/mock
//
// SECURITY: No admin auth here (carrier calls this, not the browser).
//           Each adapter verifies the carrier's HMAC signature instead.
//
// IMPORTANT: Always return 200 immediately after ack — carriers
//            will retry if they receive any non-2xx response.

import { NextResponse } from "next/server";
import { getAdapter } from "@/app/lib/shipping/registry";
import { handleWebhookEvent } from "@/app/lib/shipping/service";
import { ShippingError } from "@/app/lib/shipping/types";
import type { CarrierId } from "@/app/lib/shipping/types";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ carrier: string }>;
}

// ── Carrier-specific signature header names ───────────────────────────────────
// Each carrier sends their HMAC signature in a different header.
// The raw body text must be used for HMAC verification — never the parsed JSON.
const SIGNATURE_HEADERS: Record<string, string> = {
  bosta:  "x-bosta-signature",
  aramex: "x-aramex-signature",
  smsa:   "x-smsa-token",
};

export async function POST(req: Request, { params }: RouteParams) {
  const { carrier } = await params;
  const carrierId = carrier as CarrierId;

  // ── Read raw body BEFORE parsing ─────────────────────────────────────────
  // Must read as raw text first. Parsing to JSON first destroys whitespace,
  // which breaks HMAC signature verification (hash is over the exact bytes sent).
  const rawText = await req.text();

  const signatureHeader = SIGNATURE_HEADERS[carrierId] ?? "x-signature";
  const signature = req.headers.get(signatureHeader) ?? undefined;

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(rawText);
  } catch {
    // Malformed payload — ack with 200 so carrier doesn't retry garbage
    console.warn(`[Webhook:${carrierId}] Malformed JSON received`);
    return NextResponse.json({ received: true });
  }

  try {
    // Resolve adapter (validates carrierId is registered)
    const adapter = await getAdapter(carrierId);

    // Parse + verify the webhook using the carrier-specific adapter
    // parseWebhook() throws ShippingError("INVALID_WEBHOOK_SIGNATURE") on bad sig
    const event = await adapter.parseWebhook(rawBody, signature);

    if (!event) {
      // Ping / test call or unrecognised event type — ack and ignore
      return NextResponse.json({ received: true });
    }

    // Process the event (update Firestore order status)
    await handleWebhookEvent(event);

    return NextResponse.json({ received: true });

  } catch (err) {
    if (err instanceof ShippingError && err.code === "INVALID_WEBHOOK_SIGNATURE") {
      // Log carefully — could be a carrier config error or an attack attempt
      console.error(
        `[Webhook:${carrierId}] Signature mismatch — ` +
        `header=${signatureHeader} ip=${req.headers.get("x-forwarded-for") ?? "unknown"}`
      );
      // Return 401 for signature failures only — carrier should not retry these
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (err instanceof ShippingError && err.code === "UNKNOWN_CARRIER") {
      return NextResponse.json({ error: "Unknown carrier" }, { status: 404 });
    }

    // For all other errors: log but return 200 so carrier doesn't flood retries.
    // The ShippingLog in Firestore captures the failure for manual review.
    console.error(`[Webhook:${carrierId}] Error processing event:`, err);
    return NextResponse.json({ received: true });
  }
}
