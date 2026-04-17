import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";
import { requireAdmin } from "@/app/lib/admin-auth";

// GET /api/admin/orders - List orders from Firestore with optional filters
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const paymentMethod = searchParams.get("paymentMethod") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const orderStatus = searchParams.get("orderStatus") || undefined;
    const search = searchParams.get("search") || undefined;
    const limitParam = parseInt(searchParams.get("limit") || "100");

    // Build query — apply at most one equality filter to avoid requiring
    // composite indexes. Additional filters are applied in-memory below.
    let q: FirebaseFirestore.Query = adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(limitParam);

    // Apply a single server-side filter (most selective first)
    if (paymentStatus) {
      q = adminDb.collection("orders").where("paymentStatus", "==", paymentStatus).orderBy("createdAt", "desc").limit(limitParam);
    } else if (paymentMethod) {
      q = adminDb.collection("orders").where("paymentMethod", "==", paymentMethod).orderBy("createdAt", "desc").limit(limitParam);
    } else if (orderStatus) {
      q = adminDb.collection("orders").where("orderStatus", "==", orderStatus).orderBy("createdAt", "desc").limit(limitParam);
    }

    const snapshot = await q.get();
    let orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // In-memory secondary filters (for any filter not applied server-side)
    if (paymentMethod) orders = orders.filter((o: Record<string, unknown>) => o.paymentMethod === paymentMethod);
    if (paymentStatus) orders = orders.filter((o: Record<string, unknown>) => o.paymentStatus === paymentStatus);
    if (orderStatus) orders = orders.filter((o: Record<string, unknown>) => o.orderStatus === orderStatus);

    // Client-side search filter (Firestore doesn't support full-text search)
    if (search) {
      const s = search.toLowerCase();
      orders = orders.filter((o: Record<string, unknown>) => {
        const orderNumber = String(o.orderNumber ?? "").toLowerCase();
        const customerName = String(o.customerName ?? "").toLowerCase();
        const phone = String(o.phone ?? "");
        return orderNumber.includes(s) || customerName.includes(s) || phone.includes(s);
      });
    }

    return NextResponse.json({ success: true, orders, total: orders.length });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
