"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  orders: number;
  total: number;
  lastOrderAt?: string;
}

export default function CustomersPage() {
  const { getToken } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.email || ""].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [search, customers]);

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
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(search)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load");
      const rows = (data.customers || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        orders: c.orders,
        total: c.total,
        lastOrderAt: c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleString('ar-EG') : undefined,
      }));
      setCustomers(rows);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-[#2b170d]">العملاء</h1>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-white px-4 py-2 text-sm font-semibold text-[#5f3b1f] hover:bg-[#f9f5f0]">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> تحديث
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-[#f9f5f0] px-3 py-2 text-sm text-[#5f3b1f] w-full md:w-96">
          <Search className="h-4 w-4" />
          <input className="bg-transparent outline-none flex-1" placeholder="بحث بالاسم أو الهاتف" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
        {loading ? (
          <div className="p-6"><Loader2 className="h-6 w-6 animate-spin text-[#15803d]" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-[#a08672]">لا توجد نتائج</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#edd1b6] bg-[#f9f5f0] text-right">
                  {['العميل','الهاتف','البريد','عدد الطلبات','إجمالي الإنفاق','آخر طلب'].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold text-[#5f3b1f] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edd1b6]/60">
                {pageItems.map((c) => (
                  <tr key={c.id} className="hover:bg-[#f9f5f0]/50 transition">
                    <td className="px-5 py-3">{c.name || '—'}</td>
                    <td className="px-5 py-3 ltr-nums">{c.phone}</td>
                    <td className="px-5 py-3">{c.email || '—'}</td>
                    <td className="px-5 py-3">{c.orders}</td>
                    <td className="px-5 py-3">{c.total} ج.م</td>
                    <td className="px-5 py-3">{c.lastOrderAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-4 border-t border-[#edd1b6] text-xs text-[#5f3b1f]">
              <span>
                الصفحة {page} من {totalPages} — {filtered.length} عميل
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
