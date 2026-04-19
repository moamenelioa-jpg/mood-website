"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";
import { ImageUploader, GalleryUploader } from "./ImageUploader";

export interface ProductFormData {
  nameEn: string;
  nameAr: string;
  slug: string;
  subtitleEn: string;
  subtitleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: string;
  size: string;
  price: string;
  discountPrice: string;
  sku: string;
  stockQuantity: string;
  availability: string;
  featured: boolean;
  badgeEn: string;
  badgeAr: string;
  tags: string;          // comma-separated
  mainImage: string;
  galleryImages: string[];
  sortOrder: string;
}

interface ProductFormProps {
  initial?: Partial<ProductFormData>;
  productId?: string;     // required for edit mode (image paths)
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[أإآا]/g, "a")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const EMPTY: ProductFormData = {
  nameEn: "", nameAr: "", slug: "",
  subtitleEn: "", subtitleAr: "",
  descriptionEn: "", descriptionAr: "",
  category: "", size: "",
  price: "", discountPrice: "",
  sku: "", stockQuantity: "100",
  availability: "in_stock",
  featured: false,
  badgeEn: "", badgeAr: "",
  tags: "",
  mainImage: "", galleryImages: [],
  sortOrder: "0",
};

export function ProductForm({
  initial,
  productId,
  onSubmit,
  submitLabel,
  submitting,
  error,
}: ProductFormProps) {
  const { getToken, session } = useAdminAuth();
  const [token, setToken] = useState<string>("");
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY, ...initial });

  // Load token once on mount for image uploads
  const ensureToken = useCallback(async () => {
    if (token) return token;
    const t = await getToken();
    if (t) setToken(t);
    return t ?? "";
  }, [token, getToken]);

  useEffect(() => { ensureToken(); }, [ensureToken]);

  const set = (field: keyof ProductFormData, value: string | boolean | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleNameEn = (val: string) => {
    set("nameEn", val);
    if (!form.slug || form.slug === slugify(form.nameEn)) {
      set("slug", slugify(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  // temp productId for new products (used in storage path)
  const storageId = productId ?? `new_${session?.uid?.slice(0, 8) ?? "product"}`;

  const inputCls = "w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm text-[#2b170d] placeholder:text-[#c0a898] focus:outline-none focus:border-[#15803d] transition";
  const labelCls = "block text-xs font-semibold text-[#5f3b1f] mb-1.5";
  const sectionCls = "rounded-2xl border border-[#edd1b6] bg-white p-6 space-y-5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Basic info */}
      <div className={sectionCls}>
        <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">المعلومات الأساسية</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>الاسم بالعربية <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} required placeholder="زبدة فول سوداني كرنشي" />
          </div>
          <div>
            <label className={labelCls}>الاسم بالإنجليزية <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.nameEn} onChange={(e) => handleNameEn(e.target.value)} required placeholder="Crunchy Peanut Butter" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Slug (URL) <span className="text-red-500">*</span></label>
          <input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} required placeholder="crunchy-peanut-butter" dir="ltr" />
          <p className="text-xs text-[#a08672] mt-1">يُولَّد تلقائياً من الاسم الإنجليزي — يمكن تعديله</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>العنوان الفرعي بالعربية</label>
            <input className={inputCls} value={form.subtitleAr} onChange={(e) => set("subtitleAr", e.target.value)} placeholder="قوام غني وطعم قوي" />
          </div>
          <div>
            <label className={labelCls}>العنوان الفرعي بالإنجليزية</label>
            <input className={inputCls} value={form.subtitleEn} onChange={(e) => set("subtitleEn", e.target.value)} placeholder="Bold texture, rich taste" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>الوصف بالعربية</label>
            <textarea className={inputCls + " h-28 resize-y"} value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} placeholder="وصف تفصيلي..." />
          </div>
          <div>
            <label className={labelCls}>الوصف بالإنجليزية</label>
            <textarea className={inputCls + " h-28 resize-y"} value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} placeholder="Full description..." />
          </div>
        </div>
      </div>

      {/* Pricing & inventory */}
      <div className={sectionCls}>
        <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">السعر والمخزون</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <label className={labelCls}>السعر (ج.م) <span className="text-red-500">*</span></label>
            <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required placeholder="79.99" />
          </div>
          <div>
            <label className={labelCls}>سعر الخصم (ج.م)</label>
            <input className={inputCls} type="number" min="0" step="0.01" value={form.discountPrice} onChange={(e) => set("discountPrice", e.target.value)} placeholder="69.99" />
          </div>
          <div>
            <label className={labelCls}>كمية المخزون</label>
            <input className={inputCls} type="number" min="0" value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} placeholder="100" />
          </div>
          <div>
            <label className={labelCls}>ترتيب العرض</label>
            <input className={inputCls} type="number" min="0" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={labelCls}>الحجم</label>
            <input className={inputCls} value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="300g" />
          </div>
          <div>
            <label className={labelCls}>SKU</label>
            <input className={inputCls} value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="MOOD-CRNCH-300" dir="ltr" />
          </div>
          <div>
            <label className={labelCls}>التوفر</label>
            <select className={inputCls} value={form.availability} onChange={(e) => set("availability", e.target.value)}>
              <option value="in_stock">متوفر</option>
              <option value="limited">كمية محدودة</option>
              <option value="out_of_stock">نفد المخزون</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className={sectionCls}>
        <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">التصنيف والبطاقات</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>الفئة <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Peanut Butter" required />
          </div>
          <div>
            <label className={labelCls}>التاغات (مفصولة بفاصلة)</label>
            <input className={inputCls} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="crunchy, protein, natural" dir="ltr" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>بطاقة بالعربية</label>
            <input className={inputCls} value={form.badgeAr} onChange={(e) => set("badgeAr", e.target.value)} placeholder="الأكثر مبيعًا" />
          </div>
          <div>
            <label className={labelCls}>بطاقة بالإنجليزية</label>
            <input className={inputCls} value={form.badgeEn} onChange={(e) => set("badgeEn", e.target.value)} placeholder="Best Seller" />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="h-4 w-4 rounded border-[#edd1b6] accent-[#15803d]"
          />
          <span className="text-sm font-semibold text-[#2b170d]">منتج مميز (يظهر في الصفحة الرئيسية)</span>
        </label>
      </div>

      {/* Images */}
      <div className={sectionCls}>
        <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">الصور</h2>

        <div className="flex flex-wrap gap-8">
          <ImageUploader
            label="الصورة الرئيسية (مطلوبة)"
            currentUrl={form.mainImage}
            storagePath={`products/${storageId}/main`}
            token={token}
            onUploaded={(url) => set("mainImage", url)}
            onDeleted={() => set("mainImage", "")}
          />
          <div className="flex-1 min-w-64">
            <GalleryUploader
              images={form.galleryImages}
              productId={storageId}
              token={token}
              onChange={(urls) => set("galleryImages", urls)}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-2xl bg-[#15803d] px-8 py-3 text-sm font-bold text-white shadow hover:bg-[#166534] transition disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
