import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const CATEGORIES_COLLECTION = "categories";

function slugify(str: string) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[أإآا]/g, "a")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GET /api/admin/categories/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    const doc = await adminDb.collection(CATEGORIES_COLLECTION).doc(id).get();
    if (!doc.exists) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, category: { id: doc.id, ...doc.data() } });
  } catch (err) {
    console.error("[Admin Category GET] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch category" }, { status: 500 });
  }
}

// PATCH /api/admin/categories/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    const body = await req.json();

    const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
    const allowed = [
      "nameAr",
      "nameEn",
      "slug",
      "descriptionAr",
      "descriptionEn",
      "sortOrder",
      "status",
    ];

    for (const k of allowed) {
      if (body[k] !== undefined) {
        updates[k] = ["sortOrder"].includes(k) ? Number(body[k]) : body[k];
      }
    }

    if (updates.slug) updates.slug = slugify(updates.slug);

    // If slug changed ensure unique
    if (updates.slug) {
      const existing = await adminDb
        .collection(CATEGORIES_COLLECTION)
        .where("slug", "==", updates.slug)
        .limit(1)
        .get();
      if (!existing.empty && existing.docs[0].id !== id) {
        return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 409 });
      }
    }

    await adminDb.collection(CATEGORIES_COLLECTION).doc(id).update(updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Category PATCH] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  const { id } = await params;

  try {
    await adminDb.collection(CATEGORIES_COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Category DELETE] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
  }
}
