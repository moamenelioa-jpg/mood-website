"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Upload, Trash2, Search } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface ListedFile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
  metadata?: any;
}

export default function UploadCenterPage() {
  const { getToken } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("products/");
  const [files, setFiles] = useState<ListedFile[]>([]);
  const [busy, setBusy] = useState(false);

  async function list() {
    setListing(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/storage/list", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prefix }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to list");
      setFiles((data.files || []).map((f: any) => ({ ...f, id: f.id || `${prefix}${f.name}` })));
    } catch (e: any) {
      setError(e.message || "Error");
    } finally { setListing(false); }
  }

  useEffect(() => { list(); /* eslint-disable-next-line */ }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("file", file);
      form.append("path", `${prefix}${file.name}`);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      await list();
    } catch (e: any) {
      alert(e.message || "خطأ في الرفع");
    } finally { setBusy(false); e.target.value = ""; }
  }

  async function remove(path: string) {
    if (!window.confirm("هل أنت متأكد من حذف الملف؟")) return;
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Delete failed");
      await list();
    } catch (e: any) {
      alert(e.message || "فشل الحذف");
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-[#2b170d]">مركز الرفع</h1>
        <div className="flex items-center gap-2">
          <button onClick={list} className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-white px-4 py-2 text-sm font-semibold text-[#5f3b1f] hover:bg-[#f9f5f0]">
            <RefreshCw className={`h-4 w-4 ${listing ? "animate-spin" : ""}`} /> تحديث
          </button>
          <label className="inline-flex items-center gap-2 rounded-xl bg-[#15803d] px-4 py-2 text-sm font-bold text-white hover:bg-[#166534] cursor-pointer">
            <Upload className="h-4 w-4" /> رفع ملف
            <input type="file" className="hidden" onChange={onUpload} disabled={busy} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#edd1b6] bg-white p-4 mb-4 flex items-center gap-3">
        <span className="text-sm text-[#5f3b1f]">المسار:</span>
        <input className="flex-1 rounded-xl border border-[#edd1b6] bg-[#f9f5f0] px-3 py-2 text-sm ltr-nums" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
        <button onClick={list} className="rounded-xl border border-[#edd1b6] bg-[#f9f5f0] px-4 py-2 text-sm font-semibold text-[#5f3b1f]">استعراض</button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
        {listing ? (
          <div className="p-6"><Loader2 className="h-6 w-6 animate-spin text-[#15803d]" /></div>
        ) : files.length === 0 ? (
          <div className="p-6 text-sm text-[#a08672]">لا توجد ملفات في هذا المسار</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#edd1b6] bg-[#f9f5f0] text-right">
                  {['الاسم','آخر تحديث','الإجراءات'].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold text-[#5f3b1f] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edd1b6]/60">
                {files.map((f) => (
                  <tr key={f.id} className="hover:bg-[#f9f5f0]/50 transition">
                    <td className="px-5 py-3">{f.name}</td>
                    <td className="px-5 py-3 ltr-nums">{new Date(f.updated_at || f.created_at).toLocaleString('ar-EG')}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => remove(`${prefix}${f.name}`)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" /> حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
