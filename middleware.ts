/**
 * middleware.ts  (Next.js Edge Middleware)
 *
 * Lightweight route guard for /admin pages.
 *
 * The middleware does NOT verify the Firebase ID token itself
 * (edge runtime can't use the Admin SDK).
 * Instead, it checks for the presence of a session cookie
 * `__admin_authed=1` that is set by the admin login page
 * after a successful /api/admin/session call.
 *
 * The REAL security lives server-side: every /api/admin/* route
 * calls `requireAdmin()` which verifies the Firebase ID token
 * cryptographically using the Admin SDK.
 *
 * This middleware only provides a quick UX redirect — never rely
 * on it alone for security.
 */

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page through unconditionally
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // For all other /admin/* paths, check for the session cookie
  const isAuthed = req.cookies.get("__admin_authed")?.value === "1";

  if (!isAuthed) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
