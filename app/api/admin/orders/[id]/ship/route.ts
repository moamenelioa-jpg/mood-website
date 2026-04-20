// POST /api/admin/orders/[id]/ship
//
// Admin-only endpoint. Triggers carrier API and marks order as shipped.
// Must NEVER be called automatically — only on explicit admin action.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { dispatchShipment } from "@/app/lib/shipping/service";
import { ShippingError, getErrorMeta } from "@/app/lib/shipping/types";
import type { DispatchInput } from "@/app/lib/shipping/types";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  // ── Auth guard ──────────────────────────────────────────────────────────
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { id: orderId } = await params;

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: DispatchInput;
  try {
    body = await req.json() as DispatchInput;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // ── Basic structure check ───────────────────────────────────────────────
  if (!body.carrierId || !body.recipient || !body.packageInfo) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: carrierId, recipient, packageInfo" },
      { status: 400 }
    );
  }

  // ── Delegate to service layer ───────────────────────────────────────────
  try {
    const result = await dispatchShipment(
      orderId,
      body,
      (admin as { uid: string }).uid
    );

    return NextResponse.json({
      success: true,
      trackingNumber: result.shipmentResult.trackingNumber,
      trackingUrl: result.shipmentResult.trackingUrl ?? null,
      labelUrl: result.shipmentResult.labelUrl ?? null,
      carrierShipmentId: result.shipmentResult.carrierShipmentId,
    });

  } catch (err) {
    if (err instanceof ShippingError) {
      const meta = getErrorMeta(err.code);
      return NextResponse.json(
        {
          success:   false,
          error:     err.message,
          code:      err.code,
          category:  meta.category,
          retryable: meta.retryable,
          label:     meta.adminLabel,
        },
        { status: meta.httpStatus }
      );
    }

    // Unexpected errors
    console.error("[Ship API] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
