import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";

const PRODUCTS_COLLECTION = "products";

// GET /api/products — Public: list active products
export async function GET() {
  try {
    let snapshot;
    try {
      // Preferred: status == 'active'
      snapshot = await adminDb
        .collection(PRODUCTS_COLLECTION)
        .where("status", "==", "active")
        .orderBy("sortOrder", "asc")
        .get();
    } catch {
      // Backward compatibility: fall back to archived == false
      snapshot = await adminDb
        .collection(PRODUCTS_COLLECTION)
        .where("archived", "==", false)
        .orderBy("sortOrder", "asc")
        .get();
    }

    const products = snapshot.docs.map((doc) => {
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
        discountPrice: data.discountPrice,
        badgeEn: data.badgeEn,
        badgeAr: data.badgeAr,
        mainImage: data.mainImage,
        featured: data.featured,
        availability: data.availability,
        category: data.category,
      };
    });

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
