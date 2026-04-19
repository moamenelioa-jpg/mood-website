"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  Filter,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Phone,
  MapPin,
  Package,
  CreditCard,
  MessageCircle,
  ExternalLink,
  ImageOff,
  ZoomIn,
  ShoppingBag,
  Clock,
  BadgeDollarSign,
  Archive,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { db } from "@/app/lib/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

// ── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: number;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  governorate?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: "cod" | "paymob" | "bank_transfer";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "pending_verification";
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  receiptImageUrl?: string;
  receiptImagePath?: string;
  receiptUploadedAt?: string;
  paymobOrderId?: string;
  paymobTransactionId?: string;
  archived?: boolean;
  statusHistory?: Array<{ status: string; changedAt: string; changedBy: string }>;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PM_LABELS: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  paymob: "بطاقة ائتمان",
  bank_transfer: "تحويل بنكي",
};

const PS_LABELS: Record<string, string> = {
  unpaid: "غير مدفوع",
  pending: "معلق",
  paid: "مدفوع",
  failed: "مرفوض",
  pending_verification: "قيد المراجعة",
};

const OS_LABELS: Record<string, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const PS_COLORS: Record<string, string> = {
  unpaid: "bg-gray-100 text-gray-600 border-gray-200",
  pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
  paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  pending_verification: "bg-orange-50 text-orange-800 border-orange-200",
};

const OS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-50 text-blue-800 border-blue-200",
  processing: "bg-indigo-50 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-50 text-purple-800 border-purple-200",
  delivered: "bg-emerald-50 text-emerald-800 border-emerald-200",
  completed: "bg-teal-50 text-teal-800 border-teal-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered", "completed"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return "—";
  try {
    return ts.toDate().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function buildWhatsApp(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("20") ? digits : `20${digits.replace(/^0/, "")}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function getWhatsAppMessages(order: Order) {
  return {
    approved: `مرحباً ${order.customerName} 😊\nتم قبول دفعتك بنجاح لطلب رقم ${order.orderNumber} ✅\nجاري تجهيز طلبك وسنعلمك عند الشحن.\nشكراً لثقتك في Mood Foods 🌿`,
    rejected: `مرحباً ${order.customerName}\nعذراً، تم رفض إيصال التحويل لطلبك رقم ${order.orderNumber} ❌\nيرجى رفع صورة إيصال صالحة للمتابعة.\nللمساعدة تواصل معنا عبر الواتساب 🙏`,
    status: `مرحباً ${order.customerName} 😊\nتم تحديث حالة طلبك رقم ${order.orderNumber}\nالحالة الجديدة: ${OS_LABELS[order.orderStatus] ?? order.orderStatus} 📦\nشكراً لثقتك في Mood Foods 🌿`,
  };
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-[#edd1b6] bg-white p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-[#a08672] font-medium">{label}</span>
      </div>
      <p className="text-2xl font-black text-[#2b170d]">{value}</p>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Receipt" className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" />
      </div>
    </div>
  );
}

// ── Receipt Image with loading + error states ─────────────────────────────────

function ReceiptImage({ url, onZoom }: { url: string; onZoom: () => void }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#edd1b6] bg-[#f9f5f0] min-h-32">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#a08672]" />
        </div>
      )}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-[#a08672]">
          <ImageOff className="h-8 w-8" />
          <p>تعذّر تحميل صورة الإيصال</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#15803d] underline hover:no-underline"
          >
            <ExternalLink className="h-3 w-3" />
            فتح الرابط مباشرة
          </a>
        </div>
      )}
      {/* Always render img; hide until loaded or on error */}
      <img
        src={url}
        alt="إيصال التحويل"
        className={`w-full max-h-64 object-contain transition-opacity duration-300 ${status === "ok" ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setStatus("ok")}
        onError={() => {
          console.error("[ReceiptImage] Failed to load:", url);
          setStatus("error");
        }}
      />
      {status === "ok" && (
        <>
          <button
            onClick={onZoom}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-black/80 transition"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            تكبير
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-black/80 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            فتح
          </a>
        </>
      )}
    </div>
  );
}

// ── Order Details Modal ───────────────────────────────────────────────────────

function OrderModal({
  order,
  onClose,
  onApprove,
  onReject,
  onStatusChange,
  onArchive,
  onDelete,
  actionLoading,
}: {
  order: Order;
  onClose: () => void;
  onApprove: (o: Order) => Promise<void>;
  onReject: (o: Order) => Promise<void>;
  onStatusChange: (o: Order, s: string) => Promise<void>;
  onArchive: (o: Order, archived: boolean) => Promise<void>;
  onDelete: (o: Order) => void;
  actionLoading: string | null;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const msgs = getWhatsAppMessages(order);
  const isActing = (key: string) => actionLoading === key;
  const currentStepIndex = STATUS_FLOW.indexOf(order.orderStatus as typeof STATUS_FLOW[number]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl overflow-y-auto" dir="rtl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edd1b6] bg-white px-6 py-4">
          <div>
            <p className="font-mono text-xs text-[#a08672]">رقم الطلب</p>
            <h2 className="text-lg font-black text-[#2b170d]">{order.orderNumber}</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge label={OS_LABELS[order.orderStatus] ?? order.orderStatus} colorClass={OS_COLORS[order.orderStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"} />
            <Badge label={PS_LABELS[order.paymentStatus] ?? order.paymentStatus} colorClass={PS_COLORS[order.paymentStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"} />
            <button onClick={onClose} className="rounded-xl border border-[#edd1b6] p-2 text-[#5f3b1f] hover:bg-[#f9f5f0] transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {/* Customer Info */}
          <section>
            <h3 className="mb-3 text-xs font-bold text-[#5f3b1f] uppercase tracking-wider">معلومات العميل</h3>
            <div className="rounded-2xl border border-[#edd1b6] bg-[#f9f5f0] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#15803d]/10 text-[#15803d] font-bold text-sm">
                  {order.customerName.charAt(0)}
                </div>
                <span className="font-semibold text-[#2b170d]">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5f3b1f]">
                <Phone className="h-4 w-4 text-[#a08672] flex-shrink-0" />
                <a href={`tel:${order.phone}`} className="hover:text-[#15803d] transition font-mono">{order.phone}</a>
              </div>
              {order.email && <p className="text-sm text-[#5f3b1f]">📧 {order.email}</p>}
              <div className="flex items-start gap-2 text-sm text-[#5f3b1f]">
                <MapPin className="h-4 w-4 text-[#a08672] flex-shrink-0 mt-0.5" />
                <span>{order.address}، {order.city}{order.governorate ? `، ${order.governorate}` : ""}</span>
              </div>
              {order.notes && (
                <p className="rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  📝 ملاحظات: {order.notes}
                </p>
              )}
              <p className="text-xs text-[#a08672]">تاريخ الطلب: {formatDate(order.createdAt)}</p>
            </div>
          </section>

          {/* Order Items */}
          <section>
            <h3 className="mb-3 text-xs font-bold text-[#5f3b1f] uppercase tracking-wider">
              المنتجات ({order.items?.length ?? 0})
            </h3>
            <div className="rounded-2xl border border-[#edd1b6] overflow-hidden">
              {(order.items ?? []).map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[#edd1b6]/60 last:border-0 hover:bg-[#f9f5f0]/50 transition">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-[#edd1b6] bg-[#f9f5f0]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={56} height={56} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-[#a08672]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#2b170d] truncate">{item.name}</p>
                    <p className="text-xs text-[#a08672]">الحجم: {item.size} · الكمية: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-[#2b170d]">{(item.price * item.quantity).toLocaleString()} ج.م</p>
                    <p className="text-xs text-[#a08672]">{item.price.toLocaleString()} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section>
            <h3 className="mb-3 text-xs font-bold text-[#5f3b1f] uppercase tracking-wider">ملخص السعر</h3>
            <div className="rounded-2xl border border-[#edd1b6] bg-white p-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#5f3b1f]">
                <span>المجموع الفرعي</span>
                <span>{(order.subtotal ?? order.total).toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-[#5f3b1f]">
                <span>رسوم الشحن</span>
                <span>{(order.shippingFee ?? 0).toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#edd1b6] pt-2 mt-1">
                <span className="font-bold text-[#2b170d] text-base">الإجمالي</span>
                <span className="font-black text-[#15803d] text-lg">{order.total?.toLocaleString()} ج.م</span>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h3 className="mb-3 text-xs font-bold text-[#5f3b1f] uppercase tracking-wider">الدفع</h3>
            <div className="rounded-2xl border border-[#edd1b6] p-4 space-y-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[#a08672]" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#2b170d]">{PM_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
                  <Badge label={PS_LABELS[order.paymentStatus] ?? order.paymentStatus} colorClass={PS_COLORS[order.paymentStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"} />
                </div>
              </div>

              {order.paymobOrderId && (
                <p className="text-xs text-[#a08672] font-mono">Paymob Order: {order.paymobOrderId}</p>
              )}
              {order.paymobTransactionId && (
                <p className="text-xs text-[#a08672] font-mono">Paymob TX: {order.paymobTransactionId}</p>
              )}

              {/* Bank Transfer Receipt */}
              {order.paymentMethod === "bank_transfer" && (
                <div className="space-y-3">
                  {order.receiptImageUrl ? (
                    <>
                      {order.receiptUploadedAt && (
                        <p className="text-xs text-[#a08672]">
                          رُفع الإيصال في: {new Date(order.receiptUploadedAt).toLocaleDateString("ar-EG")}
                        </p>
                      )}
                      <ReceiptImage
                        url={order.receiptImageUrl!}
                        onZoom={() => setLightbox(order.receiptImageUrl!)}
                      />

                      {order.paymentStatus === "pending_verification" && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => onApprove(order)}
                            disabled={!!actionLoading}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                          >
                            {isActing(`approve-${order.id}`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            قبول الدفع
                          </button>
                          <button
                            onClick={() => onReject(order)}
                            disabled={!!actionLoading}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {isActing(`reject-${order.id}`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            رفض الدفع
                          </button>
                        </div>
                      )}
                      {order.paymentStatus === "paid" && (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />تم قبول الدفع
                        </div>
                      )}
                      {order.paymentStatus === "failed" && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
                          <XCircle className="h-4 w-4" />تم رفض الدفع
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#edd1b6] bg-[#f9f5f0] px-4 py-5 text-sm text-[#a08672]">
                      <ImageOff className="h-5 w-5 flex-shrink-0" />
                      لم يتم رفع الإيصال بعد
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Order Status Stepper */}
          {!["cancelled", "completed"].includes(order.orderStatus) && (
            <section>
              <h3 className="mb-3 text-xs font-bold text-[#5f3b1f] uppercase tracking-wider">حالة الطلب</h3>
              <div className="rounded-2xl border border-[#edd1b6] p-4 space-y-4">
                <div className="flex items-start gap-1 overflow-x-auto pb-2">
                  {STATUS_FLOW.map((step, idx) => {
                    const done = idx <= currentStepIndex;
                    const active = idx === currentStepIndex;
                    return (
                      <div key={step} className="flex items-center gap-1 flex-shrink-0">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                            active ? "border-[#15803d] bg-[#15803d] text-white" :
                            done ? "border-[#15803d] bg-[#15803d]/10 text-[#15803d]" :
                            "border-[#edd1b6] bg-white text-[#a08672]"
                          }`}>
                            {done && !active ? "✓" : idx + 1}
                          </div>
                          <span className={`text-xs whitespace-nowrap ${active ? "font-bold text-[#15803d]" : done ? "text-[#5f3b1f]" : "text-[#a08672]"}`}>
                            {OS_LABELS[step]}
                          </span>
                        </div>
                        {idx < STATUS_FLOW.length - 1 && (
                          <div className={`h-0.5 w-5 flex-shrink-0 mb-4 rounded ${idx < currentStepIndex ? "bg-[#15803d]" : "bg-[#edd1b6]"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {currentStepIndex < STATUS_FLOW.length - 1 && (
                  <button
                    onClick={() => onStatusChange(order, STATUS_FLOW[currentStepIndex + 1])}
                    disabled={!!actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#166534] transition disabled:opacity-50"
                  >
                    {isActing(`status-${order.id}`) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4 rotate-180" />
                    )}
                    تقدم إلى: {OS_LABELS[STATUS_FLOW[currentStepIndex + 1]]}
                  </button>
                )}

                {!["delivered", "cancelled"].includes(order.orderStatus) && (
                  <button
                    onClick={() => onStatusChange(order, "cancelled")}
                    disabled={!!actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    إلغاء الطلب
                  </button>
                )}

                {order.orderStatus === "delivered" && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />تم تسليم الطلب — يمكنك تحديده كـ "مكتمل"
                  </div>
                )}
                {/* completed status is not part of the current workflow */}
              </div>
            </section>
          )}

          {order.orderStatus === "cancelled" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />هذا الطلب ملغى
            </div>
          )}

          {/* completed status is not used */}

          {/* Status History */}
          {(order.statusHistory?.length ?? 0) > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-bold text-[#5f3b1f] uppercase tracking-wider flex items-center gap-2">
                <History className="h-3.5 w-3.5" />سجل الحالات
              </h3>
              <div className="rounded-2xl border border-[#edd1b6] divide-y divide-[#edd1b6]/60 overflow-hidden">
                {[...(order.statusHistory ?? [])].reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[#f9f5f0]/50">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${OS_COLORS[h.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {OS_LABELS[h.status] ?? h.status}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-[#a08672]">{h.changedBy}</p>
                      <p className="text-xs text-[#a08672]">{new Date(h.changedAt).toLocaleString("ar-EG")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Archive & Delete */}
          <section>
            <h3 className="mb-3 text-xs font-bold text-[#5f3b1f] uppercase tracking-wider">إجراءات أخرى</h3>
            <div className="space-y-2">
              {!order.archived ? (
                <button
                  onClick={() => onArchive(order, true)}
                  disabled={!!actionLoading}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-sm font-medium text-[#5f3b1f] hover:bg-[#f9f5f0] transition disabled:opacity-50"
                >
                  {actionLoading === `archive-${order.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4 text-[#a08672]" />}
                  أرشفة الطلب
                </button>
              ) : (
                <button
                  onClick={() => onArchive(order, false)}
                  disabled={!!actionLoading}
                  className="flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                >
                  {actionLoading === `archive-${order.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                  إلغاء الأرشفة
                </button>
              )}
              {(["completed", "cancelled", "delivered"].includes(order.orderStatus) || order.archived) && (
                <button
                  onClick={() => onDelete(order)}
                  className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف الطلب نهائياً
                </button>
              )}
            </div>
          </section>

          {/* WhatsApp Notifications */}
          <section>
            <h3 className="mb-3 text-xs font-bold text-[#5f3b1f] uppercase tracking-wider">إشعارات واتساب</h3>
            <div className="space-y-2">
              <a
                href={buildWhatsApp(order.phone, msgs.status)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-sm font-medium text-[#2b170d] hover:bg-[#f0fdf4] hover:border-green-300 transition group"
              >
                <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="flex-1">إرسال حالة الطلب</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#a08672] group-hover:text-green-600 transition" />
              </a>
              {order.paymentMethod === "bank_transfer" && (
                <>
                  <a
                    href={buildWhatsApp(order.phone, msgs.approved)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-sm font-medium text-[#2b170d] hover:bg-[#f0fdf4] hover:border-green-300 transition group"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="flex-1">إشعار قبول الدفع</span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#a08672] group-hover:text-green-600 transition" />
                  </a>
                  <a
                    href={buildWhatsApp(order.phone, msgs.rejected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-sm font-medium text-[#2b170d] hover:bg-red-50 hover:border-red-200 transition group"
                  >
                    <MessageCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="flex-1">إشعار رفض الإيصال</span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#a08672] group-hover:text-red-500 transition" />
                  </a>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { getToken, authState } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [pmFilter, setPmFilter] = useState("all");
  const [psFilter, setPsFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Real-time Firestore listener ──────────────────────────────────────────
  // IMPORTANT: only subscribe AFTER the admin token with the `admin` custom
  // claim is ready. Starting onSnapshot before auth resolves causes an
  // immediate `permission-denied` from Firestore security rules.
  useEffect(() => {
    if (authState !== "authenticated") {
      // Still loading or not signed in — don't attempt the query yet.
      if (authState === "loading" || authState === "idle") setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
        setOrders(data);
        setLoading(false);
        setError(null);
        setSelectedOrder((prev) => {
          if (!prev) return null;
          return data.find((o) => o.id === prev.id) ?? prev;
        });
      },
      (err: Error & { code?: string }) => {
        // Log the exact Firebase error code so it's easy to debug in DevTools
        console.error("[AdminOrders][onSnapshot] code:", err.code, "message:", err.message, err);
        if (err.code === "permission-denied") {
          setError(
            "خطأ في الصلاحيات (permission-denied): تأكد من أن الحساب لديه صلاحية admin. " +
            "قد تحتاج إلى تسجيل الخروج والدخول مجدداً لتحديث التوكن."
          );
        } else if (err.code === "unavailable") {
          setError("لا يوجد اتصال بـ Firestore. تحقق من الاتصال بالإنترنت.");
        } else {
          setError(`خطأ في تحميل الطلبات [${err.code ?? "unknown"}]: ${err.message}`);
        }
        setLoading(false);
      }
    );
    return () => unsub();
  }, [authState]);  // re-runs only when auth state changes

  // ── Mutations ─────────────────────────────────────────────────────────────
  const callAPI = useCallback(async (orderNumber: string, body: Record<string, string>) => {
    const token = await getToken();
    if (!token) throw new Error("No auth token");
    const res = await fetch(`/api/admin/orders/${orderNumber}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error ?? "Update failed");
    return data;
  }, [getToken]);

  const handleApprove = useCallback(async (order: Order) => {
    setActionLoading(`approve-${order.id}`);
    try {
      await callAPI(order.orderNumber, { paymentStatus: "paid", orderStatus: "confirmed" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally { setActionLoading(null); }
  }, [callAPI]);

  const handleReject = useCallback(async (order: Order) => {
    setActionLoading(`reject-${order.id}`);
    try {
      await callAPI(order.orderNumber, { paymentStatus: "failed" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally { setActionLoading(null); }
  }, [callAPI]);

  const handleStatusChange = useCallback(async (order: Order, newStatus: string) => {
    setActionLoading(`status-${order.id}`);
    try {
      await callAPI(order.orderNumber, { orderStatus: newStatus });
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally { setActionLoading(null); }
  }, [callAPI]);

  const handleArchive = useCallback(async (order: Order, archived: boolean) => {
    setActionLoading(`archive-${order.id}`);
    try {
      await callAPI(order.orderNumber, { archived: String(archived) });
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally { setActionLoading(null); }
  }, [callAPI]);

  const handleDelete = useCallback(async (order: Order) => {
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      const res = await fetch(`/api/admin/orders/${order.orderNumber}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Delete failed");
      setDeleteTarget(null);
      setSelectedOrder(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally { setDeleting(false); }
  }, [getToken]);

  // ── Filtering + Sorting ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = orders.filter((o) => {
      // Hide archived orders by default unless explicitly shown
      if (!showArchived && o.archived) return false;
      if (showArchived && osFilter === "all" && !o.archived) return false;

      if (search) {
        const s = search.toLowerCase();
        if (
          !o.orderNumber.toLowerCase().includes(s) &&
          !o.customerName.toLowerCase().includes(s) &&
          !o.phone.includes(s)
        ) return false;
      }
      if (pmFilter !== "all" && o.paymentMethod !== pmFilter) return false;
      if (psFilter !== "all" && o.paymentStatus !== psFilter) return false;
      if (osFilter !== "all" && o.orderStatus !== osFilter) return false;
      return true;
    });

    // Firestore returns desc by default; reverse for asc
    if (sortDir === "asc") result = [...result].reverse();
    return result;
  }, [orders, search, pmFilter, psFilter, osFilter, sortDir, showArchived]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.orderStatus === "pending").length,
    pendingVerification: orders.filter((o) => o.paymentStatus === "pending_verification").length,
    revenue: orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + (o.total ?? 0), 0),
  }), [orders]);

  const hasFilters = pmFilter !== "all" || psFilter !== "all" || osFilter !== "all" || !!search;

  return (
    <div className="p-6 max-w-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#2b170d]">إدارة الطلبات</h1>
          <p className="text-sm text-[#a08672] mt-1">
            {loading ? "جاري التحميل..." : `${filtered.length} طلب${hasFilters ? " (مفلتر)" : ""} من أصل ${orders.length}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          مباشر
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ShoppingBag} label="إجمالي الطلبات" value={stats.total} color="bg-blue-100 text-blue-700" />
        <StatCard icon={Clock} label="طلبات معلقة" value={stats.pending} color="bg-yellow-100 text-yellow-700" />
        <StatCard icon={AlertCircle} label="إيصالات قيد المراجعة" value={stats.pendingVerification} color="bg-orange-100 text-orange-700" />
        <StatCard icon={BadgeDollarSign} label="الإيرادات المحصلة" value={`${stats.revenue.toLocaleString()} ج.م`} color="bg-emerald-100 text-emerald-700" />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-[#a08672]" />
          <input
            type="text"
            placeholder="رقم الطلب، الاسم، أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#edd1b6] bg-white py-2.5 pr-10 pl-4 text-sm text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute top-1/2 -translate-y-1/2 left-3">
              <X className="h-4 w-4 text-[#a08672] hover:text-[#2b170d]" />
            </button>
          )}
        </div>

        {/* Sort direction */}
        <button
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm text-[#5f3b1f] hover:bg-[#f9f5f0] transition"
          title={sortDir === "desc" ? "الأحدث أولاً" : "الأقدم أولاً"}
        >
          {sortDir === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {sortDir === "desc" ? "الأحدث" : "الأقدم"}
        </button>

        <div className="relative">
          <Filter className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-[#a08672] pointer-events-none" />
          <select value={pmFilter} onChange={(e) => setPmFilter(e.target.value)} className="appearance-none rounded-xl border border-[#edd1b6] bg-white py-2.5 pr-10 pl-4 text-sm text-[#2b170d] focus:border-[#15803d] focus:outline-none cursor-pointer">
            <option value="all">جميع طرق الدفع</option>
            <option value="cod">الدفع عند الاستلام</option>
            <option value="paymob">بطاقة ائتمان</option>
            <option value="bank_transfer">تحويل بنكي</option>
          </select>
        </div>

        <select value={psFilter} onChange={(e) => setPsFilter(e.target.value)} className="appearance-none rounded-xl border border-[#edd1b6] bg-white py-2.5 px-4 text-sm text-[#2b170d] focus:border-[#15803d] focus:outline-none cursor-pointer">
          <option value="all">جميع حالات الدفع</option>
          <option value="unpaid">غير مدفوع</option>
          <option value="pending">معلق</option>
          <option value="paid">مدفوع</option>
          <option value="failed">مرفوض</option>
          <option value="pending_verification">قيد المراجعة</option>
        </select>

        <select value={osFilter} onChange={(e) => setOsFilter(e.target.value)} className="appearance-none rounded-xl border border-[#edd1b6] bg-white py-2.5 px-4 text-sm text-[#2b170d] focus:border-[#15803d] focus:outline-none cursor-pointer">
          <option value="all">جميع حالات الطلب</option>
          <option value="pending">معلق</option>
          <option value="confirmed">مؤكد</option>
          <option value="processing">قيد المعالجة</option>
          <option value="shipped">تم الشحن</option>
          <option value="delivered">تم التسليم</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغى</option>
        </select>

        {/* Archived toggle */}
        <button
          onClick={() => setShowArchived((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            showArchived
              ? "border-[#5f3b1f] bg-[#2b170d] text-white"
              : "border-[#edd1b6] bg-white text-[#a08672] hover:text-[#5f3b1f] hover:bg-[#f9f5f0]"
          }`}
        >
          <Archive className="h-4 w-4" />
          {showArchived ? "عرض المؤرشف" : "الأرشيف"}
        </button>

        {hasFilters && (
          <button onClick={() => { setSearch(""); setPmFilter("all"); setPsFilter("all"); setOsFilter("all"); }} className="flex items-center gap-1.5 rounded-xl border border-[#edd1b6] bg-white px-3 py-2.5 text-sm text-[#a08672] hover:text-[#5f3b1f] hover:bg-[#f9f5f0] transition">
            <X className="h-3.5 w-3.5" />إزالة الفلاتر
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
            <p className="text-sm text-[#a08672]">جاري تحميل الطلبات...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <ShoppingBag className="h-12 w-12 text-[#edd1b6]" />
            <p className="text-[#a08672] font-medium">لا توجد طلبات</p>
            {hasFilters && (
              <button onClick={() => { setSearch(""); setPmFilter("all"); setPsFilter("all"); setOsFilter("all"); }} className="text-sm text-[#15803d] underline hover:no-underline">
                إزالة الفلاتر
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="border-b border-[#edd1b6] bg-[#f9f5f0] text-right">
                  <th className="px-5 py-3.5 font-semibold text-[#5f3b1f] text-xs uppercase tracking-wide">رقم الطلب</th>
                  <th className="px-5 py-3.5 font-semibold text-[#5f3b1f] text-xs uppercase tracking-wide">العميل</th>
                  <th className="px-5 py-3.5 font-semibold text-[#5f3b1f] text-xs uppercase tracking-wide">المدينة</th>
                  <th className="px-5 py-3.5 font-semibold text-[#5f3b1f] text-xs uppercase tracking-wide">المبلغ</th>
                  <th className="px-5 py-3.5 font-semibold text-[#5f3b1f] text-xs uppercase tracking-wide">طريقة الدفع</th>
                  <th className="px-5 py-3.5 font-semibold text-[#5f3b1f] text-xs uppercase tracking-wide">حالة الدفع</th>
                  <th className="px-5 py-3.5 font-semibold text-[#5f3b1f] text-xs uppercase tracking-wide">حالة الطلب</th>
                  <th className="px-5 py-3.5 font-semibold text-[#5f3b1f] text-xs uppercase tracking-wide">التاريخ</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edd1b6]/60">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-[#f9f5f0]/60 transition cursor-pointer group ${order.archived ? "opacity-60" : ""}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-[#2b170d]">{order.orderNumber}</span>
                      {order.archived && (
                        <span className="mr-1.5 inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">مؤرشف</span>
                      )}
                      {order.paymentMethod === "bank_transfer" && order.paymentStatus === "pending_verification" && (
                        <span className="mr-1.5 inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800">يحتاج مراجعة</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#2b170d]">{order.customerName}</p>
                      <p className="text-xs text-[#a08672] font-mono">{order.phone}</p>
                      {order.email && <p className="text-xs text-[#a08672]">{order.email}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-[#5f3b1f] text-sm">{order.city}</td>
                    <td className="px-5 py-3.5 font-bold text-[#2b170d]">{order.total?.toLocaleString()} ج.م</td>
                    <td className="px-5 py-3.5 text-xs text-[#5f3b1f]">{PM_LABELS[order.paymentMethod] ?? order.paymentMethod}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={PS_LABELS[order.paymentStatus] ?? order.paymentStatus} colorClass={PS_COLORS[order.paymentStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={OS_LABELS[order.orderStatus] ?? order.orderStatus} colorClass={OS_COLORS[order.orderStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#a08672] whitespace-nowrap">
                      {order.createdAt ? formatDate(order.createdAt) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="flex items-center gap-1 rounded-lg border border-[#edd1b6] bg-white px-2.5 py-1.5 text-xs font-medium text-[#5f3b1f] hover:bg-[#f9f5f0]"
                        >
                          عرض <ChevronRight className="h-3 w-3 rotate-180" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleArchive(order, !order.archived); }}
                          title={order.archived ? "إلغاء الأرشفة" : "أرشفة"}
                          className="rounded-lg border border-[#edd1b6] bg-white p-1.5 text-[#a08672] hover:bg-[#f9f5f0] hover:text-[#5f3b1f]"
                        >
                          <Archive className="h-3.5 w-3.5" />
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

      {/* Order Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onStatusChange={handleStatusChange}
          onArchive={handleArchive}
          onDelete={(o) => setDeleteTarget(o)}
          actionLoading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" dir="rtl">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#edd1b6]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-black text-[#2b170d] text-lg mb-1">حذف الطلب نهائياً</h3>
            <p className="text-sm text-[#5f3b1f] mb-1">
              طلب رقم: <span className="font-mono font-bold">{deleteTarget.orderNumber}</span>
            </p>
            <p className="text-sm text-[#5f3b1f] mb-2">
              العميل: <strong>{deleteTarget.customerName}</strong>
            </p>
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-5 text-sm text-red-700">
              هذا الإجراء لا يمكن التراجع عنه. سيُحذف الطلب من Firestore نهائياً.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm font-bold text-[#5f3b1f] hover:bg-[#f9f5f0] transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-white px-4 py-2.5 text-sm font-bold hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
