import { NextResponse } from "next/server";
import { getFirestoreOrderByNumber, updateFirestoreOrder } from "@/app/lib/firestore-orders-admin";
import { requireAdmin } from "@/app/lib/admin-auth";

export const runtime = "nodejs";

// GET /api/admin/orders/proof?order=MOOD-XXXXXXXX-NNN
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("order");

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order number is required (?order=MOOD-...)" },
        { status: 400 }
      );
    }

    const order = await getFirestoreOrderByNumber(orderNumber);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (!["bank_transfer", "wallet", "instapay"].includes(order.paymentMethod)) {
      return NextResponse.json(
        { success: false, error: "This order is not a manual payment order" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      paymentStatus: order.paymentStatus,
      total: order.total,
      hasReceipt: !!order.receiptImageUrl,
      receiptImageUrl: order.receiptImageUrl ?? null,
      receiptImagePath: order.receiptImagePath ?? null,
      receiptUploadedAt: order.receiptUploadedAt ?? null,
    });
  } catch (error) {
    console.error("Admin proof fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/proof?order=MOOD-XXXXXXXX-NNN
// Body: { action: "approve" | "reject" }
export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("order");
    const body = await req.json();
    const { action, note } = body as { action: "approve" | "reject"; note?: string };

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order number is required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const order = await getFirestoreOrderByNumber(orderNumber);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const reviewer = (admin as any).email || "";

    if (action === "approve") {
      await updateFirestoreOrder(order.id, {
        paymentStatus: "approved",
        orderStatus: "confirmed",
        receiptReviewStatus: "approved",
        receiptReviewedAt: nowIso,
        ...(reviewer ? { receiptReviewedBy: reviewer } : {}),
        ...(note ? { receiptReviewNote: note } : {}),
      });
    } else {
      await updateFirestoreOrder(order.id, {
        paymentStatus: "rejected",
        // Keep order open for re-upload unless you want to cancel automatically
        orderStatus: "pending",
        receiptReviewStatus: "rejected",
        receiptReviewedAt: nowIso,
        ...(reviewer ? { receiptReviewedBy: reviewer } : {}),
        ...(note ? { receiptReviewNote: note } : {}),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${action === "approve" ? "approved" : "rejected"} for ${orderNumber}`,
    });
  } catch (error) {
    console.error("Admin proof action error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
