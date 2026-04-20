/**
 * One-shot product seeder — run with:
 *   node scripts/seed-products.mjs
 * from the mood-website folder.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// ─── Load .env.local manually (no dotenv dependency needed) ──────────────────
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
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

// ─── Init Firebase Admin ─────────────────────────────────────────────────────
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!b64) throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not set in .env.local");
const serviceAccount = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// ─── Products ────────────────────────────────────────────────────────────────
const products = [
  { id: 1,  slug: "crunchy",                nameEn: "Crunchy Peanut Butter",          nameAr: "زبدة فول سوداني كرنشي",         subtitleEn: "Bold texture, rich taste",              subtitleAr: "قوام غني وطعم قوي",                  size: "300g",  badgeEn: "Best Seller", badgeAr: "الأكثر مبيعًا",      price: 79.99,  image: "/products/crunchy.jfif" },
  { id: 2,  slug: "creamy",                 nameEn: "Creamy Peanut Butter",           nameAr: "زبدة فول سوداني كريمي",         subtitleEn: "Smooth, premium, satisfying",           subtitleAr: "ناعم، فاخر، ومشبع",                   size: "300g",  badgeEn: "New",         badgeAr: "جديد",               price: 79.99,  image: "/products/creamy.jpg" },
  { id: 3,  slug: "chocolate",              nameEn: "Chocolate Hazelnut Spread",      nameAr: "شوكولاتة موود بالبندق",         subtitleEn: "A richer indulgent blend",              subtitleAr: "مزيج أغنى وأكثر متعة",               size: "225g",  badgeEn: "Trending",    badgeAr: "رائج",               price: 33.99,  image: "/products/chocolate.jpg" },
  { id: 4,  slug: "family",                 nameEn: "Family Jar",                     nameAr: "العبوة العائلية",               subtitleEn: "Made for daily moments",                subtitleAr: "مناسبة للاستخدام اليومي",            size: "1kg",   badgeEn: "Value Pack",  badgeAr: "عبوة اقتصادية",     price: 210.99, image: "/products/family.jpg" },
  { id: 5,  slug: "diet",                   nameEn: "Diet Peanut Butter",             nameAr: "زبدة فول سوداني دايت",          subtitleEn: "Low sugar, high protein",               subtitleAr: "قليل السكر، عالي البروتين",          size: "300g",  badgeEn: "Healthy",     badgeAr: "صحي",                price: 79.99,  image: "/products/diet.jpg" },
  { id: 6,  slug: "honey-roasted",          nameEn: "Peanut Butter with Honey",       nameAr: "زبدة فول سوداني بالعسل",        subtitleEn: "Honey roasted peanut butter delight",   subtitleAr: "زبدة فول سوداني بعسل النحل الطبيعي", size: "300g",  badgeEn: "Premium",     badgeAr: "فاخر",               price: 85.99,  image: "/products/honey.jpg" },
  { id: 7,  slug: "chocolate-hazelnut",     nameEn: "Chocolate Hazelnut Spread 350g", nameAr: "شوكولاتة موود بالبندق 350 جرام", subtitleEn: "Rich hazelnut chocolate blend",          subtitleAr: "مزيج شوكولاتة غني بالبندق",          size: "350g",  badgeEn: "Popular",     badgeAr: "شائع",               price: 53.99,  image: "/products/chocolate-350g.jpg" },
  { id: 8,  slug: "diet-620",               nameEn: "Diet Peanut Butter 625g",        nameAr: "زبدة فول سوداني موود دايت 625",  subtitleEn: "Creamy diet peanut butter",             subtitleAr: "زبدة فول سوداني كريمية للدايت",      size: "625g",  badgeEn: "New",         badgeAr: "جديد",               price: 142.99, image: "/products/diet-620.jpg" },
  { id: 9,  slug: "chocolate-5kg",          nameEn: "Chocolate Hazelnut Spread 5kg",  nameAr: "شوكولاتة بالبندق 5 كيلو",       subtitleEn: "Pure chocolate hazelnut spread",        subtitleAr: "شوكولاتة لذيذة بنكهة البندق",        size: "5kg",   badgeEn: "Premium",     badgeAr: "فاخر",               price: 592.99, image: "/products/mood-gallon.jpg" },
  { id: 10, slug: "chocolate-hazelnut-50g", nameEn: "Chocolate Hazelnut Spread 50g",  nameAr: "شوكولاتة موود بالبندق 50 جرام", subtitleEn: "Mini chocolate hazelnut treat",          subtitleAr: "شوكولاتة بالبندق حجم صغير",          size: "50g",   badgeEn: "Mini",        badgeAr: "ميني",               price: 11.99,  image: "/products/choco50.jpeg" },
  { id: 11, slug: "chocolate-hazelnut-800g",nameEn: "Chocolate Hazelnut Spread 800g", nameAr: "شوكولاتة موود بالبندق 800 جرام",subtitleEn: "Large chocolate hazelnut spread",        subtitleAr: "شوكولاتة بالبندق حجم كبير",          size: "800g",  badgeEn: "Value Pack",  badgeAr: "عبوة اقتصادية",     price: 99,     image: "/products/choco800.jpg" },
];

// ─── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  const col = db.collection("products");

  // Clear existing
  const existing = await col.get();
  if (!existing.empty) {
    const delBatch = db.batch();
    for (const doc of existing.docs) delBatch.delete(doc.ref);
    await delBatch.commit();
    console.log(`Deleted ${existing.size} existing products`);
  }

  const now = FieldValue.serverTimestamp();
  const batch = db.batch();

  for (const p of products) {
    const ref = col.doc();
    batch.set(ref, {
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      slug: p.slug,
      subtitleEn: p.subtitleEn,
      subtitleAr: p.subtitleAr,
      descriptionEn: "",
      descriptionAr: "",
      category: "Peanut Butter",
      size: p.size,
      price: p.price,
      discountPrice: null,
      sku: "",
      stockQuantity: 100,
      availability: "in_stock",
      status: "active",
      featured: p.id <= 4,
      archived: false,
      badgeEn: p.badgeEn,
      badgeAr: p.badgeAr,
      tags: [],
      mainImage: p.image,
      galleryImages: [],
      sortOrder: p.id,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log(`✅ Seeded ${products.length} products into Firestore`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message || err);
  process.exit(1);
});
