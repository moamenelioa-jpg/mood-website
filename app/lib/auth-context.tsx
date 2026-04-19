"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { ensureUserProfile } from "@/app/lib/user-profiles";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "signup";
  openLogin: () => void;
  openSignup: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No local fake accounts; we use Firebase Auth only.

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [mounted, setMounted] = useState(false);

  // Initialize persistence and subscribe to auth state
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        // ignore; defaults apply
      }
      unsub = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const u: User = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            email: fbUser.email || "",
            emailVerified: fbUser.emailVerified,
          };
          setUser(u);
          try { await ensureUserProfile(fbUser); } catch {}
        } else {
          setUser(null);
        }
        setMounted(true);
      });
    })();
    return () => unsub();
  }, []);

  const openLogin = useCallback(() => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  }, []);

  const openSignup = useCallback(() => {
    setAuthModalMode("signup");
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthModalOpen(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      // Create Firestore profile NOW, after displayName is set, so fullName is correct.
      // The onAuthStateChanged call will just update it again, which is harmless.
      try { await ensureUserProfile(cred.user); } catch {}
      try {
        await sendEmailVerification(cred.user);
      } catch {}
      setIsAuthModalOpen(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsAuthModalOpen(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const resendVerification = useCallback(async (): Promise<boolean> => {
    try {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    signOut(auth).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthModalOpen,
        authModalMode,
        openLogin,
        openSignup,
        closeAuthModal,
        login,
        signup,
        signInWithGoogle,
        resendVerification,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
