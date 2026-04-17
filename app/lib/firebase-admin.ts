import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let adminDb: Firestore;
let adminStorage: Storage;
let adminAuth: Auth;

function normalizeStorageBucket(bucket: string | undefined): string | undefined {
  if (!bucket) {
    return undefined;
  }

  return bucket.replace(/^gs:\/\//, "").trim() || undefined;
}

export const adminStorageBucket = normalizeStorageBucket(
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const storageBucket = adminStorageBucket;

  // Option 1: Service account JSON via env var (base64 encoded)
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountBase64) {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
    );
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket,
    });
  }

  // Option 2: Individual env vars
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  }

  // Option 3: Fallback to Application Default Credentials (works on GCP / Firebase Hosting)
  // For Hostinger, you MUST use Option 1 or Option 2 above.
  if (projectId) {
    console.warn(
      "[Firebase Admin] No service account credentials found. Initializing with projectId only. " +
      "Firestore writes will FAIL unless running on GCP with ADC."
    );
    return initializeApp({ projectId, storageBucket });
  }

  throw new Error(
    "[Firebase Admin] Cannot initialize: missing FIREBASE_SERVICE_ACCOUNT_BASE64 or " +
    "FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY"
  );
}

app = getAdminApp();
adminDb = getFirestore(app);
adminStorage = getStorage(app);
adminAuth = getAuth(app);

export { adminDb, adminStorage, adminAuth };
