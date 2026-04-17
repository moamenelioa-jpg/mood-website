import { NextResponse } from "next/server";
import {
  getOrderById,
  updateOrder,
  cancelOrder,
  markOrderPaid,
} from "@/app/lib/orders";
import { OrderUpdateInput, OrderStatuses, PaymentStatuses } from "@/app/lib/types";
import { requireAdmin } from "@/app/lib/admin-auth";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/orders/[id] - Get single order
export async function GET(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/[id] - Update order
export async function PATCH(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    const body = await req.json();

    // Validate order exists
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Handle special actions
    if (body.action === "cancel") {
      const order = await cancelOrder(id);
      return NextResponse.json({ success: true, order, message: "Order cancelled" });
    }

    if (body.action === "mark_paid") {
      const order = await markOrderPaid(id);
      return NextResponse.json({ success: true, order, message: "Order marked as paid" });
    }

    // Validate update fields
    const updates: OrderUpdateInput = {};

    if (body.orderStatus) {
      const validStatuses = Object.values(OrderStatuses);
      if (!validStatuses.includes(body.orderStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid order status. Valid: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.orderStatus = body.orderStatus;
    }

    if (body.paymentStatus) {
      const validStatuses = Object.values(PaymentStatuses);
      if (!validStatuses.includes(body.paymentStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid payment status. Valid: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.paymentStatus = body.paymentStatus;
    }

    if (body.shippingCompany !== undefined) {
      updates.shippingCompany = body.shippingCompany;
    }

    if (body.trackingNumber !== undefined) {
      updates.trackingNumber = body.trackingNumber;
    }

    if (body.shippingStatus !== undefined) {
      updates.shippingStatus = body.shippingStatus;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const order = await updateOrder(id, updates);

    return NextResponse.json({
      success: true,
      order,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/orders/[id] - Cancel order (soft delete)
export async function DELETE(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;

    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Soft delete by cancelling
    const order = await cancelOrder(id);

    return NextResponse.json({
      success: true,
      order,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
