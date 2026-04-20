"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Save, Search } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface ProductRow {
  id: string;
  nameAr: string;
  nameEn: string;
  sku?: string;
  stockQuantity?: number;
  availability?: string; // in_stock | limited | out_of_stock
}

export default function InventoryPage() {
  const { getToken } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.nameAr, p.nameEn, p.sku].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [search, products]);

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
      const res = await fetch("/api/admin/products?archived=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load");
      const rows = (data.products || []).map((p: any) => ({
        id: p.id,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        sku: p.sku,
        stockQuantity: p.stockQuantity ?? 0,
        availability: p.availability || "in_stock",
      }));
      setProducts(rows);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function setRow(id: string, patch: Partial<ProductRow>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function saveRow(p: ProductRow) {
    setSavingId(p.id);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: p.stockQuantity, availability: p.availability }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save");
    } catch (e: any) {
      alert(e.message || "فشل الحفظ");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-[#2b170d]">إدارة المخزون</h1>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-white px-4 py-2 text-sm font-semibold text-[#5f3b1f] hover:bg-[#f9f5f0]">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> تحديث
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-[#f9f5f0] px-3 py-2 text-sm text-[#5f3b1f] w-full md:w-96">
          <Search className="h-4 w-4" />
          <input className="bg-transparent outline-none flex-1" placeholder="بحث بالاسم أو SKU" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
        {loading ? (
          <div className="p-6"><Loader2 className="h-6 w-6 animate-spin text-[#15803d]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#edd1b6] bg-[#f9f5f0] text-right">
                  {['المنتج','SKU','المخزون','التوفر',''].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold text-[#5f3b1f] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edd1b6]/60">
                {pageItems.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f9f5f0]/50 transition">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#2b170d]">{p.nameAr}</div>
                      <div className="text-xs text-[#a08672]">{p.nameEn}</div>
                    </td>
                    <td className="px-5 py-3">{p.sku || '—'}</td>
                    <td className="px-5 py-3">
                      <input type="number" min={0} className="w-24 rounded-xl border border-[#edd1b6] bg-white px-3 py-1.5 text-sm" value={p.stockQuantity ?? 0} onChange={(e) => setRow(p.id, { stockQuantity: Number(e.target.value) })} />
                    </td>
                    <td className="px-5 py-3">
                      <select className="w-40 rounded-xl border border-[#edd1b6] bg-white px-3 py-1.5 text-sm" value={p.availability || 'in_stock'} onChange={(e) => setRow(p.id, { availability: e.target.value })}>
                        <option value="in_stock">متوفر</option>
                        <option value="limited">كمية محدودة</option>
                        <option value="out_of_stock">نفد المخزون</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-left">
                      <button onClick={() => saveRow(p)} disabled={savingId === p.id} className="inline-flex items-center gap-2 rounded-xl bg-[#15803d] px-4 py-2 text-xs font-bold text-white hover:bg-[#166534] disabled:opacity-60">
                        {savingId === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />} حفظ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-4 border-t border-[#edd1b6] text-xs text-[#5f3b1f]">
              <span>
                الصفحة {page} من {totalPages} — {filtered.length} منتج
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
