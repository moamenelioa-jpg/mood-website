import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { products } from "@/app/lib/products";
import { blogPosts } from "@/app/lib/blogs";

// POST /api/admin/seed — Seed existing hardcoded data into Firestore
export async function POST(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("target"); // "products", "articles", "all"
    const results: string[] = [];

    if (target === "products" || target === "all") {
      // Check if products already seeded
      const existing = await adminDb.collection("products").limit(1).get();
      if (!existing.empty) {
        results.push(`Products: skipped (${(await adminDb.collection("products").count().get()).data().count} already exist)`);
      } else {
        const batch = adminDb.batch();
        const now = FieldValue.serverTimestamp();

        for (const p of products) {
          const ref = adminDb.collection("products").doc();
          batch.set(ref, {
            nameEn: p.nameEn,
            nameAr: p.nameAr,
            slug: p.slug,
            subtitleEn: p.subtitleEn,
            subtitleAr: p.subtitleAr,
            descriptionEn: "",
            descriptionAr: "",
            category: "",
            size: p.size,
            price: p.price,
            discountPrice: null,
            sku: "",
            stockQuantity: 100,
            availability: "in_stock",
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
        results.push(`Products: seeded ${products.length} items`);
      }
    }

    if (target === "articles" || target === "all") {
      const existing = await adminDb.collection("articles").limit(1).get();
      if (!existing.empty) {
        results.push(`Articles: skipped (${(await adminDb.collection("articles").count().get()).data().count} already exist)`);
      } else {
        const batch = adminDb.batch();
        const now = FieldValue.serverTimestamp();

        for (const b of blogPosts) {
          const ref = adminDb.collection("articles").doc();
          batch.set(ref, {
            titleEn: b.titleEn,
            titleAr: b.titleAr,
            slug: b.slug,
            excerptEn: b.contentEn.substring(0, 200) + "...",
            excerptAr: b.contentAr.substring(0, 200) + "...",
            contentEn: b.contentEn,
            contentAr: b.contentAr,
            coverImage: b.image,
            galleryImages: [],
            category: "Products",
            tags: ["peanut butter"],
            author: "Mood",
            seoTitle: b.titleEn,
            seoDescription: b.contentEn.substring(0, 160),
            status: "published",
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        }

        await batch.commit();
        results.push(`Articles: seeded ${blogPosts.length} items`);
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Specify ?target=products|articles|all' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("[Admin Seed] Error:", err);
    return NextResponse.json(
      { success: false, error: "Seed failed" },
      { status: 500 }
    );
  }
}
