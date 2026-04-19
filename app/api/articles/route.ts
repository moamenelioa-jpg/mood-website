import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase-admin";

const ARTICLES_COLLECTION = "articles";

// GET /api/articles — Public: list published articles
export async function GET() {
  try {
    const snapshot = await adminDb
      .collection(ARTICLES_COLLECTION)
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .get();

    const articles = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        titleEn: data.titleEn,
        titleAr: data.titleAr,
        slug: data.slug,
        excerptEn: data.excerptEn,
        excerptAr: data.excerptAr,
        coverImage: data.coverImage,
        category: data.category,
        tags: data.tags,
        author: data.author,
        publishedAt: data.publishedAt,
      };
    });

    return NextResponse.json({ success: true, articles });
  } catch (err) {
    console.error("[Public Articles] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
