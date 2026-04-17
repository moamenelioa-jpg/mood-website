/**
 * GET  /api/admin/users          – list all admin users
 * POST /api/admin/users          – grant admin to an email
 * DELETE /api/admin/users?uid=…  – revoke admin from a uid
 */
import { NextResponse } from "next/server";
import { requireAdmin, grantAdmin, revokeAdmin, listAdmins } from "@/app/lib/admin-auth";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const users = await listAdmins();
    return NextResponse.json({ success: true, users });
  } catch (err) {
    console.error("List admins error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to list admin users" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    const newAdmin = await grantAdmin(email.toLowerCase().trim(), admin.uid);
    return NextResponse.json({ success: true, user: newAdmin });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to grant admin";
    // "There is no user record..." from Firebase Auth
    if (msg.includes("no user record")) {
      return NextResponse.json(
        { success: false, error: "No Firebase account found for this email. The user must sign up first." },
        { status: 404 }
      );
    }
    console.error("Grant admin error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const targetUid = searchParams.get("uid");

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: "uid query parameter is required" },
        { status: 400 }
      );
    }

    await revokeAdmin(targetUid, admin.uid);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to revoke admin";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
