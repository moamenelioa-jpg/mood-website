/**
 * POST /api/admin/bootstrap
 *
 * One-time endpoint to grant super-admin status to a hardcoded email.
 * Protected by a BOOTSTRAP_SECRET environment variable.
 *
 * Usage (run once after deployment):
 *   curl -X POST https://your-domain/api/admin/bootstrap \
 *        -H "Content-Type: application/json" \
 *        -d '{"secret":"<BOOTSTRAP_SECRET>"}'
 *
 * After running once, set BOOTSTRAP_SECRET="" to disable this endpoint.
 */

import { NextResponse } from "next/server";
import { bootstrapSuperAdmin } from "@/app/lib/admin-auth";

const SUPER_ADMIN_EMAIL = "moamenelioa@gmail.com";

export async function POST(req: Request) {
  const secret = process.env.BOOTSTRAP_SECRET;

  if (!secret || secret.trim() === "") {
    return NextResponse.json(
      { success: false, error: "Bootstrap is disabled" },
      { status: 403 }
    );
  }

  let body: { secret?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ success: false, error: "Invalid secret" }, { status: 403 });
  }

  try {
    const result = await bootstrapSuperAdmin(SUPER_ADMIN_EMAIL, body.password);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bootstrap failed";
    console.error("[bootstrap] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
