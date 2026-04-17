/**
 * POST /api/admin/session
 * Verify a Firebase ID token, confirm admin status, return minimal session data.
 *
 * The browser sends: { idToken: "..." }
 * We verify server-side with the Admin SDK – no cookie / JWT required.
 */
import { NextResponse } from "next/server";
import { verifyAdminToken } from "@/app/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, error: "idToken is required" },
        { status: 400 }
      );
    }

    const admin = await verifyAdminToken(idToken);

    return NextResponse.json({
      success: true,
      admin: {
        uid: admin.uid,
        email: admin.email,
        displayName: admin.displayName ?? null,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 401 }
    );
  }
}
