"use client";

/**
 * admin-auth-context.tsx
 *
 * Provides Firebase Auth state for the /admin section.
 * Authenticates with Google (or email/password), then verifies
 * server-side that the user has admin access via /api/admin/session.
 *
 * Usage: wrap your admin layout with <AdminAuthProvider>.
 * Use `useAdminAuth()` to access the admin state and logout helper.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { app } from "@/app/lib/firebase";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AdminSession {
  uid: string;
  email: string;
  displayName: string | null;
  idToken: string;
}

type AuthState = "idle" | "loading" | "authenticated" | "unauthorized";

interface AdminAuthContextType {
  session: AdminSession | null;
  authState: AuthState;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Attach this token to all admin API calls as: Authorization: Bearer <idToken> */
  getToken: () => Promise<string | null>;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const auth = getAuth(app);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState<string | null>(null);

  // ── Verify with the server that this Firebase user is an admin ──
  const verifyWithServer = useCallback(
    async (firebaseUser: FirebaseUser): Promise<boolean> => {
      try {
        // Force-refresh to pick up the latest custom claims
        const idToken = await firebaseUser.getIdToken(true);

        const res = await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        const data = await res.json();

        if (data.success) {
          setSession({
            uid: data.admin.uid,
            email: data.admin.email,
            displayName: data.admin.displayName,
            idToken,
          });
          setAuthState("authenticated");
          return true;
        } else {
          setSession(null);
          setAuthState("unauthorized");
          setError(data.error ?? "Access denied");
          return false;
        }
      } catch {
        setSession(null);
        setAuthState("unauthorized");
        setError("Failed to verify admin access");
        return false;
      }
    },
    []
  );

  // ── Listen for Firebase Auth state changes ──
  useEffect(() => {
    setAuthState("loading");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await verifyWithServer(firebaseUser);
      } else {
        setSession(null);
        setAuthState("idle");
      }
    });
    return unsubscribe;
  }, [auth, verifyWithServer]);

  // ── Get a fresh ID token (auto-refreshes if needed) ──
  const getToken = useCallback(async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      // Update stored token
      setSession((prev) => (prev ? { ...prev, idToken: token } : null));
      return token;
    } catch {
      return null;
    }
  }, [auth]);

  // ── Google sign-in ──
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setAuthState("loading");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await verifyWithServer(result.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setError(msg);
      setAuthState("idle");
    }
  }, [auth, verifyWithServer]);

  // ── Email/password sign-in ──
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setAuthState("loading");
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await verifyWithServer(result.user);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Sign-in failed";
        setError(msg.includes("wrong-password") || msg.includes("user-not-found")
          ? "Invalid email or password"
          : msg);
        setAuthState("idle");
      }
    },
    [auth, verifyWithServer]
  );

  // ── Logout ──
  const logout = useCallback(async () => {
    await signOut(auth);
    setSession(null);
    setAuthState("idle");
    setError(null);
  }, [auth]);

  return (
    <AdminAuthContext.Provider
      value={{ session, authState, error, signInWithGoogle, signInWithEmail, logout, getToken }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
