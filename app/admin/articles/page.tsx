"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, Eye, Edit, Trash2,
  Loader2, AlertCircle, ChevronUp, ChevronDown,
  Globe, BookOpen, Archive,
} from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface Article {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  category: string;
  author: string;
  status: "published" | "draft" | "archived";
  coverImage: string;
  publishedAt?: { seconds: number } | null;
  createdAt?: { seconds: number };
}

type SortField = "titleAr" | "createdAt" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "published" | "draft" | "archived";

const STATUS_LABELS: Record<string, string> = {
  published: "منشور",
  draft: "مسودة",
  archived: "مؤرشف",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-500",
};

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg text-sm font-semibold text-white ${type === "success" ? "bg-[#15803d]" : "bg-red-600"}`}>
      {type === "error" && <AlertCircle className="h-4 w-4" />}
      {message}
    </div>
  );
}

export default function ArticlesPage() {
  const { getToken } = useAdminAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = await getToken();
      const url = statusFilter === "all"
        ? "/api/admin/articles"
        : `/api/admin/articles?status=${statusFilter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setArticles(data.articles);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 inline" /> : <ChevronDown className="h-3.5 w-3.5 inline" />
      : <ChevronDown className="h-3.5 w-3.5 inline opacity-30" />;

  const filtered = articles
    .filter((a) => {
      const q = search.toLowerCase();
      return !q || a.titleAr.toLowerCase().includes(q) || a.titleEn.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0;
      if (sortField === "titleAr") { av = a.titleAr; bv = b.titleAr; }
      else if (sortField === "status") { av = a.status; bv = b.status; }
      else if (sortField === "createdAt") {
        av = a.createdAt?.seconds ?? 0; bv = b.createdAt?.seconds ?? 0;
      }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === "asc" ? av - (bv as number) : (bv as number) - av;
    });

  const changeStatus = async (article: Article, newStatus: "published" | "draft" | "archived") => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, status: newStatus } : a));
      showToast(
        newStatus === "published" ? "تم نشر المقال" : newStatus === "archived" ? "تم أرشفة المقال" : "تحويل إلى مسودة",
        "success"
      );
    } catch {
      showToast("فشل تحديث الحالة", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/articles/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      showToast("تم حذف المقال", "success");
    } catch {
      showToast("فشل الحذف", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const formatDate = (ts?: { seconds: number } | null) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2b170d]">المقالات</h1>
          <p className="text-sm text-[#a08672] mt-0.5">{articles.length} مقال إجمالاً</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 rounded-xl bg-[#15803d] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#166534] transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          مقال جديد
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a08672]" />
          <input
            className="w-full rounded-xl border border-[#edd1b6] bg-white pr-10 pl-4 py-2.5 text-sm placeholder:text-[#c0a898] focus:outline-none focus:border-[#15803d]"
            placeholder="ابحث عن مقال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm text-[#2b170d] focus:outline-none focus:border-[#15803d]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">جميع الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-red-600">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{loadError}</p>
            <button onClick={load} className="text-xs underline">إعادة المحاولة</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-[#a08672]">
            <BookOpen className="h-10 w-10 opacity-40" />
            <p className="font-semibold">لا توجد مقالات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f9f5f0] border-b border-[#edd1b6]">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-[#5f3b1f]">
                    <button onClick={() => toggleSort("titleAr")} className="flex items-center gap-1 hover:text-[#15803d]">
                      العنوان <SortIcon field="titleAr" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-[#5f3b1f]">الفئة</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#5f3b1f]">الكاتب</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#5f3b1f]">
                    <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-[#15803d]">
                      الحالة <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-[#5f3b1f]">
                    <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-[#15803d]">
                      التاريخ <SortIcon field="createdAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#5f3b1f]">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ece3]">
                {filtered.map((article) => (
                  <tr key={article.id} className="hover:bg-[#fdfaf7] transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {article.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={article.coverImage} alt="" className="h-10 w-14 rounded-lg object-cover flex-shrink-0 border border-[#edd1b6]" />
                        ) : (
                          <div className="h-10 w-14 rounded-lg bg-[#f5ece3] flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-[#c0a898]" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-[#2b170d] line-clamp-1">{article.titleAr}</p>
                          <p className="text-xs text-[#a08672] line-clamp-1">{article.titleEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#5f3b1f]">{article.category || "—"}</td>
                    <td className="px-4 py-4 text-[#5f3b1f]">{article.author || "—"}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[article.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[article.status] ?? article.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#a08672] text-xs whitespace-nowrap">
                      {article.status === "published" && article.publishedAt
                        ? formatDate(article.publishedAt)
                        : formatDate(article.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-center">
                        {article.status !== "published" && (
                          <button
                            title="نشر"
                            onClick={() => changeStatus(article, "published")}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition"
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                        )}
                        {article.status === "published" && (
                          <button
                            title="تحويل لمسودة"
                            onClick={() => changeStatus(article, "draft")}
                            className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {article.status !== "archived" && (
                          <button
                            title="أرشفة"
                            onClick={() => changeStatus(article, "archived")}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="p-1.5 rounded-lg text-[#5f3b1f] hover:bg-[#f5ece3] transition"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          title="حذف"
                          onClick={() => setDeleteTarget(article)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" dir="rtl">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#edd1b6]">
            <h3 className="font-black text-[#2b170d] text-lg mb-2">حذف المقال</h3>
            <p className="text-sm text-[#5f3b1f] mb-6">
              هل أنت متأكد من حذف <strong>{deleteTarget.titleAr}</strong>؟ لا يمكن التراجع.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-[#edd1b6] bg-white px-5 py-2 text-sm font-bold text-[#5f3b1f] hover:bg-[#f9f5f0]">
                إلغاء
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="flex items-center gap-2 rounded-xl bg-red-600 text-white px-5 py-2 text-sm font-bold hover:bg-red-700 disabled:opacity-60">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
