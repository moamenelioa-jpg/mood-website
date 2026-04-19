"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { CartItem } from "./types";
import { Product } from "./products";
import { useLanguage } from "./language-context";
import { useAuth } from "./auth-context";
import { loadUserCart, saveUserCart } from "./firestore-cart";

/** Merge two cart arrays. For duplicate product IDs, keep the higher quantity. */
function mergeCartItems(local: CartItem[], cloud: CartItem[]): CartItem[] {
  const map = new Map<number, CartItem>();
  for (const item of local) map.set(item.id, { ...item });
  for (const item of cloud) {
    const existing = map.get(item.id);
    if (existing) {
      map.set(item.id, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
    } else {
      map.set(item.id, { ...item });
    }
  }
  return Array.from(map.values());
}

interface CartContextType {
  cart: CartItem[];
  cartOpen: boolean;
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product) => void;
  updateQuantity: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "mood_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { isArabic } = useLanguage();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevents the cart-save effect from firing while we are loading from Firestore.
  const skipSaveRef = useRef(false);
  // Tracks the previous user ID so we can detect login/logout transitions.
  const prevUserIdRef = useRef<string | null>(null);
  // Always-fresh ref so the save effect can read the current user without being
  // listed as a dependency (avoids saving local-only cart on login).
  const userRef = useRef(user);
  userRef.current = user;

  // ── 1. Load anonymous cart from sessionStorage on first render ──────────
  useEffect(() => {
    const saved = sessionStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        sessionStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setMounted(true);
  }, []);

  // ── 2. React to login / logout ──────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    const uid = user?.id ?? null;
    const prevUid = prevUserIdRef.current;
    if (uid === prevUid) return; // no auth state change
    prevUserIdRef.current = uid;

    if (!uid) {
      // User logged out — clear local cart for privacy.
      setCart([]);
      sessionStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    // User logged in — load their Firestore cart and merge with local cart.
    let cancelled = false;
    skipSaveRef.current = true; // suppress save during async load

    (async () => {
      try {
        const cloudItems = await loadUserCart(uid);
        if (cancelled) return;
        // Merge: keep highest quantity for duplicates, include all items.
        setCart((prev) => mergeCartItems(prev, cloudItems));
      } catch {
        // If load fails, keep the local cart as-is.
      } finally {
        if (!cancelled) skipSaveRef.current = false;
        // The [cart, mounted] effect will now run and persist the merged cart.
      }
    })();

    return () => {
      cancelled = true;
      skipSaveRef.current = false;
    };
  }, [user, mounted]);

  // ── 3. Persist cart on every change ────────────────────────────────────
  // Uses userRef (not `user`) so this effect does NOT run when the user
  // object changes — only when cart or mounted changes.
  useEffect(() => {
    if (!mounted) return;
    if (skipSaveRef.current) return; // skip while loading from cloud

    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

    const currentUser = userRef.current;
    if (currentUser) {
      saveUserCart(currentUser.id, cart).catch(() => {});
    }
  }, [cart, mounted]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const addToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            name: isArabic ? product.nameAr : product.nameEn,
            size: product.size,
            price: product.price,
            quantity: 1,
            image: product.image,
          },
        ];
      });
      setCartOpen(true);
    },
    [isArabic]
  );

  const updateQuantity = useCallback((id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id !== id
            ? item
            : { ...item, quantity: Math.max(1, item.quantity + delta) }
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const value: CartContextType = {
    cart,
    cartOpen,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    setCartOpen,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
