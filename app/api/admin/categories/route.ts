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

// GET /api/admin/categories?search=&limit=&status=
export async function GET(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const status = searchParams.get("status");

    let snapshot = await adminDb.collection(CATEGORIES_COLLECTION).get();
    let categories = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    if (status) categories = categories.filter((c) => c.status === status);
    if (search) {
      categories = categories.filter((c) =>
        [c.nameAr, c.nameEn, c.slug].some((v: string) =>
          (v || "").toLowerCase().includes(search)
        )
      );
    }

    categories.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return NextResponse.json({ success: true, categories });
  } catch (err) {
    console.error("[Admin Categories GET] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const body = await req.json();
    const nameAr = body.nameAr?.trim();
    const nameEn = body.nameEn?.trim();
    const slug = slugify(body.slug || nameEn || nameAr);

    if (!nameAr || !nameEn || !slug) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const existing = await adminDb
      .collection(CATEGORIES_COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 409 });
    }

    const now = FieldValue.serverTimestamp();
    const data = {
      nameAr,
      nameEn,
      slug,
      descriptionAr: body.descriptionAr || "",
      descriptionEn: body.descriptionEn || "",
      sortOrder: Number(body.sortOrder) || 0,
      status: body.status || "active", // active | hidden
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection(CATEGORIES_COLLECTION).add(data);
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("[Admin Categories POST] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}
