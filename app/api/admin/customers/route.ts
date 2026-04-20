import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { adminDb } from "@/app/lib/firebase-admin";

const ORDERS_COLLECTION = "orders";

// GET /api/admin/customers?search=
export async function GET(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase();

    // Fetch a reasonable number of orders for aggregation (adjust as needed)
    const snapshot = await adminDb.collection(ORDERS_COLLECTION).limit(1000).get();
    type Acc = Record<string, { phone: string; name: string; email?: string | null; orders: number; total: number; lastOrderAt?: Date }>;
    const acc: Acc = {};

    snapshot.docs.forEach((doc) => {
      const o = doc.data() as any;
      const key = (o.phone || o.email || o.customerName || doc.id).toString();
      if (!acc[key]) acc[key] = { phone: o.phone || "", name: o.customerName || "", email: o.email || null, orders: 0, total: 0, lastOrderAt: undefined };
      acc[key].orders += 1;
      acc[key].total += Number(o.total || 0);
      const d = o.createdAt?.toDate?.() || new Date(o.createdAt || Date.now());
      if (!acc[key].lastOrderAt || d > acc[key].lastOrderAt) acc[key].lastOrderAt = d;
    });

    let customers = Object.entries(acc).map(([id, c]) => ({ id, ...c }));

    if (search) {
      customers = customers.filter((c) =>
        [c.phone, c.name, c.email || ""].some((v) => (v || "").toLowerCase().includes(search))
      );
    }

    customers.sort((a, b) => (b.lastOrderAt?.getTime() || 0) - (a.lastOrderAt?.getTime() || 0));

    return NextResponse.json({ success: true, customers });
  } catch (err) {
    console.error("[Admin Customers GET] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to load customers" }, { status: 500 });
  }
}
