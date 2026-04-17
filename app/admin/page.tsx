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
} from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  pendingVerification: number;
  totalRevenue: number;
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
  receiptImageUrl?: string | null;
}

function statusBadge(status: string) {
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
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

const STATUS_LABELS: Record<string, string> = {
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
  cod: "الدفع عند الاستلام",
  paymob: "بطاقة ائتمان",
  bank_transfer: "تحويل بنكي",
};

export default function AdminDashboard() {
  const { getToken } = useAdminAuth();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch("/api/admin/orders?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load orders");

      const orders: RecentOrder[] = data.orders ?? [];
      setRecentOrders(orders);

      // Compute stats
      const s: OrderStats = {
        total: orders.length,
        pending: orders.filter((o) => o.orderStatus === "pending").length,
        confirmed: orders.filter((o) => o.orderStatus === "confirmed").length,
        pendingVerification: orders.filter((o) => o.paymentStatus === "pending_verification").length,
        totalRevenue: orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0),
      };
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

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#2b170d]">لوحة التحكم</h1>
          <p className="text-sm text-[#a08672] mt-1">نظرة عامة على الطلبات والإحصائيات</p>
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

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-[#edd1b6] animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={ShoppingBag}
            label="إجمالي الطلبات"
            value={stats.total}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            icon={Clock}
            label="طلبات معلقة"
            value={stats.pending}
            color="text-yellow-600"
            bg="bg-yellow-50"
          />
          <StatCard
            icon={Receipt}
            label="قيد المراجعة"
            value={stats.pendingVerification}
            color="text-orange-600"
            bg="bg-orange-50"
            link="/admin/receipts"
          />
          <StatCard
            icon={CheckCircle}
            label="الإيرادات المؤكدة"
            value={`${stats.totalRevenue.toFixed(2)} ج.م`}
            color="text-green-600"
            bg="bg-green-50"
          />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickLink href="/admin/orders" icon={ShoppingBag} label="إدارة الطلبات" desc="عرض وتعديل جميع الطلبات" />
        <QuickLink href="/admin/receipts" icon={Receipt} label="مراجعة الإيصالات" desc="إيصالات التحويل البنكي" />
        <QuickLink href="/admin/users" icon={Users2} label="إدارة المشرفين" desc="إضافة وإزالة المشرفين" />
      </div>

      {/* Recent orders table */}
      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#edd1b6]">
          <h2 className="font-bold text-[#2b170d]">آخر الطلبات</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#15803d] hover:underline"
          >
            عرض الكل
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#a08672]">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-[#a08672]">لا توجد طلبات بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#edd1b6] bg-[#f9f5f0] text-right">
                  <th className="px-6 py-3 font-semibold text-[#5f3b1f]">رقم الطلب</th>
                  <th className="px-6 py-3 font-semibold text-[#5f3b1f]">العميل</th>
                  <th className="px-6 py-3 font-semibold text-[#5f3b1f]">المبلغ</th>
                  <th className="px-6 py-3 font-semibold text-[#5f3b1f]">طريقة الدفع</th>
                  <th className="px-6 py-3 font-semibold text-[#5f3b1f]">حالة الطلب</th>
                  <th className="px-6 py-3 font-semibold text-[#5f3b1f]">حالة الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edd1b6]/60">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f9f5f0]/50 transition">
                    <td className="px-6 py-3 font-mono text-xs text-[#2b170d]">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="hover:text-[#15803d] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-[#2b170d]">{order.customerName}</td>
                    <td className="px-6 py-3 text-[#2b170d] font-semibold">{order.total} ج.م</td>
                    <td className="px-6 py-3 text-[#5f3b1f]">
                      {STATUS_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.orderStatus)}`}>
                        {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.paymentStatus)}`}>
                        {STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                      </span>
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

// ─────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────

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
  const content = (
    <div className="rounded-2xl border border-[#edd1b6] bg-white p-5 flex items-start gap-4 hover:shadow-md transition">
      <div className={`rounded-xl ${bg} p-3 flex-shrink-0`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#a08672] font-medium truncate">{label}</p>
        <p className="text-2xl font-black text-[#2b170d] mt-1">{value}</p>
      </div>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : <div>{content}</div>;
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-[#edd1b6] bg-white p-5 hover:shadow-md hover:border-[#15803d]/40 transition"
    >
      <div className="rounded-xl bg-[#f0faf4] p-3 flex-shrink-0">
        <Icon className="h-6 w-6 text-[#15803d]" />
      </div>
      <div>
        <p className="font-bold text-[#2b170d] text-sm">{label}</p>
        <p className="text-xs text-[#a08672] mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}

// placeholder to avoid import error
function Users2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
