import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function normalizeStorageBucket(bucket: string | undefined): string | undefined {
  if (!bucket) return undefined;
  return bucket.replace(/^gs:\/\//, "").trim() || undefined;
}

export const adminStorageBucket = normalizeStorageBucket(
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

// ─────────────────────────────────────────────────────────────
// Lazy initialization — runs on first request, NOT at build time
// ─────────────────────────────────────────────────────────────

// Cache on globalThis so hot-reload doesn't create multiple instances.
const g = globalThis as {
  __firebaseAdminApp?: App;
};

function createAdminApp(): App {
  // Reuse already-initialised app (handles HMR / multiple imports)
  if (getApps().length > 0) return getApps()[0];

  const storageBucket = adminStorageBucket;

  // Option 1: Base64-encoded service account JSON (recommended for Hostinger / CI)
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountBase64) {
    let serviceAccount: object;
    try {
      serviceAccount = JSON.parse(
        Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
      );
    } catch (err) {
      throw new Error(
        "[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_BASE64 is set but could not be decoded as JSON. " +
        "Make sure it is a valid base64-encoded service account JSON string. " +
        `Original error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return initializeApp({ credential: cert(serviceAccount), storageBucket });
  }

  // Option 2: Individual credential env vars
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  }

  // Option 3: Application Default Credentials (GCP / Firebase Hosting only)
  if (projectId) {
    console.warn(
      "[Firebase Admin] No service account credentials found. " +
      "Initializing with projectId only — Firestore writes will FAIL unless running on GCP with ADC."
    );
    return initializeApp({ projectId, storageBucket });
  }

  throw new Error(
    "[Firebase Admin] Cannot initialize: supply FIREBASE_SERVICE_ACCOUNT_BASE64, " +
    "or FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY."
  );
}

function getAdminApp(): App {
  if (!g.__firebaseAdminApp) {
    g.__firebaseAdminApp = createAdminApp();
  }
  return g.__firebaseAdminApp;
}

// ─────────────────────────────────────────────────────────────
// Lazy Proxy exports — identical API to the old eager exports,
// but initialization is deferred to the first property access
// (i.e. the first incoming request), never during `next build`.
// ─────────────────────────────────────────────────────────────

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    return Reflect.get(getFirestore(getAdminApp()), prop);
  },
});

export const adminStorage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    return Reflect.get(getStorage(getAdminApp()), prop);
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    return Reflect.get(getAuth(getAdminApp()), prop);
  },
});
