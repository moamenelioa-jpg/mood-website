"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ImageOff,
} from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface ReceiptOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  receiptImageUrl: string | null;
  receiptImagePath: string | null;
  receiptUploadedAt: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_verification: "قيد المراجعة",
  paid: "مدفوع",
  failed: "مرفوض",
  unpaid: "غير مدفوع",
};

export default function AdminReceiptsPage() {
  const { getToken } = useAdminAuth();
  const [orders, setOrders] = useState<ReceiptOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, "loading" | "done">>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch("/api/admin/orders?paymentMethod=bank_transfer&limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load orders");

      // Only keep orders that have a receipt uploaded
      const bankOrders: ReceiptOrder[] = (data.orders ?? []).filter(
        (o: ReceiptOrder) => o.receiptImageUrl
      );
      setOrders(bankOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAction = async (orderNumber: string, action: "approve" | "reject") => {
    setActionState((prev) => ({ ...prev, [orderNumber]: "loading" }));
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`/api/admin/orders/proof?order=${orderNumber}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Action failed");

      setActionState((prev) => ({ ...prev, [orderNumber]: "done" }));
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === orderNumber
            ? {
                ...o,
                paymentStatus: action === "approve" ? "paid" : "failed",
                orderStatus: action === "approve" ? "confirmed" : o.orderStatus,
              }
            : o
        )
      );
    } catch (err) {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[orderNumber];
        return next;
      });
      alert(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  // Separate pending from resolved
  const pending = orders.filter((o) => o.paymentStatus === "pending_verification");
  const resolved = orders.filter((o) => o.paymentStatus !== "pending_verification");

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#2b170d]">إيصالات التحويل البنكي</h1>
          <p className="text-sm text-[#a08672] mt-1">مراجعة وقبول / رفض إيصالات التحويل</p>
        </div>
        <button
          onClick={fetchOrders}
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
        </div>
      ) : (
        <>
          {/* Pending verification section */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-[#5f3b1f] uppercase tracking-wide mb-4">
              قيد المراجعة ({pending.length})
            </h2>

            {pending.length === 0 ? (
              <div className="rounded-2xl border border-[#edd1b6] bg-white p-10 text-center text-[#a08672]">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400" />
                لا توجد إيصالات قيد المراجعة
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pending.map((order) => (
                  <ReceiptCard
                    key={order.orderNumber}
                    order={order}
                    actionState={actionState[order.orderNumber]}
                    onApprove={() => handleAction(order.orderNumber, "approve")}
                    onReject={() => handleAction(order.orderNumber, "reject")}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Resolved section */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#5f3b1f] uppercase tracking-wide mb-4">
                تمت المراجعة ({resolved.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {resolved.map((order) => (
                  <ReceiptCard
                    key={order.orderNumber}
                    order={order}
                    actionState={actionState[order.orderNumber]}
                    onApprove={() => handleAction(order.orderNumber, "approve")}
                    onReject={() => handleAction(order.orderNumber, "reject")}
                    readonly={order.paymentStatus !== "pending_verification"}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReceiptCard({
  order,
  actionState,
  onApprove,
  onReject,
  readonly,
}: {
  order: ReceiptOrder;
  actionState?: "loading" | "done";
  onApprove: () => void;
  onReject: () => void;
  readonly?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  const statusColors: Record<string, string> = {
    pending_verification: "bg-orange-100 text-orange-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
      {/* Order info */}
      <div className="px-5 py-4 border-b border-[#edd1b6]/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[#a08672]">{order.orderNumber}</p>
            <p className="font-bold text-[#2b170d] mt-0.5">{order.customerName}</p>
            <p className="text-sm text-[#5f3b1f]">{order.phone}</p>
          </div>
          <div className="text-left">
            <p className="font-black text-lg text-[#2b170d]">{order.total} ج.م</p>
            <span
              className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                statusColors[order.paymentStatus] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </span>
          </div>
        </div>
        {order.receiptUploadedAt && (
          <p className="text-xs text-[#a08672] mt-2">
            رُفع: {new Date(order.receiptUploadedAt).toLocaleString("ar-EG")}
          </p>
        )}
      </div>

      {/* Receipt image */}
      <div className="relative bg-[#f9f5f0] h-56 flex items-center justify-center">
        {order.receiptImageUrl && !imgError ? (
          <>
            <Image
              src={order.receiptImageUrl}
              alt={`إيصال ${order.orderNumber}`}
              fill
              className="object-contain p-2"
              onError={() => setImgError(true)}
              unoptimized
            />
            <a
              href={order.receiptImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 left-2 rounded-lg bg-white/90 p-1.5 shadow hover:bg-white transition"
              title="فتح في تبويب جديد"
            >
              <ExternalLink className="h-4 w-4 text-[#5f3b1f]" />
            </a>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#a08672]">
            <ImageOff className="h-10 w-10" />
            <p className="text-sm">لا تتوفر صورة الإيصال</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!readonly && (
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={onApprove}
            disabled={!!actionState}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#15803d] py-2.5 text-sm font-bold text-white hover:bg-[#166534] transition disabled:opacity-50"
          >
            {actionState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            قبول
          </button>
          <button
            onClick={onReject}
            disabled={!!actionState}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
          >
            {actionState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            رفض
          </button>
        </div>
      )}

      {/* Resolved state badge */}
      {readonly && (
        <div className="px-5 py-3 text-center text-sm font-semibold text-[#a08672]">
          {order.paymentStatus === "paid" ? "✓ تم القبول" : "✗ تم الرفض"}
        </div>
      )}
    </div>
  );
}
