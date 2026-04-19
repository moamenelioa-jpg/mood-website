import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { CartItem } from "@/app/lib/types";

/**
 * Load the saved cart for a user from Firestore.
 * Collection: carts/{uid}
 * Document fields: items: CartItem[], updatedAt: Timestamp
 */
export async function loadUserCart(uid: string): Promise<CartItem[]> {
  try {
    const ref = doc(db, "carts", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data?.items) ? (data.items as CartItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Persist the current cart for a user to Firestore.
 * Overwrites the existing cart document entirely.
 */
export async function saveUserCart(uid: string, items: CartItem[]): Promise<void> {
  const ref = doc(db, "carts", uid);
  await setDoc(ref, { items, updatedAt: serverTimestamp() });
}
