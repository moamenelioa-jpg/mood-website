"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  CheckCircle,
  Clock,
  Receipt,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Package,
  FileText,
  TrendingUp,
  Users,
  Eye,
  PlusCircle,
} from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

// ─── Types ───────────────────────────────────────────────────

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  pendingVerification: number;
  totalRevenue: number;
  totalProducts: number;
  activeProducts: number;
  totalArticles: number;
  publishedArticles: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

interface RecentProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  mainImage: string;
  availability: string;
  archived: boolean;
}

interface RecentArticle {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  coverImage: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function statusBg(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-gray-100 text-gray-600",
    failed: "bg-red-100 text-red-800",
    pending_verification: "bg-orange-100 text-orange-800",
    published: "bg-green-100 text-green-800",
    draft: "bg-gray-100 text-gray-600",
    archived: "bg-red-100 text-red-700",
    in_stock: "bg-green-100 text-green-800",
    out_of_stock: "bg-red-100 text-red-800",
    limited: "bg-yellow-100 text-yellow-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

const LABELS: Record<string, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغى",
  paid: "مدفوع",
  unpaid: "غير مدفوع",
  failed: "فشل",
  pending_verification: "قيد المراجعة",
  cod: "دفع عند الاستلام",
  paymob: "بطاقة ائتمان",
  bank_transfer: "تحويل بنكي",
  published: "منشور",
  draft: "مسودة",
  archived: "مؤرشف",
  in_stock: "متوفر",
  out_of_stock: "نفد",
  limited: "كمية محدودة",
};

// ─── Dashboard page ──────────────────────────────────────────

export default function AdminDashboard() {
  const { getToken, session } = useAdminAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const headers = { Authorization: `Bearer ${token}` };

      // Parallel fetch
      const [ordersRes, productsRes, articlesRes] = await Promise.all([
        fetch("/api/admin/orders?limit=200", { headers }),
        fetch("/api/admin/products?archived=true", { headers }),
        fetch("/api/admin/articles", { headers }),
      ]);

      const [ordersData, productsData, articlesData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        articlesRes.json(),
      ]);

      // Orders
      const orders: RecentOrder[] = ordersData.success ? (ordersData.orders ?? []) : [];
      const s: DashboardStats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.orderStatus === "pending").length,
        completedOrders: orders.filter((o) =>
          ["delivered", "completed"].includes(o.orderStatus)
        ).length,
        pendingVerification: orders.filter(
          (o) => o.paymentStatus === "pending_verification"
        ).length,
        totalRevenue: orders
          .filter((o) => o.paymentStatus === "paid")
          .reduce((sum, o) => sum + (o.total || 0), 0),
        totalProducts: 0,
        activeProducts: 0,
        totalArticles: 0,
        publishedArticles: 0,
      };
      setRecentOrders(orders.slice(0, 8));

      // Products
      if (productsData.success) {
        const prods: RecentProduct[] = productsData.products ?? [];
        s.totalProducts = prods.length;
        s.activeProducts = prods.filter((p) => !p.archived).length;
        setRecentProducts(prods.filter((p) => !p.archived).slice(0, 6));
      }

      // Articles
      if (articlesData.success) {
        const arts: RecentArticle[] = articlesData.articles ?? [];
        s.totalArticles = arts.length;
        s.publishedArticles = arts.filter((a) => a.status === "published").length;
        setRecentArticles(arts.slice(0, 6));
      }

      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-[#2b170d]">
            {greeting}،{" "}
            <span className="text-[#15803d]">
              {session?.displayName?.split(" ")[0] ?? "Admin"}
            </span>
          </h1>
          <p className="text-sm text-[#a08672] mt-1">نظرة عامة على المتجر والإحصائيات</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-white px-4 py-2 text-sm font-semibold text-[#5f3b1f] hover:bg-[#f9f5f0] transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-[#edd1b6] animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <p className="text-xs font-bold uppercase tracking-wider text-[#a08672] mb-3">الطلبات</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={ShoppingBag} label="إجمالي الطلبات" value={stats.totalOrders} color="text-blue-600" bg="bg-blue-50" link="/admin/orders" />
            <StatCard icon={Clock} label="طلبات معلقة" value={stats.pendingOrders} color="text-yellow-600" bg="bg-yellow-50" />
            <StatCard icon={CheckCircle} label="طلبات مكتملة" value={stats.completedOrders} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard icon={Receipt} label="قيد المراجعة" value={stats.pendingVerification} color="text-orange-600" bg="bg-orange-50" link="/admin/receipts" />
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-[#a08672] mb-3">المحتوى والإيرادات</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Package} label="المنتجات النشطة" value={stats.activeProducts} color="text-violet-600" bg="bg-violet-50" link="/admin/products" />
            <StatCard icon={Package} label="إجمالي المنتجات" value={stats.totalProducts} color="text-purple-600" bg="bg-purple-50" link="/admin/products" />
            <StatCard icon={FileText} label="مقالات منشورة" value={stats.publishedArticles} color="text-teal-600" bg="bg-teal-50" link="/admin/articles" />
            <StatCard icon={TrendingUp} label="الإيرادات المؤكدة" value={`${stats.totalRevenue.toLocaleString("ar-EG")} ج.م`} color="text-green-600" bg="bg-green-50" />
          </div>
        </>
      ) : null}

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <QuickAction href="/admin/orders" icon={ShoppingBag} label="الطلبات" />
        <QuickAction href="/admin/products/new" icon={PlusCircle} label="منتج جديد" />
        <QuickAction href="/admin/articles/new" icon={FileText} label="مقال جديد" />
        <QuickAction href="/admin/users" icon={Users} label="المشرفون" />
      </div>

      {/* Recent sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent orders (full width) */}
        <div className="xl:col-span-3 rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
          <SectionHeader title="آخر الطلبات" href="/admin/orders" />
          {loading ? (
            <LoadingRows />
          ) : recentOrders.length === 0 ? (
            <EmptyState label="لا توجد طلبات بعد" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#edd1b6] bg-[#f9f5f0] text-right">
                    {["رقم الطلب", "العميل", "المبلغ", "طريقة الدفع", "الطلب", "الدفع"].map((h) => (
                      <th key={h} className="px-5 py-3 font-semibold text-[#5f3b1f] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edd1b6]/60">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#f9f5f0]/50 transition">
                      <td className="px-5 py-3 font-mono text-xs text-[#2b170d] whitespace-nowrap">
                        <Link href="/admin/orders" className="hover:text-[#15803d] hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[#2b170d] whitespace-nowrap">{order.customerName}</td>
                      <td className="px-5 py-3 font-semibold text-[#2b170d] whitespace-nowrap">{order.total} ج.م</td>
                      <td className="px-5 py-3 text-[#5f3b1f] whitespace-nowrap">{LABELS[order.paymentMethod] ?? order.paymentMethod}</td>
                      <td className="px-5 py-3"><Badge status={order.orderStatus} /></td>
                      <td className="px-5 py-3"><Badge status={order.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent products */}
        <div className="xl:col-span-1 rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
          <SectionHeader title="أحدث المنتجات" href="/admin/products" />
          {loading ? (
            <LoadingRows count={4} />
          ) : recentProducts.length === 0 ? (
            <EmptyState label="لا توجد منتجات — قم بالبذر أولاً" />
          ) : (
            <ul className="divide-y divide-[#edd1b6]/60">
              {recentProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f9f5f0]/50 transition">
                  <div className="h-10 w-10 rounded-lg bg-[#f9f5f0] flex-shrink-0 overflow-hidden">
                    {p.mainImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.mainImage} alt={p.nameEn} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 m-2.5 text-[#a08672]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2b170d] truncate">{p.nameAr}</p>
                    <p className="text-xs text-[#a08672]">{p.price} ج.م</p>
                  </div>
                  <Badge status={p.availability} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent articles */}
        <div className="xl:col-span-2 rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
          <SectionHeader title="أحدث المقالات" href="/admin/articles" />
          {loading ? (
            <LoadingRows count={4} />
          ) : recentArticles.length === 0 ? (
            <EmptyState label="لا توجد مقالات — قم بالبذر أولاً" />
          ) : (
            <ul className="divide-y divide-[#edd1b6]/60">
              {recentArticles.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f9f5f0]/50 transition">
                  <div className="h-10 w-10 rounded-lg bg-[#f9f5f0] flex-shrink-0 overflow-hidden">
                    {a.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.coverImage} alt={a.titleEn} className="h-full w-full object-cover" />
                    ) : (
                      <FileText className="h-5 w-5 m-2.5 text-[#a08672]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2b170d] truncate">{a.titleAr}</p>
                    <p className="text-xs text-[#a08672] truncate">{a.titleEn}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={a.status} />
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="p-1.5 rounded-lg text-[#a08672] hover:text-[#15803d] hover:bg-[#f0faf4] transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  link,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  link?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-[#edd1b6] bg-white p-5 flex items-start gap-4 hover:shadow-md transition h-full">
      <div className={`rounded-xl ${bg} p-3 flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#a08672] font-medium leading-tight">{label}</p>
        <p className="text-xl font-black text-[#2b170d] mt-1 truncate">{value}</p>
      </div>
    </div>
  );
  return link ? <Link href={link} className="block">{inner}</Link> : <div>{inner}</div>;
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-[#edd1b6] bg-white px-4 py-4 hover:shadow-md hover:border-[#15803d]/40 transition text-center"
    >
      <div className="rounded-xl bg-[#f0faf4] p-3">
        <Icon className="h-5 w-5 text-[#15803d]" />
      </div>
      <span className="text-xs font-bold text-[#2b170d]">{label}</span>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#edd1b6]">
      <h2 className="font-bold text-[#2b170d] text-sm">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-[#15803d] hover:underline">
        عرض الكل
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${statusBg(status)}`}>
      {LABELS[status] ?? status}
    </span>
  );
}

function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-[#f9f5f0] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="py-10 text-center text-sm text-[#a08672]">{label}</div>;
}
