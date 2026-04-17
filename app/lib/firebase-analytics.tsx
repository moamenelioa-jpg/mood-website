"use client";

import { useEffect, useState } from "react";
import { getFirebaseAnalytics } from "@/app/lib/firebase";

/**
 * Hook to initialize Firebase Analytics on the client side.
 * Use this in your root layout or any client component.
 */
export function useFirebaseAnalytics() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      // Initialize analytics on mount (client-side only)
      getFirebaseAnalytics()
        .then(() => setInitialized(true))
        .catch((error) => {
          console.warn("Firebase Analytics initialization failed:", error);
        });
    }
  }, [initialized]);

  return initialized;
}

/**
 * Provider component for Firebase Analytics.
 * This component doesn't wrap children - it just initializes analytics.
 * Add this anywhere in your layout to enable analytics.
 */
export function FirebaseAnalytics() {
  useFirebaseAnalytics();
  return null;
}

/**
 * Legacy provider that wraps children.
 * Prefer using FirebaseAnalytics component instead.
 */
export function FirebaseAnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useFirebaseAnalytics();
  return <>{children}</>;
}
