import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";

const PRODUCTS_COLLECTION = "products";

// GET /api/products — Public: list active products
export async function GET() {
  try {
    const col = adminDb.collection(PRODUCTS_COLLECTION);

    // Try status == 'active' first (no orderBy to avoid needing a composite index)
    let snapshot = await col.where("status", "==", "active").get();

    // Back-compat: if no products have a status field, fall back to archived == false
    if (snapshot.empty) {
      snapshot = await col.where("archived", "==", false).get();
    }

    // Sort in memory by sortOrder to avoid needing a composite Firestore index
    const products = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nameEn: data.nameEn,
          nameAr: data.nameAr,
          slug: data.slug,
          subtitleEn: data.subtitleEn,
          subtitleAr: data.subtitleAr,
          size: data.size,
          price: data.price,
          discountPrice: data.discountPrice ?? null,
          badgeEn: data.badgeEn,
          badgeAr: data.badgeAr,
          mainImage: data.mainImage,
          featured: data.featured,
          availability: data.availability,
          category: data.category,
          sortOrder: data.sortOrder ?? 0,
        };
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(({ sortOrder: _s, ...rest }) => rest); // strip internal field

    return NextResponse.json(
      { success: true, products },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("[Public Products] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
