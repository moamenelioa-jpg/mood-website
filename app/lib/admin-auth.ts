/**
 * admin-auth.ts
 *
 * Server-side utilities for verifying admin identity.
 *
 * Architecture:
 *   1. Firebase ID Token is sent from the browser in the Authorization header.
 *   2. We verify it with the Admin SDK (tamper-proof, server-only).
 *   3. We check for the custom claim  `admin: true`  on the decoded token.
 *   4. As a defence-in-depth fallback we also check the `admins` Firestore
 *      collection – so you can revoke access instantly without re-issuing tokens.
 *
 * Custom-claim setup (run once in a server script / Firebase Cloud Function):
 *   await adminAuth.setCustomUserClaims(uid, { admin: true });
 */

import { adminAuth, adminDb } from "./firebase-admin";

const ADMINS_COLLECTION = "admins";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  addedAt: string;
  addedBy: string;
}

export interface VerifiedAdmin {
  uid: string;
  email: string;
  displayName?: string;
}

// ─────────────────────────────────────────────────────────────
// Verify an incoming request is from an authenticated admin
// ─────────────────────────────────────────────────────────────

/**
 * Extract the Bearer token from the Authorization header.
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Verify the Firebase ID token and confirm the user has admin access.
 * Returns the verified admin info, or throws an Error if unauthorized.
 */
export async function verifyAdminToken(idToken: string): Promise<VerifiedAdmin> {
  // 1. Verify the token cryptographically (rejects expired / forged tokens)
  const decoded = await adminAuth.verifyIdToken(idToken);

  const uid = decoded.uid;
  const email = decoded.email ?? "";

  // 2. Check custom claim (fastest – no Firestore read needed most of the time)
  if (decoded.admin === true) {
    return { uid, email, displayName: decoded.name };
  }

  // 3. Fallback: check Firestore admins collection
  //    Useful when a claim hasn't propagated yet, or during initial bootstrap.
  const adminDoc = await adminDb.collection(ADMINS_COLLECTION).doc(uid).get();
  if (adminDoc.exists) {
    return { uid, email, displayName: decoded.name };
  }

  throw new Error("Forbidden: not an admin");
}

/**
 * Helper for Next.js API routes – returns VerifiedAdmin or a 401/403 Response.
 */
export async function requireAdmin(
  req: Request
): Promise<VerifiedAdmin | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing authorization token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    return await verifyAdminToken(token);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    const status = msg.startsWith("Forbidden") ? 403 : 401;
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Admin user management (called from protected API routes only)
// ─────────────────────────────────────────────────────────────

/**
 * Grant admin access: set custom claim AND write to Firestore admins collection.
 * The `addedBy` parameter should be the UID of the admin performing the action.
 */
export async function grantAdmin(
  targetEmail: string,
  addedByUid: string
): Promise<AdminUser> {
  const userRecord = await adminAuth.getUserByEmail(targetEmail);

  // Set custom claim
  await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

  // Write to Firestore for audit trail + instant revocation support
  const adminUser: AdminUser = {
    uid: userRecord.uid,
    email: userRecord.email ?? targetEmail,
    ...(userRecord.displayName ? { displayName: userRecord.displayName } : {}),
    addedAt: new Date().toISOString(),
    addedBy: addedByUid,
  };

  await adminDb
    .collection(ADMINS_COLLECTION)
    .doc(userRecord.uid)
    .set(adminUser, { merge: true });

  return adminUser;
}

/**
 * Revoke admin access: remove custom claim AND delete from Firestore.
 * Existing tokens stay valid until they expire (≤1 hour) – to force
 * immediate revocation you can also call adminAuth.revokeRefreshTokens(uid).
 */
export async function revokeAdmin(
  targetUid: string,
  revokedByUid: string
): Promise<void> {
  // Prevent self-revocation
  if (targetUid === revokedByUid) {
    throw new Error("You cannot remove your own admin access");
  }

  // Remove custom claim (set to false, not delete, so the token is explicit)
  await adminAuth.setCustomUserClaims(targetUid, { admin: false });

  // Revoke all refresh tokens so they can't get a fresh admin token
  await adminAuth.revokeRefreshTokens(targetUid);

  // Remove from Firestore
  await adminDb.collection(ADMINS_COLLECTION).doc(targetUid).delete();
}

/**
 * List all admin users from Firestore.
 */
export async function listAdmins(): Promise<AdminUser[]> {
  const snapshot = await adminDb
    .collection(ADMINS_COLLECTION)
    .orderBy("addedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as AdminUser);
}

/**
 * Bootstrap: ensure the first superadmin exists.
 * Creates the Firebase Auth user if they don't exist, sets the password,
 * then grants admin access. Safe to call multiple times.
 */
export async function bootstrapSuperAdmin(
  email: string,
  password?: string
): Promise<{ created: boolean; uid: string }> {
  try {
    let user;
    let created = false;

    try {
      user = await adminAuth.getUserByEmail(email);
      // User exists — update password if provided
      if (password) {
        await adminAuth.updateUser(user.uid, { password });
      }
    } catch {
      // User doesn't exist — create them
      user = await adminAuth.createUser({
        email,
        password: password ?? "changeme123",
        emailVerified: true,
      });
      created = true;
    }

    const existing = await adminDb
      .collection(ADMINS_COLLECTION)
      .doc(user.uid)
      .get();

    if (!existing.exists) {
      await grantAdmin(email, "system");
      console.log(`[Admin] Bootstrapped superadmin: ${email}`);
    }

    return { created, uid: user.uid };
  } catch (err) {
    console.warn("[Admin] bootstrapSuperAdmin failed:", err);
    throw err;
  }
}
