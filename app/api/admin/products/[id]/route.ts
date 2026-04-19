import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { adminDb, adminStorage, adminStorageBucket } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const PRODUCTS_COLLECTION = "products";

// GET /api/admin/products/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    const doc = await adminDb.collection(PRODUCTS_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: { id: doc.id, ...doc.data() },
    });
  } catch (err) {
    console.error("[Admin Product GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    const body = await req.json();
    const docRef = adminDb.collection(PRODUCTS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // If slug changed, check uniqueness
    if (body.slug && body.slug !== doc.data()?.slug) {
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
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    const allowedFields = [
      "nameEn", "nameAr", "slug", "subtitleEn", "subtitleAr",
      "descriptionEn", "descriptionAr", "category", "size",
      "price", "discountPrice", "sku", "stockQuantity",
      "availability", "featured", "archived", "badgeEn", "badgeAr",
      "tags", "mainImage", "galleryImages", "sortOrder",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (["price", "discountPrice", "stockQuantity", "sortOrder"].includes(field)) {
          updateData[field] = body[field] === null ? null : Number(body[field]);
        } else if (field === "featured" || field === "archived") {
          updateData[field] = Boolean(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Product PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    const docRef = adminDb.collection(PRODUCTS_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete associated images from Storage
    try {
      const bucket = adminStorage.bucket(adminStorageBucket);
      const [files] = await bucket.getFiles({ prefix: `products/${id}/` });
      await Promise.all(files.map((f) => f.delete()));
    } catch {
      // Non-critical: storage cleanup may fail
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Product DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
