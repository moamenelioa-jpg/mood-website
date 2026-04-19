"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";
import { ImageUploader } from "@/app/admin/components/ImageUploader";

interface ArticleFormData {
  titleAr: string;
  titleEn: string;
  slug: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  category: string;
  author: string;
  tags: string;
  coverImage: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { getToken } = useAdminAuth();

  const [form, setForm] = useState<ArticleFormData | null>(null);
  const [token, setToken] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const ensureToken = useCallback(async () => {
    if (token) return token;
    const t = await getToken();
    if (t) setToken(t);
    return t ?? "";
  }, [token, getToken]);

  const load = useCallback(async () => {
    try {
      const t = await ensureToken();
      if (!t) throw new Error("No auth token");
      const res = await fetch(`/api/admin/articles/${id}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Article not found");
      const a = data.article;
      setForm({
        titleAr: a.titleAr ?? "",
        titleEn: a.titleEn ?? "",
        slug: a.slug ?? "",
        excerptAr: a.excerptAr ?? "",
        excerptEn: a.excerptEn ?? "",
        contentAr: a.contentAr ?? "",
        contentEn: a.contentEn ?? "",
        category: a.category ?? "",
        author: a.author ?? "",
        tags: Array.isArray(a.tags) ? a.tags.join(", ") : "",
        coverImage: a.coverImage ?? "",
        status: a.status ?? "draft",
        seoTitle: a.seoTitle ?? "",
        seoDescription: a.seoDescription ?? "",
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "خطأ في التحميل");
    }
  }, [id, ensureToken]);

  useEffect(() => { load(); }, [load]);

  const set = (field: keyof ArticleFormData, value: string) =>
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const t = await ensureToken();
      if (!t) throw new Error("No auth token");

      const payload = {
        titleAr: form.titleAr.trim(),
        titleEn: form.titleEn.trim(),
        slug: form.slug.trim(),
        excerptAr: form.excerptAr.trim(),
        excerptEn: form.excerptEn.trim(),
        contentAr: form.contentAr.trim(),
        contentEn: form.contentEn.trim(),
        category: form.category.trim(),
        author: form.author.trim(),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        coverImage: form.coverImage,
        status: form.status,
        seoTitle: form.seoTitle.trim(),
        seoDescription: form.seoDescription.trim(),
      };

      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Failed to update article");

      router.push("/admin/articles");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm text-[#2b170d] placeholder:text-[#c0a898] focus:outline-none focus:border-[#15803d] transition";
  const labelCls = "block text-xs font-semibold text-[#5f3b1f] mb-1.5";
  const sectionCls = "rounded-2xl border border-[#edd1b6] bg-white p-6 space-y-5";

  if (loadError) {
    return (
      <div className="p-6 max-w-4xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{loadError}</span>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-[#a08672] mb-6">
        <Link href="/admin/articles" className="hover:text-[#15803d] flex items-center gap-1">
          <ArrowRight className="h-4 w-4" />
          المقالات
        </Link>
        <span>/</span>
        <span className="text-[#2b170d] font-semibold">تعديل المقال</span>
      </div>

      <h1 className="text-2xl font-black text-[#2b170d] mb-6">تعديل المقال</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{submitError}</span>
          </div>
        )}

        {/* Basic info */}
        <div className={sectionCls}>
          <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">المعلومات الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>العنوان بالعربية <span className="text-red-500">*</span></label>
              <input className={inputCls} value={form.titleAr} onChange={(e) => set("titleAr", e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>العنوان بالإنجليزية <span className="text-red-500">*</span></label>
              <input className={inputCls} value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Slug (URL)</label>
            <input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>مقتطف بالعربية</label>
              <textarea className={inputCls + " h-24 resize-y"} value={form.excerptAr} onChange={(e) => set("excerptAr", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>مقتطف بالإنجليزية</label>
              <textarea className={inputCls + " h-24 resize-y"} value={form.excerptEn} onChange={(e) => set("excerptEn", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={sectionCls}>
          <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">محتوى المقال</h2>
          <div>
            <label className={labelCls}>المحتوى بالعربية</label>
            <textarea className={inputCls + " h-48 resize-y"} value={form.contentAr} onChange={(e) => set("contentAr", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>المحتوى بالإنجليزية</label>
            <textarea className={inputCls + " h-48 resize-y"} value={form.contentEn} onChange={(e) => set("contentEn", e.target.value)} />
          </div>
        </div>

        {/* Cover image */}
        <div className={sectionCls}>
          <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">الصورة الغلاف</h2>
          <ImageUploader
            label="صورة الغلاف"
            currentUrl={form.coverImage}
            storagePath={`articles/${id}/cover`}
            token={token}
            onUploaded={(url) => set("coverImage", url)}
            onDeleted={() => set("coverImage", "")}
          />
        </div>

        {/* Classification + status */}
        <div className={sectionCls}>
          <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">التصنيف والنشر</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>الفئة</label>
              <input className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>الكاتب</label>
              <input className={inputCls} value={form.author} onChange={(e) => set("author", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>الحالة</label>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>التاغات (مفصولة بفاصلة)</label>
            <input className={inputCls} value={form.tags} onChange={(e) => set("tags", e.target.value)} dir="ltr" />
          </div>
        </div>

        {/* SEO */}
        <div className={sectionCls}>
          <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">SEO</h2>
          <div>
            <label className={labelCls}>عنوان SEO</label>
            <input className={inputCls} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className={labelCls}>وصف SEO</label>
            <textarea className={inputCls + " h-20 resize-y"} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} dir="ltr" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => window.history.back()} className="rounded-xl border border-[#edd1b6] bg-white px-6 py-2.5 text-sm font-bold text-[#5f3b1f] hover:bg-[#f9f5f0] transition">
            إلغاء
          </button>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-[#15803d] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#166534] transition disabled:opacity-60 shadow-sm">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ التغييرات
          </button>
        </div>
      </form>
    </div>
  );
}
