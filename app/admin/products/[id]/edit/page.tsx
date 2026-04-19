"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";
import { ProductForm, ProductFormData } from "@/app/admin/components/ProductForm";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { getToken } = useAdminAuth();

  const [initial, setInitial] = useState<Partial<ProductFormData> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      const res = await fetch(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Product not found");

      const p = data.product;
      setInitial({
        nameEn: p.nameEn ?? "",
        nameAr: p.nameAr ?? "",
        slug: p.slug ?? "",
        subtitleEn: p.subtitleEn ?? "",
        subtitleAr: p.subtitleAr ?? "",
        descriptionEn: p.descriptionEn ?? "",
        descriptionAr: p.descriptionAr ?? "",
        category: p.category ?? "",
        size: p.size ?? "",
        price: String(p.price ?? ""),
        discountPrice: p.discountPrice != null ? String(p.discountPrice) : "",
        sku: p.sku ?? "",
        stockQuantity: String(p.stockQuantity ?? 0),
        availability: p.availability ?? "in_stock",
        featured: Boolean(p.featured),
        badgeEn: p.badgeEn ?? "",
        badgeAr: p.badgeAr ?? "",
        tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
        mainImage: p.mainImage ?? "",
        galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages : [],
        sortOrder: String(p.sortOrder ?? 0),
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "خطأ في التحميل");
    }
  }, [id, getToken]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const payload = {
        nameEn: data.nameEn.trim(),
        nameAr: data.nameAr.trim(),
        slug: data.slug.trim(),
        subtitleEn: data.subtitleEn.trim(),
        subtitleAr: data.subtitleAr.trim(),
        descriptionEn: data.descriptionEn.trim(),
        descriptionAr: data.descriptionAr.trim(),
        category: data.category.trim(),
        size: data.size.trim(),
        price: parseFloat(data.price) || 0,
        discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
        sku: data.sku.trim(),
        stockQuantity: parseInt(data.stockQuantity) || 0,
        availability: data.availability,
        featured: data.featured,
        badgeEn: data.badgeEn.trim(),
        badgeAr: data.badgeAr.trim(),
        tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
        mainImage: data.mainImage,
        galleryImages: data.galleryImages,
        sortOrder: parseInt(data.sortOrder) || 0,
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Failed to update");

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="p-6 max-w-4xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <span className="text-sm">{loadError}</span>
        </div>
      </div>
    );
  }

  if (!initial) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#a08672] mb-6">
        <Link href="/admin/products" className="hover:text-[#15803d] flex items-center gap-1">
          <ArrowRight className="h-4 w-4" />
          المنتجات
        </Link>
        <span>/</span>
        <span className="text-[#2b170d] font-semibold">تعديل المنتج</span>
      </div>

      <h1 className="text-2xl font-black text-[#2b170d] mb-6">تعديل المنتج</h1>

      <ProductForm
        initial={initial}
        productId={id}
        onSubmit={handleSubmit}
        submitLabel="حفظ التغييرات"
        submitting={submitting}
        error={submitError}
      />
    </div>
  );
}
