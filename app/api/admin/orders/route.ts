import { NextResponse } from "next/server";
import { getOrders, getOrderStats, OrderListParams } from "@/app/lib/orders";

// Simple admin key validation (for production, use proper auth!)
function validateAdminAccess(req: Request): boolean {
  const adminKey = req.headers.get("x-admin-key");
  const validKey = process.env.ADMIN_API_KEY;
  
  // In development, allow access without key
  if (process.env.NODE_ENV === "development" && !validKey) {
    return true;
  }
  
  return adminKey === validKey;
}

// GET /api/admin/orders - List orders with filtering and pagination
export async function GET(req: Request) {
  try {
    if (!validateAdminAccess(req)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    const params: OrderListParams = {
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      status: searchParams.get("status") || undefined,
      paymentStatus: searchParams.get("paymentStatus") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    // Check if stats are requested
    if (searchParams.get("stats") === "true") {
      const stats = await getOrderStats();
      return NextResponse.json({ success: true, stats });
    }

    const result = await getOrders(params);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
