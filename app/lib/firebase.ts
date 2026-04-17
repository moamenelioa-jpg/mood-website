import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug: Log Firebase config (remove in production)
console.log("[Firebase] Initializing with projectId:", firebaseConfig.projectId);

if (!firebaseConfig.projectId) {
  console.error("[Firebase] ERROR: Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable!");
}

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
let db: Firestore;
let analytics: Analytics | null = null;

function initializeFirebase(): FirebaseApp {
  if (getApps().length === 0) {
    console.log("[Firebase] Creating new app instance");
    app = initializeApp(firebaseConfig);
  } else {
    console.log("[Firebase] Using existing app instance");
    app = getApp();
  }
  return app;
}

// Initialize immediately
app = initializeFirebase();
db = getFirestore(app);
console.log("[Firebase] Firestore initialized successfully");

// Get Firebase App instance
export function getFirebaseApp(): FirebaseApp {
  return app;
}

// Get Firestore instance
export function getFirestoreDb(): Firestore {
  return db;
}

// Get Analytics instance (client-side only)
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  // Only initialize analytics on the client side
  if (typeof window === "undefined") {
    return null;
  }

  if (!analytics) {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
  }

  return analytics;
}

// Export instances for direct use
export { app, db };
