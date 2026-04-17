import { NextResponse } from "next/server";
import { getFirestoreOrderByNumber, updateFirestoreOrder } from "@/app/lib/firestore-orders-admin";
import { requireAdmin } from "@/app/lib/admin-auth";

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

    if (order.paymentMethod !== "bank_transfer") {
      return NextResponse.json(
        { success: false, error: "This order is not a bank transfer order" },
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
    const { action } = body;

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

    if (action === "approve") {
      await updateFirestoreOrder(order.id, {
        paymentStatus: "paid",
        orderStatus: "confirmed",
      });
    } else {
      await updateFirestoreOrder(order.id, {
        paymentStatus: "failed",
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
