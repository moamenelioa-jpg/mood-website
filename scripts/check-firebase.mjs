import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const envFile = readFileSync(envPath, "utf8");
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!b64) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
const sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
console.log("Service account project_id:", sa.project_id);

if (!getApps().length) {
  initializeApp({ credential: cert(sa) });
}
const db = getFirestore();

const snap = await db.collection("products").limit(5).get();
console.log("Products count in Firestore:", snap.size);
snap.docs.forEach(d => console.log(" -", d.id, d.data().nameEn, "status:", d.data().status));
process.exit(0);
