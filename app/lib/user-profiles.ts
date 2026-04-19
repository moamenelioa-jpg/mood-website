"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";

/**
 * Ensure a user profile document exists and is updated with latest auth info.
 * Collection: users/{uid}
 * Fields: uid, fullName, email, provider, emailVerified, role, createdAt, updatedAt
 */
export async function ensureUserProfile(user: FirebaseUser): Promise<void> {
  const uid = user.uid;
  const fullName = user.displayName || user.email?.split("@")[0] || "User";
  const email = user.email || "";
  const provider = user.providerData[0]?.providerId || (user.isAnonymous ? "anonymous" : "password");
  const emailVerified = !!user.emailVerified;
  const role = "user";

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      fullName,
      email,
      provider,
      emailVerified,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update verification state and basic fields; don't overwrite role unless missing
    const currentRole = (snap.data() as any)?.role ?? role;
    await updateDoc(ref, {
      fullName,
      email,
      provider,
      emailVerified,
      role: currentRole,
      updatedAt: serverTimestamp(),
    });
  }
}
