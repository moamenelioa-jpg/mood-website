import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { adminDb } from "@/app/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const ARTICLES_COLLECTION = "articles";

// GET /api/admin/articles — List all articles
export async function GET(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // published, draft, archived

    let query: FirebaseFirestore.Query = adminDb
      .collection(ARTICLES_COLLECTION)
      .orderBy("createdAt", "desc");

    if (status && ["published", "draft", "archived"].includes(status)) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    const articles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, articles });
  } catch (err) {
    console.error("[Admin Articles GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/articles — Create an article
export async function POST(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const body = await req.json();

    const required = ["titleEn", "titleAr", "slug"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check slug uniqueness
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

    const now = FieldValue.serverTimestamp();
    const articleData = {
      titleEn: body.titleEn || "",
      titleAr: body.titleAr || "",
      slug: body.slug,
      excerptEn: body.excerptEn || "",
      excerptAr: body.excerptAr || "",
      contentEn: body.contentEn || "",
      contentAr: body.contentAr || "",
      coverImage: body.coverImage || "",
      galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages : [],
      category: body.category || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      author: body.author || "",
      seoTitle: body.seoTitle || "",
      seoDescription: body.seoDescription || "",
      status: body.status === "published" ? "published" : "draft",
      publishedAt: body.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection(ARTICLES_COLLECTION).add(articleData);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("[Admin Articles POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create article" },
      { status: 500 }
    );
  }
}
