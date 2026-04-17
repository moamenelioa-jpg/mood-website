"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  Banknote,
  Building2,
  Copy,
  Check,
  MapPin,
  Phone,
  User,
  ShoppingBag,
} from "lucide-react";
import { Order } from "@/app/lib/types";
import { useLanguage } from "@/app/lib/language-context";

function SuccessContent() {
  const { t, formatPrice, isArabic } = useLanguage();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const isBankPayment = searchParams.get("payment") === "bank";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      fetch(`/api/orders?order=${orderNumber}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOrder(data.order);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "stripe":
      case "paymob":
        return <CreditCard className="h-5 w-5 text-[#5469d4]" />;
      case "bank_transfer":
        return <Building2 className="h-5 w-5 text-[#ca8a04]" />;
      default:
        return <Banknote className="h-5 w-5 text-[#15803d]" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "stripe":
      case "paymob":
        return t("checkout.cardPayment");
      case "bank_transfer":
        return t("checkout.bankTransfer");
      default:
        return t("checkout.cod");
    }
  };

  const getPaymentStatus = (order: Order) => {
    if (order.paymentStatus === "paid") {
      return t("success.paymentReceived");
    }
    if (order.paymentMethod === "cod") {
      return t("success.payWhenDelivered");
    }
    return t("success.awaitingPayment");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f7f4]">
        <div className="animate-pulse text-[#15803d]">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f7f4] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#15803d]/10 mb-6">
            <CheckCircle className="h-10 w-10 text-[#15803d]" />
          </div>
          <h1 className="text-3xl font-black text-[#2b170d] mb-2">
            {t("success.title")}
          </h1>
          <p className="text-[#6f4d34]">
            {t("success.description")}
          </p>
        </div>

        {/* Order Number Card */}
        {orderNumber && (
          <div className="rounded-3xl border border-[#edd1b6] bg-white p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#6f4d34] mb-1">{t("success.orderNumber")}</div>
                <div className="font-mono font-bold text-xl text-[#15803d] ltr-nums">
                  {orderNumber}
                </div>
                <div className="text-xs text-[#6f4d34] mt-1">
                  {t("success.saveOrderNumber")}
                </div>
              </div>
              <button
                onClick={copyOrderNumber}
                className="flex items-center gap-2 rounded-lg bg-[#f9f5f0] px-4 py-2.5 text-sm font-medium text-[#5f3b1f] hover:bg-[#f0e6dc] transition"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#15803d]" />
                    {t("success.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t("success.copy")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Order Details Card */}
        {order && (
          <div className="rounded-3xl border border-[#edd1b6] bg-white p-6 shadow-sm mb-6">
            {/* Payment Method */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#f9f5f0]">
              {getPaymentIcon(order.paymentMethod)}
              <div>
                <div className="font-semibold text-[#2b170d]">
                  {getPaymentLabel(order.paymentMethod)}
                </div>
                <div className="text-sm text-[#6f4d34]">
                  {getPaymentStatus(order)}
                </div>
              </div>
            </div>

            {/* Bank Transfer Instructions */}
            {isBankPayment && order.paymentMethod === "bank_transfer" && (
              <div className="mb-4 p-4 rounded-xl border-2 border-[#ca8a04]/20 bg-[#fefce8]">
                <h3 className="font-bold text-[#854d0e] mb-2">
                  {t("success.bankInstructions")}
                </h3>
                <div className="text-sm text-[#a16207] space-y-2">
                  <p>{t("success.transferTo")}</p>
                  <div className="bg-white rounded-lg p-3 font-mono text-xs ltr-nums">
                    <p><strong>{t("success.bank")}:</strong> CIB Egypt</p>
                    <p><strong>{t("success.account")}:</strong> 1234567890</p>
                    <p><strong>{t("success.accountName")}:</strong> Mood Foods</p>
                    <p><strong>{t("success.amount")}:</strong> {formatPrice(order.total)}</p>
                  </div>
                  <p className="text-xs">
                    {t("success.includeOrderNumber")}
                  </p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <h3 className="font-bold text-[#2b170d] mb-3">{t("success.orderItems")}</h3>
            <div className="space-y-3 mb-4">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg"
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[#f0e6dc]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#2b170d]">
                      {item.name}
                    </div>
                    <div className="text-sm text-[#6f4d34]">
                      {item.size} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold text-[#2b170d] ltr-nums">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-2 pt-4 border-t border-[#edd1b6]">
              <div className="flex justify-between text-sm text-[#6f4d34]">
                <span>{t("cart.subtotal")}</span>
                <span className="ltr-nums">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#6f4d34]">
                <span>{t("cart.shipping")}</span>
                <span className={order.shippingFee === 0 ? "text-[#15803d]" : "ltr-nums"}>
                  {order.shippingFee === 0 ? t("common.free") : formatPrice(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#edd1b6]">
                <span className="font-bold text-[#2b170d]">{t("cart.total")}</span>
                <span className="text-xl font-black text-[#15803d] ltr-nums">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Info */}
        {order && (
          <div className="rounded-3xl border border-[#edd1b6] bg-white p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-5 w-5 text-[#15803d]" />
              <h2 className="font-bold text-[#2b170d]">{t("success.deliveryInfo")}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-[#6f4d34] mt-0.5" />
                <div>
                  <div className="text-sm text-[#6f4d34]">{t("checkout.fullName")}</div>
                  <div className="font-medium text-[#2b170d]">{order.customerName}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-[#6f4d34] mt-0.5" />
                <div>
                  <div className="text-sm text-[#6f4d34]">{t("checkout.phone")}</div>
                  <div className="font-medium text-[#2b170d] ltr-nums">{order.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#6f4d34] mt-0.5" />
                <div>
                  <div className="text-sm text-[#6f4d34]">{t("checkout.address")}</div>
                  <div className="font-medium text-[#2b170d]">
                    {order.address}
                    {order.city && <span>، {order.city}</span>}
                    {order.governorate && <span>، {order.governorate}</span>}
                  </div>
                </div>
              </div>
              {order.notes && (
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-[#6f4d34] mt-0.5" />
                  <div>
                    <div className="text-sm text-[#6f4d34]">{t("checkout.notes")}</div>
                    <div className="font-medium text-[#2b170d]">{order.notes}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What's Next Section */}
        <div className="rounded-3xl border border-[#edd1b6] bg-white p-6 shadow-sm mb-6">
          <h2 className="font-bold text-[#2b170d] mb-4">{t("success.whatsNext")}</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15803d]/10 text-sm font-bold text-[#15803d]">
                1
              </div>
              <div>
                <div className="font-semibold text-[#2b170d]">{t("success.step1")}</div>
                <div className="text-sm text-[#6f4d34]">{t("success.step1Desc")}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15803d]/10 text-sm font-bold text-[#15803d]">
                2
              </div>
              <div>
                <div className="font-semibold text-[#2b170d]">{t("success.step2")}</div>
                <div className="text-sm text-[#6f4d34]">{t("success.step2Desc")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#15803d] px-8 py-4 font-bold text-white shadow-lg shadow-[#15803d]/25 hover:bg-[#166534] transition"
          >
            <ShoppingBag className="h-5 w-5" />
            {t("success.continueShopping")}
          </Link>
        </div>

        {/* Support Link */}
        <p className="text-center text-sm text-[#6f4d34] mt-6">
          {t("success.needHelp")}{" "}
          <a href="#contact" className="text-[#15803d] font-semibold hover:underline">
            {t("success.contactSupport")}
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f2f7f4]">
          <div className="animate-pulse text-[#15803d]">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}