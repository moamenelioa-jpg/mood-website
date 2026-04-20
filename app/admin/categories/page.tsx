"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, PlusCircle, Trash2, Edit, RefreshCw, Search } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  sortOrder?: number;
  status: "active" | "hidden";
}

export default function AdminCategoriesPage() {
  const { getToken } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    nameAr: "",
    nameEn: "",
    slug: "",
    descriptionAr: "",
    descriptionEn: "",
    sortOrder: 0,
    status: "active" as const,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      [c.nameAr, c.nameEn, c.slug].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [search, categories]);

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/categories?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load");
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create");
      setForm({ nameAr: "", nameEn: "", slug: "", descriptionAr: "", descriptionEn: "", sortOrder: 0, status: "active" });
      await load();
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;
    const token = await getToken();
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) return alert(data.error || "فشل الحذف");
    await load();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-[#2b170d]">إدارة الفئات</h1>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-white px-4 py-2 text-sm font-semibold text-[#5f3b1f] hover:bg-[#f9f5f0]">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> تحديث
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Create */}
      <form onSubmit={createCategory} className="rounded-2xl border border-[#edd1b6] bg-white p-5 mb-6 space-y-4">
        <h2 className="font-bold text-[#2b170d] text-sm border-b border-[#edd1b6] pb-3">إضافة فئة جديدة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5f3b1f] mb-1.5">الاسم بالعربية</label>
            <input className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f3b1f] mb-1.5">الاسم بالإنجليزية</label>
            <input className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f3b1f] mb-1.5">Slug (URL)</label>
            <input className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f3b1f] mb-1.5">الترتيب</label>
            <input type="number" className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f3b1f] mb-1.5">الحالة</label>
            <select className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="active">نشط</option>
              <option value="hidden">مخفي</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5f3b1f] mb-1.5">الوصف بالعربية</label>
            <textarea className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm h-20" value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f3b1f] mb-1.5">الوصف بالإنجليزية</label>
            <textarea className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm h-20" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-2xl bg-[#15803d] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#166534] disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} إضافة
          </button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[#edd1b6]">
          <div className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-[#f9f5f0] px-3 py-2 text-sm text-[#5f3b1f] w-full md:w-80">
            <Search className="h-4 w-4" />
            <input className="bg-transparent outline-none flex-1" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="p-6"><Loader2 className="h-6 w-6 animate-spin text-[#15803d]" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-[#a08672]">لا توجد نتائج</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#edd1b6] bg-[#f9f5f0] text-right">
                  {['الاسم (AR)','الاسم (EN)','Slug','الترتيب','الحالة','الإجراءات'].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold text-[#5f3b1f] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edd1b6]/60">
                {pageItems.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f9f5f0]/50 transition">
                    <td className="px-5 py-3">{c.nameAr}</td>
                    <td className="px-5 py-3">{c.nameEn}</td>
                    <td className="px-5 py-3 ltr-nums">{c.slug}</td>
                    <td className="px-5 py-3">{c.sortOrder ?? 0}</td>
                    <td className="px-5 py-3">{c.status === 'active' ? 'نشط' : 'مخفي'}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => deleteCategory(c.id)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" /> حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-4 border-t border-[#edd1b6] text-xs text-[#5f3b1f]">
              <span>
                الصفحة {page} من {totalPages} — {filtered.length} عنصر
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-[#edd1b6] bg-white px-3 py-1.5 disabled:opacity-50"
                >السابق</button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-[#edd1b6] bg-white px-3 py-1.5 disabled:opacity-50"
                >التالي</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
