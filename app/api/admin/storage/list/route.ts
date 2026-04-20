import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getSupabaseServer, getSupabaseBucket } from "@/app/lib/supabase";

// POST /api/admin/storage/list  { prefix: string, bucket?: string }
export async function POST(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const body = await req.json();
    const prefix: string = body.prefix || "";
    const bucket = body.bucket || getSupabaseBucket();

    const supabase = getSupabaseServer();
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, files: data });
  } catch (err) {
    console.error("[Admin Storage List] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to list files" }, { status: 500 });
  }
}
