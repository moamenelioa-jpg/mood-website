import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";

export const runtime = "nodejs";

// Safe public fields — no secrets exposed
const PUBLIC_FIELDS = [
  "bankName",
  "accountName",
  "iban",
  "bankActive",
  "walletNumber",
  "walletAccountName",
  "walletActive",
  "instapayIdentifier",
  "instapayAccountName",
  "instapayActive",
  "codActive",
];

export async function GET() {
  try {
    const doc = await adminDb.collection("settings").doc("global").get();
    const raw = doc.exists ? (doc.data() as Record<string, unknown>) : {};

    // Only expose safe fields
    const settings: Record<string, unknown> = {};
    for (const key of PUBLIC_FIELDS) {
      if (raw[key] !== undefined) settings[key] = raw[key];
    }

    // Default active=true if field not set (backward compat for existing deployments)
    if (settings.codActive === undefined) settings.codActive = true;
    if (settings.bankActive === undefined) settings.bankActive = true;
    if (settings.walletActive === undefined) settings.walletActive = true;
    if (settings.walletNumber === undefined) settings.walletNumber = "01204819854";
    if (settings.instapayActive === undefined) settings.instapayActive = true;
    if (settings.instapayIdentifier === undefined) settings.instapayIdentifier = "01204819854";

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("[Public Settings GET] Error:", err);
    // Return safe defaults so checkout never breaks even if Firestore is down
    return NextResponse.json({
      success: true,
      settings: {
        codActive: true,
        bankActive: true,
        walletActive: true,
        walletNumber: "01204819854",
        instapayActive: true,
        instapayIdentifier: "01204819854",
      },
    });
  }
}
