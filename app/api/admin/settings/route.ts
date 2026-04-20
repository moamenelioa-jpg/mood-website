import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const SETTINGS_COLLECTION = "settings"; // doc: global
const DOC_ID = "global";

// GET /api/admin/settings
export async function GET(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(DOC_ID).get();
    return NextResponse.json({ success: true, settings: doc.exists ? doc.data() : {} });
  } catch (err) {
    console.error("[Admin Settings GET] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to load settings" }, { status: 500 });
  }
}

// PATCH /api/admin/settings
export async function PATCH(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const body = await req.json();
    const allowed = [
      // Bank transfer
      "bankName",
      "accountName",
      "iban",
      "bankActive",
      // Mobile wallet
      "walletNumber",
      "walletAccountName",
      "walletActive",
      // InstaPay
      "instapayIdentifier",
      "instapayAccountName",
      "instapayActive",
      // Cash on delivery
      "codActive",
      // System
      "contactPhone",
      "uploadsBucket",
    ];

    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];

    await adminDb.collection(SETTINGS_COLLECTION).doc(DOC_ID).set(updates, { merge: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Settings PATCH] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
