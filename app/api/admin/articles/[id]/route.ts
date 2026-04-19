import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { adminDb, adminStorage, adminStorageBucket } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const ARTICLES_COLLECTION = "articles";

// GET /api/admin/articles/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    const doc = await adminDb.collection(ARTICLES_COLLECTION).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article: { id: doc.id, ...doc.data() },
    });
  } catch (err) {
    console.error("[Admin Article GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/articles/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    const body = await req.json();
    const docRef = adminDb.collection(ARTICLES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    // If slug changed, check uniqueness
    if (body.slug && body.slug !== doc.data()?.slug) {
      const existing = await adminDb
        .collection(ARTICLES_COLLECTION)
        .where("slug", "==", body.slug)
        .limit(1)
        .get();

      if (!existing.empty) {
        return NextResponse.json(
          { success: false, error: "An article with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    const allowedFields = [
      "titleEn", "titleAr", "slug", "excerptEn", "excerptAr",
      "contentEn", "contentAr", "coverImage", "galleryImages",
      "category", "tags", "author", "seoTitle", "seoDescription", "status",
    ];

    const previousStatus = doc.data()?.status;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Set publishedAt when transitioning to published
    if (body.status === "published" && previousStatus !== "published") {
      updateData.publishedAt = FieldValue.serverTimestamp();
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Article PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/articles/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    const docRef = adminDb.collection(ARTICLES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    // Delete associated images from Storage
    try {
      const bucket = adminStorage.bucket(adminStorageBucket);
      const [files] = await bucket.getFiles({ prefix: `articles/${id}/` });
      await Promise.all(files.map((f) => f.delete()));
    } catch {
      // Non-critical
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Article DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
