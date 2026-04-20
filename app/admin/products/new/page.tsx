"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";
import { ProductForm, ProductFormData } from "@/app/admin/components/ProductForm";

export default function NewProductPage() {
  const router = useRouter();
  const { getToken } = useAdminAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      // Client-side validation (minimal and non-invasive)
      const nameEn = data.nameEn.trim();
      const nameAr = data.nameAr.trim();
      const category = data.category.trim();
      const descEn = data.descriptionEn.trim();
      const descAr = data.descriptionAr.trim();
      const priceNum = parseFloat(data.price);

      if (!nameEn || !nameAr) throw new Error("الاسم بالعربية والإنجليزية مطلوبان");
      if (!category) throw new Error("الفئة مطلوبة");
      if (!descEn && !descAr) throw new Error("الوصف بالعربية أو الإنجليزية مطلوب");
      if (!data.mainImage) throw new Error("الصورة الرئيسية مطلوبة");
      if (!(priceNum > 0)) throw new Error("السعر يجب أن يكون رقمًا أكبر من 0");

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
        mainImagePath: data.mainImagePath,
        galleryImages: data.galleryImages,
        galleryImagePaths: data.galleryImagePaths,
        sortOrder: parseInt(data.sortOrder) || 0,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Failed to create product");

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#a08672] mb-6">
        <Link href="/admin/products" className="hover:text-[#15803d] flex items-center gap-1">
          <ArrowRight className="h-4 w-4" />
          المنتجات
        </Link>
        <span>/</span>
        <span className="text-[#2b170d] font-semibold">منتج جديد</span>
      </div>

      <h1 className="text-2xl font-black text-[#2b170d] mb-6">إضافة منتج جديد</h1>

      <ProductForm
        onSubmit={handleSubmit}
        submitLabel="حفظ المنتج"
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
