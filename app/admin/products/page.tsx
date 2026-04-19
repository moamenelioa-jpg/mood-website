"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  PlusCircle, Search, Package, Pencil, Trash2, Archive,
  ArchiveRestore, Loader2, AlertCircle, RefreshCw, ChevronUp, ChevronDown,
} from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  size: string;
  availability: string;
  featured: boolean;
  archived: boolean;
  mainImage: string;
  stockQuantity: number;
  category: string;
  sortOrder: number;
}

type SortKey = "nameAr" | "price" | "sortOrder" | "stockQuantity";
type SortDir = "asc" | "desc";

const AVAILABILITY_LABELS: Record<string, string> = {
  in_stock: "متوفر",
  out_of_stock: "نفد",
  limited: "كمية محدودة",
};

const AVAILABILITY_BG: Record<string, string> = {
  in_stock: "bg-green-100 text-green-800",
  out_of_stock: "bg-red-100 text-red-800",
  limited: "bg-yellow-100 text-yellow-800",
};

export default function AdminProductsPage() {
  const { getToken } = useAdminAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("all");
  const [filterArchived, setFilterArchived] = useState<"active" | "archived" | "all">("active");
  const [sortKey, setSortKey] = useState<SortKey>("sortOrder");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      const res = await fetch("/api/admin/products?archived=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to fetch");
      setProducts(data.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في التحميل");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleArchive = async (id: string, currentArchived: boolean) => {
    setActionLoading(id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !currentArchived }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, archived: !currentArchived } : p));
      showToast(currentArchived ? "تم استعادة المنتج" : "تم أرشفة المنتج");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(null);
    setActionLoading(id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("تم حذف المنتج نهائياً");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Filter + sort
  const displayed = products
    .filter((p) => {
      if (filterArchived === "active" && p.archived) return false;
      if (filterArchived === "archived" && !p.archived) return false;
      if (filterAvail !== "all" && p.availability !== filterAvail) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.nameAr.includes(q) || p.nameEn.toLowerCase().includes(q) || p.slug.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null : sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 inline ms-1" />
      : <ChevronDown className="h-3 w-3 inline ms-1" />;

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition ${toast.type === "success" ? "bg-[#15803d]" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" dir="rtl">
            <h3 className="font-black text-[#2b170d] text-lg mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-[#5f3b1f] mb-6">هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد من حذف هذا المنتج نهائياً؟</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-bold hover:bg-red-700 transition">
                حذف نهائياً
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-[#edd1b6] text-[#5f3b1f] py-2.5 text-sm font-bold hover:bg-[#f9f5f0] transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#2b170d]">المنتجات</h1>
          <p className="text-sm text-[#a08672] mt-1">{products.filter(p => !p.archived).length} منتج نشط</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} disabled={loading} className="p-2 rounded-xl border border-[#edd1b6] bg-white hover:bg-[#f9f5f0] transition">
            <RefreshCw className={`h-4 w-4 text-[#5f3b1f] ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/admin/products/new" className="flex items-center gap-2 rounded-xl bg-[#15803d] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#166534] transition shadow-sm">
            <PlusCircle className="h-4 w-4" />
            إضافة منتج
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a08672]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الـ slug..."
            className="w-full rounded-xl border border-[#edd1b6] bg-white pr-9 pl-4 py-2.5 text-sm text-[#2b170d] placeholder:text-[#c0a898] focus:outline-none focus:border-[#15803d] transition"
          />
        </div>
        <select
          value={filterArchived}
          onChange={(e) => setFilterArchived(e.target.value as "active" | "archived" | "all")}
          className="rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm text-[#5f3b1f] focus:outline-none focus:border-[#15803d]"
        >
          <option value="active">النشطة فقط</option>
          <option value="archived">المؤرشفة فقط</option>
          <option value="all">الكل</option>
        </select>
        <select
          value={filterAvail}
          onChange={(e) => setFilterAvail(e.target.value)}
          className="rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm text-[#5f3b1f] focus:outline-none focus:border-[#15803d]"
        >
          <option value="all">كل التوفرية</option>
          <option value="in_stock">متوفر</option>
          <option value="limited">كمية محدودة</option>
          <option value="out_of_stock">نفد</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-5">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[#a08672]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">جاري التحميل...</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-10 w-10 text-[#c0a898] mx-auto mb-3" />
            <p className="text-sm text-[#a08672]">
              {products.length === 0
                ? "لا توجد منتجات — أضف منتجاً أو قم بالبذر من لوحة التحكم"
                : "لا توجد منتجات تطابق البحث"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#edd1b6] bg-[#f9f5f0] text-right">
                  <th className="px-5 py-3 font-semibold text-[#5f3b1f]">المنتج</th>
                  <th className="px-5 py-3 font-semibold text-[#5f3b1f] cursor-pointer select-none" onClick={() => toggleSort("price")}>
                    السعر <SortIcon k="price" />
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#5f3b1f]">الحجم</th>
                  <th className="px-5 py-3 font-semibold text-[#5f3b1f] cursor-pointer select-none" onClick={() => toggleSort("stockQuantity")}>
                    المخزون <SortIcon k="stockQuantity" />
                  </th>
                  <th className="px-5 py-3 font-semibold text-[#5f3b1f]">التوفر</th>
                  <th className="px-5 py-3 font-semibold text-[#5f3b1f]">الحالة</th>
                  <th className="px-5 py-3 font-semibold text-[#5f3b1f]">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edd1b6]/60">
                {displayed.map((p) => (
                  <tr key={p.id} className={`hover:bg-[#f9f5f0]/50 transition ${p.archived ? "opacity-50" : ""}`}>
                    {/* Product */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#f9f5f0] overflow-hidden flex-shrink-0">
                          {p.mainImage
                            ? <img src={p.mainImage} alt={p.nameEn} className="h-full w-full object-cover" />
                            : <Package className="h-5 w-5 m-2.5 text-[#c0a898]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#2b170d] truncate">{p.nameAr}</p>
                          <p className="text-xs text-[#a08672] truncate">{p.slug}</p>
                        </div>
                        {p.featured && (
                          <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">مميز</span>
                        )}
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-semibold text-[#2b170d]">{p.price} ج.م</span>
                      {p.discountPrice ? (
                        <span className="block text-xs text-[#15803d]">{p.discountPrice} ج.م</span>
                      ) : null}
                    </td>
                    {/* Size */}
                    <td className="px-5 py-3 text-[#5f3b1f]">{p.size || "—"}</td>
                    {/* Stock */}
                    <td className="px-5 py-3 text-[#2b170d]">{p.stockQuantity}</td>
                    {/* Availability */}
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${AVAILABILITY_BG[p.availability] ?? "bg-gray-100 text-gray-600"}`}>
                        {AVAILABILITY_LABELS[p.availability] ?? p.availability}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3">
                      {p.archived
                        ? <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">مؤرشف</span>
                        : <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">نشط</span>}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {actionLoading === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[#a08672]" />
                        ) : (
                          <>
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className="p-1.5 rounded-lg text-[#5f3b1f] hover:bg-[#f0faf4] hover:text-[#15803d] transition"
                              title="تعديل"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleArchive(p.id, p.archived)}
                              className="p-1.5 rounded-lg text-[#5f3b1f] hover:bg-amber-50 hover:text-amber-700 transition"
                              title={p.archived ? "استعادة" : "أرشفة"}
                            >
                              {p.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(p.id)}
                              className="p-1.5 rounded-lg text-[#5f3b1f] hover:bg-red-50 hover:text-red-600 transition"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer count */}
        {!loading && displayed.length > 0 && (
          <div className="px-5 py-3 border-t border-[#edd1b6] text-xs text-[#a08672]">
            عرض {displayed.length} من {products.length} منتج
          </div>
        )}
      </div>
    </div>
  );
}
