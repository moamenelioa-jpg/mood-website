import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin, VerifiedAdmin } from "@/app/lib/admin-auth";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ORDERS_COLLECTION = "orders";

const VALID_ORDER_STATUSES = [
  "pending", "confirmed", "processing", "shipped",
  "delivered", "completed", "cancelled",
];
const VALID_PAYMENT_STATUSES = [
  "unpaid", "pending", "paid", "failed", "pending_verification",
];

/**
 * Resolve an order by Firestore doc ID or by orderNumber.
 * Returns { ref, data } or null.
 */
async function resolveOrder(idOrNumber: string) {
  // Try Firestore doc ID first (24-char alphanumeric)
  if (/^[a-zA-Z0-9]{20}$/.test(idOrNumber)) {
    const ref = adminDb.collection(ORDERS_COLLECTION).doc(idOrNumber);
    const snap = await ref.get();
    if (snap.exists) return { ref, data: { id: snap.id, ...snap.data() } };
  }

  // Fallback: look up by orderNumber (e.g. MOOD-20260418-001)
  const snapshot = await adminDb
    .collection(ORDERS_COLLECTION)
    .where("orderNumber", "==", idOrNumber)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { ref: doc.ref, data: { id: doc.id, ...doc.data() } };
  }

  return null;
}

// GET /api/admin/orders/[id] — Get single order
export async function GET(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    const resolved = await resolveOrder(id);
    if (!resolved) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, order: resolved.data });
  } catch (error) {
    console.error("[Admin Orders GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}

// PATCH /api/admin/orders/[id] — Update order (status, payment, archive, notes, tracking)
export async function PATCH(req: Request, { params }: RouteParams) {
  const adminUser = await requireAdmin(req);
  if (adminUser instanceof Response) return adminUser;

  try {
    const { id } = await params;
    const body = await req.json();

    const resolved = await resolveOrder(id);
    if (!resolved) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // ── Order status ───────────────────────────────────────────────────
    if (body.orderStatus !== undefined) {
      if (!VALID_ORDER_STATUSES.includes(body.orderStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid order status. Valid: ${VALID_ORDER_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updates.orderStatus = body.orderStatus;

      // Append to status history log
      updates.statusHistory = FieldValue.arrayUnion({
        status: body.orderStatus,
        changedAt: new Date().toISOString(),
        changedBy: (adminUser as VerifiedAdmin).email ?? "admin",
      });
    }

    // ── Payment status ─────────────────────────────────────────────────
    if (body.paymentStatus !== undefined) {
      if (!VALID_PAYMENT_STATUSES.includes(body.paymentStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid payment status. Valid: ${VALID_PAYMENT_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updates.paymentStatus = body.paymentStatus;
    }

    // ── Archive flag ───────────────────────────────────────────────────
    if (body.archived !== undefined) {
      updates.archived = Boolean(body.archived);
    }

    // ── Free-text / shipping fields ────────────────────────────────────
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.trackingNumber !== undefined) updates.trackingNumber = body.trackingNumber;
    if (body.shippingCompany !== undefined) updates.shippingCompany = body.shippingCompany;

    if (Object.keys(updates).length <= 1) {
      // Only updatedAt — nothing meaningful to update
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    await resolved.ref.update(updates);
    return NextResponse.json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("[Admin Orders PATCH]", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}

// DELETE /api/admin/orders/[id] — Hard delete (only completed / cancelled / archived orders)
export async function DELETE(req: Request, { params }: RouteParams) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    const resolved = await resolveOrder(id);
    if (!resolved) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = resolved.data as Record<string, unknown>;
    const safeStatuses = ["completed", "cancelled", "delivered"];
    const isSafe =
      safeStatuses.includes(order.orderStatus as string) || Boolean(order.archived);

    if (!isSafe) {
      return NextResponse.json(
        { success: false, error: "يمكن حذف الطلبات المكتملة أو الملغاة أو المؤرشفة فقط" },
        { status: 400 }
      );
    }

    await resolved.ref.delete();
    return NextResponse.json({ success: true, message: "Order deleted permanently" });
  } catch (error) {
    console.error("[Admin Orders DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete order" }, { status: 500 });
  }
}
