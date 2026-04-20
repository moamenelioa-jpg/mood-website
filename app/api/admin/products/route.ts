import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const PRODUCTS_COLLECTION = "products";

// GET /api/admin/products — List all products
export async function GET(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";

    // Fetch all without orderBy to avoid composite index requirement,
    // then sort in memory.
    let snapshot;
    if (includeArchived) {
      snapshot = await adminDb.collection(PRODUCTS_COLLECTION).get();
    } else {
      snapshot = await adminDb
        .collection(PRODUCTS_COLLECTION)
        .where("archived", "==", false)
        .get();
    }

    const products = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return NextResponse.json({ success: true, products });
  } catch (err) {
    console.error("[Admin Products GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products — Create a product
export async function POST(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const body = await req.json();

    // Validate required fields
    const required = ["nameEn", "nameAr", "slug", "price"];
    for (const field of required) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check slug uniqueness
    const existing = await adminDb
      .collection(PRODUCTS_COLLECTION)
      .where("slug", "==", body.slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { success: false, error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const productData = {
      nameEn: body.nameEn || "",
      nameAr: body.nameAr || "",
      slug: body.slug,
      subtitleEn: body.subtitleEn || "",
      subtitleAr: body.subtitleAr || "",
      descriptionEn: body.descriptionEn || "",
      descriptionAr: body.descriptionAr || "",
      category: body.category || "",
      size: body.size || "",
      price: Number(body.price) || 0,
      discountPrice: body.discountPrice ? Number(body.discountPrice) : null,
      sku: body.sku || "",
      stockQuantity: Number(body.stockQuantity) ?? 0,
      availability: body.availability || "in_stock",
      featured: Boolean(body.featured),
      status: body.status || "active",
      archived: false,
      badgeEn: body.badgeEn || "",
      badgeAr: body.badgeAr || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      mainImage: body.mainImage || "",
      mainImagePath: body.mainImagePath || "",
      galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages : [],
      galleryImagePaths: Array.isArray(body.galleryImagePaths) ? body.galleryImagePaths : [],
      sortOrder: Number(body.sortOrder) || 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection(PRODUCTS_COLLECTION).add(productData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
    });
  } catch (err) {
    console.error("[Admin Products POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
