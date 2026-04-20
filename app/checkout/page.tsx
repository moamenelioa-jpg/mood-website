"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  Zap,
  Loader2,
  ShoppingBag,
  AlertCircle,
  MapPin,
  Mail,
  Upload,
  Check,
  Copy,
} from "lucide-react";
import { PaymentMethod, CreateOrderResponse, EGYPTIAN_GOVERNORATES } from "@/app/lib/types";
import { useLanguage } from "@/app/lib/language-context";
import { useCart } from "@/app/lib/cart-context";
import { translations } from "@/app/lib/translations";

interface PublicSettings {
  bankName?: string;
  accountName?: string;
  iban?: string;
  bankActive?: boolean;
  walletNumber?: string;
  walletAccountName?: string;
  walletActive?: boolean;
  instapayIdentifier?: string;
  instapayAccountName?: string;
  instapayActive?: boolean;
  codActive?: boolean;
}

export default function CheckoutPage() {
  const { t, isArabic, formatPrice, language } = useLanguage();
  const { cart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment settings loaded from server
  const [paySettings, setPaySettings] = useState<PublicSettings>({
    codActive: true,
    bankActive: true,
    walletActive: true,
    walletNumber: "01204819854",
    instapayActive: true,
    instapayIdentifier: "01204819854",
  });

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.settings) setPaySettings(d.settings); })
      .catch(() => {/* silently use defaults */});
  }, []);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [manualMethod, setManualMethod] = useState<"bank_transfer" | "wallet" | "instapay">("bank_transfer");

  // Receipt upload state (required for manual payment methods)
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<"order" | "receipt">("order");
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const isManualPayment = ["bank_transfer", "wallet", "instapay"].includes(paymentMethod);

  // Clear receipt when switching away from a manual payment method
  useEffect(() => {
    if (!isManualPayment) {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      setReceiptFile(null);
      setReceiptPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!(file.type.startsWith("image/") || file.type === "application/pdf")) {
      setError(t("success.proofInvalidType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("success.proofTooLarge"));
      return;
    }
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setError(null);
  };

  // Flat shipping fee for all orders across Egypt
  const shippingFee = 60;
  const orderTotal = cartTotal + shippingFee;

  // Get translated governorate name
  const getGovernorateLabel = (gov: string) => {
    const govKey = gov as keyof typeof translations.governorates;
    if (translations.governorates[govKey]) {
      return translations.governorates[govKey][language];
    }
    return gov;
  };

  const hasBank = !!paySettings.bankActive;
  const hasWallet = !!paySettings.walletActive;
  const hasInstapay = !!paySettings.instapayActive;
  const hasAnyManual = hasBank || hasWallet || hasInstapay;

  // Ensure manual sub-selection is always a valid active method
  useEffect(() => {
    const firstActive = hasBank ? "bank_transfer" : hasWallet ? "wallet" : hasInstapay ? "instapay" : ("bank_transfer" as const);
    setManualMethod((prev) => {
      if (prev === "bank_transfer" && !hasBank) return firstActive;
      if (prev === "wallet" && !hasWallet) return firstActive;
      if (prev === "instapay" && !hasInstapay) return firstActive;
      return prev;
    });
    // If current paymentMethod is a disabled manual option, move to firstActive
    if (["bank_transfer", "wallet", "instapay"].includes(paymentMethod) && !({ bank_transfer: hasBank, wallet: hasWallet, instapay: hasInstapay } as any)[paymentMethod]) {
      setPaymentMethod(firstActive as PaymentMethod);
    }
  }, [hasBank, hasWallet, hasInstapay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError(t("checkout.cartEmpty"));
      return;
    }

    // Client-side validation
    if (!city.trim()) {
      setError(t("checkout.cityRequired"));
      return;
    }

    // Receipt is required for all manual payment methods
    if (isManualPayment && !receiptFile) {
      setError(t("checkout.receiptRequired"));
      return;
    }

    setLoading(true);
    setLoadingStep("order");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          email: email || undefined,
          address,
          city,
          governorate: governorate || undefined,
          notes: notes || undefined,
          paymentMethod,
          items: cart,
          shippingFee,
        }),
      });

      const data: CreateOrderResponse = await res.json();

      if (!data.success) {
        setError(data.error || t("checkout.orderFailed"));
        return;
      }

      // Clear cart on successful order
      clearCart();

      // Upload receipt for manual payment methods before redirecting
      if (isManualPayment && receiptFile && data.order?.orderNumber) {
        setLoadingStep("receipt");
        try {
          const formData = new FormData();
          formData.append("orderNumber", data.order.orderNumber);
          formData.append("receipt", receiptFile);
          await fetch("/api/orders/proof", { method: "POST", body: formData });
        } catch {
          // Non-fatal: order created, user can re-upload on success page
        }
      }

      // Redirect to payment or success page
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      setError(t("checkout.somethingWrong"));
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Arrow icon based on direction
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  // Reusable copy-to-clipboard button
  function CopyButton({ value, className }: { value: string; className?: string }) {
    const [copied, setCopied] = useState(false);
    return (
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${className || ""}`}
        aria-label={copied ? t("checkout.copied") : t("checkout.copy")}
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? t("checkout.copied") : t("checkout.copy")}
      </button>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f2f7f4] flex items-center justify-center px-4 sm:px-6 overflow-x-hidden">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-[#15803d] mb-4" />
          <h1 className="text-2xl font-black text-[#2b170d] mb-2">
            {t("cart.empty")}
          </h1>
          <p className="text-[#6f4d34] mb-6">
            {t("cart.emptyDesc")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#15803d] px-6 py-3 font-bold text-white hover:bg-[#166534] transition"
          >
            <BackArrow className="h-4 w-4 rtl-flip" />
            {t("cart.backToStore")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f7f4] overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-white/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Garad Foods Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-archivo-black uppercase tracking-[0.15em] text-[#16a34a]">
                Mood
              </span>
            </Link>
            <h1 className="text-lg font-bold text-[#2b170d]">{t("checkout.title")}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f3b1f] hover:text-[#15803d] transition mb-8"
        >
          <BackArrow className="h-4 w-4 rtl-flip" />
          {t("cart.backToStore")}
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          {/* Checkout Form */}
          <div className="order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="rounded-3xl border border-[#edd1b6] bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg font-black text-[#2b170d] mb-5">
                  {t("checkout.customerInfo")}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-[#5f3b1f] mb-2"
                    >
                      {t("checkout.fullName")} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      minLength={2}
                      placeholder={t("checkout.fullNamePlaceholder")}
                      className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-semibold text-[#5f3b1f] mb-2"
                      >
                        {t("checkout.phone")} *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder={t("checkout.phonePlaceholder")}
                        className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition"
                      />
                    </div>
                    
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-[#5f3b1f] mb-2"
                      >
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {t("checkout.email")} ({t("common.optional")})
                        </span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("checkout.emailPlaceholder")}
                        className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition"
                      />
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="pt-2 border-t border-[#edd1b6]/50">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-[#15803d]" />
                      <span className="text-sm font-bold text-[#2b170d]">{t("checkout.deliveryLocation")}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label
                          htmlFor="governorate"
                          className="block text-sm font-semibold text-[#5f3b1f] mb-2"
                        >
                          {t("checkout.governorate")} *
                        </label>
                        <select
                          id="governorate"
                          value={governorate}
                          onChange={(e) => setGovernorate(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-[#2b170d] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition"
                        >
                          <option value="">{t("checkout.governoratePlaceholder")}</option>
                          {EGYPTIAN_GOVERNORATES.map((gov) => (
                            <option key={gov} value={gov}>
                              {getGovernorateLabel(gov)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-semibold text-[#5f3b1f] mb-2"
                        >
                          {t("checkout.city")} *
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          minLength={2}
                          placeholder={t("checkout.cityPlaceholder")}
                          className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-semibold text-[#5f3b1f] mb-2"
                      >
                        {t("checkout.address")} *
                      </label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        minLength={10}
                        rows={3}
                        placeholder={t("checkout.addressPlaceholder")}
                        className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-semibold text-[#5f3b1f] mb-2"
                    >
                      {t("checkout.notes")} ({t("common.optional")})
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder={t("checkout.notesPlaceholder")}
                      className="w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-3 text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20 transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-3xl border border-[#edd1b6] bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg font-black text-[#2b170d] mb-5">
                  {t("checkout.paymentMethod")}
                </h2>

                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  {paySettings.codActive && (
                  <label
                    className={`flex items-center gap-3 sm:gap-4 rounded-xl border-2 p-3 sm:p-4 cursor-pointer transition ${
                      paymentMethod === "cod"
                        ? "border-[#15803d] bg-[#15803d]/5"
                        : "border-[#edd1b6] hover:border-[#d2a57b]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="sr-only"
                    />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        paymentMethod === "cod"
                          ? "border-[#15803d] bg-[#15803d]"
                          : "border-[#a08672]"
                      }`}
                    >
                      {paymentMethod === "cod" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <Banknote className="h-6 w-6 text-[#15803d]" />
                    <div className="flex-1">
                      <div className="font-bold text-[#2b170d]">
                        {t("checkout.cod")}
                      </div>
                      <div className="text-sm text-[#6f4d34]">
                        {t("checkout.codDesc")}
                      </div>
                    </div>
                  </label>
                  )}

                  {/* Paymob Card Payment */}
                  <label
                    className={`flex items-center gap-3 sm:gap-4 rounded-xl border-2 p-3 sm:p-4 cursor-pointer transition ${
                      paymentMethod === "paymob"
                        ? "border-[#15803d] bg-[#15803d]/5"
                        : "border-[#edd1b6] hover:border-[#d2a57b]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="paymob"
                      checked={paymentMethod === "paymob"}
                      onChange={() => setPaymentMethod("paymob")}
                      className="sr-only"
                    />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        paymentMethod === "paymob"
                          ? "border-[#15803d] bg-[#15803d]"
                          : "border-[#a08672]"
                      }`}
                    >
                      {paymentMethod === "paymob" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <CreditCard className="h-6 w-6 text-[#5469d4]" />
                    <div className="flex-1">
                      <div className="font-bold text-[#2b170d]">
                        {t("checkout.cardPayment")}
                      </div>
                      <div className="text-sm text-[#6f4d34]">
                        {t("checkout.cardPaymentDesc")}
                      </div>
                    </div>
                  </label>

                  {/* Manual Payment (group) */}
                  {hasAnyManual && (
                  <label
                    className={`flex items-center gap-3 sm:gap-4 rounded-xl border-2 p-3 sm:p-4 cursor-pointer transition ${
                      ["bank_transfer","wallet","instapay"].includes(paymentMethod)
                        ? "border-[#15803d] bg-[#15803d]/5"
                        : "border-[#edd1b6] hover:border-[#d2a57b]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="manual"
                      checked={["bank_transfer","wallet","instapay"].includes(paymentMethod)}
                      onChange={() => setPaymentMethod(manualMethod as PaymentMethod)}
                      className="sr-only"
                    />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        ["bank_transfer","wallet","instapay"].includes(paymentMethod)
                          ? "border-[#15803d] bg-[#15803d]"
                          : "border-[#a08672]"
                      }`}
                    >
                      {["bank_transfer","wallet","instapay"].includes(paymentMethod) && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <Building2 className="h-6 w-6 text-[#ca8a04]" />
                    <div className="flex-1">
                      <div className="font-bold text-[#2b170d]">
                        {t("checkout.manualPayment")}
                      </div>
                      <div className="text-sm text-[#6f4d34]">
                        {t("checkout.manualPaymentDesc")}
                      </div>
                    </div>
                  </label>
                  )}

                  {/* Manual Payment Details Panel */}
                  {["bank_transfer","wallet","instapay"].includes(paymentMethod) && hasAnyManual && (
                    <div className="rounded-xl border-2 border-[#edd1b6] bg-white p-3 sm:p-4 mt-1">
                      {/* Segmented control */}
                      <div className="flex items-center gap-2 mb-3">
                        {hasBank && (
                          <button type="button"
                            onClick={() => { setManualMethod("bank_transfer"); setPaymentMethod("bank_transfer"); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${manualMethod === "bank_transfer" ? "bg-[#fefce8] border-[#ca8a04] text-[#854d0e]" : "border-[#edd1b6] text-[#6f4d34] hover:bg-[#f9f5f0]"}`}
                          >{t("checkout.bankTransfer")}</button>
                        )}
                        {hasWallet && (
                          <button type="button"
                            onClick={() => { setManualMethod("wallet"); setPaymentMethod("wallet"); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${manualMethod === "wallet" ? "bg-[#eff6ff] border-[#2563eb] text-[#1e40af]" : "border-[#edd1b6] text-[#6f4d34] hover:bg-[#f9f5f0]"}`}
                          >{t("checkout.wallet")}</button>
                        )}
                        {hasInstapay && (
                          <button type="button"
                            onClick={() => { setManualMethod("instapay"); setPaymentMethod("instapay"); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${manualMethod === "instapay" ? "bg-[#fdf4ff] border-[#9333ea] text-[#7e22ce]" : "border-[#edd1b6] text-[#6f4d34] hover:bg-[#f9f5f0]"}`}
                          >{t("checkout.instapay")}</button>
                        )}
                      </div>

                      {/* Bank Details Panel */}
                      {manualMethod === "bank_transfer" && paySettings.bankActive && (
                    <div className="rounded-xl border-2 border-[#ca8a04]/20 bg-[#fefce8] p-3 sm:p-4 mt-1">
                      <h3 className="font-bold text-[#854d0e] mb-3 text-sm">
                        {t("checkout.bankDetails")}
                      </h3>
                      <div className="bg-white rounded-lg p-3 font-mono text-xs ltr-nums space-y-2 overflow-x-auto">
                        {paySettings.bankName && (
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate"><strong className="text-[#854d0e]">{t("checkout.bankName")}:</strong> {paySettings.bankName}</p>
                          </div>
                        )}
                        {paySettings.accountName && (
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate"><strong className="text-[#854d0e]">{t("checkout.accountHolder")}:</strong> {paySettings.accountName}</p>
                            <CopyButton value={paySettings.accountName} className="border-[#facc15] text-[#854d0e] hover:bg-[#fef9c3]" />
                          </div>
                        )}
                        {paySettings.iban && (
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate"><strong className="text-[#854d0e]">{t("checkout.iban")}:</strong> {paySettings.iban}</p>
                            <CopyButton value={paySettings.iban} className="border-[#facc15] text-[#854d0e] hover:bg-[#fef9c3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#a16207] mt-2">
                        {t("checkout.bankTransferNote")}
                      </p>
                      <p className="text-[11px] text-[#a16207] mt-1">
                        {t("checkout.receiptReminder")}
                      </p>
                      {/* Receipt upload zone */}
                      <div className="mt-4 pt-4 border-t border-[#ca8a04]/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#854d0e]">
                            {t("checkout.attachReceipt")} <span className="text-red-500">*</span>
                          </span>
                          {receiptFile && (
                            <button type="button" onClick={() => receiptInputRef.current?.click()}
                              className="text-xs text-[#854d0e] underline underline-offset-2">
                              {t("checkout.changeReceipt")}
                            </button>
                          )}
                        </div>
                        {receiptFile && receiptPreview ? (
                          <div className="rounded-xl overflow-hidden border border-[#ca8a04]/30">
                            <img src={receiptPreview} alt="receipt preview" className="w-full max-h-44 object-cover" />
                            <div className="flex items-center gap-1.5 bg-[#15803d]/90 text-white text-xs py-1.5 px-3">
                              <Check className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{receiptFile.name}</span>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => receiptInputRef.current?.click()}
                            className="w-full rounded-xl border-2 border-dashed border-[#ca8a04]/40 bg-white hover:border-[#ca8a04] hover:bg-[#fef9c3] transition p-4 flex flex-col items-center gap-1.5">
                            <Upload className="h-5 w-5 text-[#854d0e]" />
                            <span className="text-sm font-semibold text-[#854d0e]">{t("checkout.attachReceipt")}</span>
                            <span className="text-xs text-[#a16207]">{t("checkout.receiptHint")}</span>
                          </button>
                        )}
                      </div>
                    </div>
                      )}

                      {/* Wallet Details Panel */}
                      {manualMethod === "wallet" && paySettings.walletActive && (
                    <div className="rounded-xl border-2 border-[#2563eb]/20 bg-[#eff6ff] p-3 sm:p-4 mt-1">
                      <h3 className="font-bold text-[#1e40af] mb-3 text-sm">
                        {t("checkout.walletDetails")}
                      </h3>
                      <div className="bg-white rounded-lg p-3 font-mono text-xs ltr-nums space-y-2">
                        {paySettings.walletNumber && (
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate"><strong className="text-[#1e40af]">{t("checkout.walletNumber")}:</strong> {paySettings.walletNumber}</p>
                            <CopyButton value={paySettings.walletNumber} className="border-[#93c5fd] text-[#1e40af] hover:bg-[#dbeafe]" />
                          </div>
                        )}
                        {paySettings.walletAccountName && (
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate"><strong className="text-[#1e40af]">{t("checkout.accountHolder")}:</strong> {paySettings.walletAccountName}</p>
                            <CopyButton value={paySettings.walletAccountName} className="border-[#93c5fd] text-[#1e40af] hover:bg-[#dbeafe]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#1d4ed8] mt-2">
                        {t("checkout.walletNote")}
                      </p>
                      <p className="text-[11px] text-[#1d4ed8] mt-1">
                        {t("checkout.receiptReminder")}
                      </p>
                      {/* Receipt upload zone */}
                      <div className="mt-4 pt-4 border-t border-[#2563eb]/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#1e40af]">
                            {t("checkout.attachReceipt")} <span className="text-red-500">*</span>
                          </span>
                          {receiptFile && (
                            <button type="button" onClick={() => receiptInputRef.current?.click()}
                              className="text-xs text-[#1e40af] underline underline-offset-2">
                              {t("checkout.changeReceipt")}
                            </button>
                          )}
                        </div>
                        {receiptFile && receiptPreview ? (
                          <div className="rounded-xl overflow-hidden border border-[#2563eb]/30">
                            <img src={receiptPreview} alt="receipt preview" className="w-full max-h-44 object-cover" />
                            <div className="flex items-center gap-1.5 bg-[#15803d]/90 text-white text-xs py-1.5 px-3">
                              <Check className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{receiptFile.name}</span>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => receiptInputRef.current?.click()}
                            className="w-full rounded-xl border-2 border-dashed border-[#2563eb]/40 bg-white hover:border-[#2563eb] hover:bg-[#dbeafe] transition p-4 flex flex-col items-center gap-1.5">
                            <Upload className="h-5 w-5 text-[#1e40af]" />
                            <span className="text-sm font-semibold text-[#1e40af]">{t("checkout.attachReceipt")}</span>
                            <span className="text-xs text-[#1d4ed8]">{t("checkout.receiptHint")}</span>
                          </button>
                        )}
                      </div>
                    </div>
                      )}

                      {/* InstaPay Details Panel */}
                      {manualMethod === "instapay" && paySettings.instapayActive && (
                    <div className="rounded-xl border-2 border-[#9333ea]/20 bg-[#fdf4ff] p-3 sm:p-4 mt-1">
                      <h3 className="font-bold text-[#7e22ce] mb-3 text-sm">
                        {t("checkout.instapayDetails")}
                      </h3>
                      <div className="bg-white rounded-lg p-3 font-mono text-xs ltr-nums space-y-2">
                        {paySettings.instapayIdentifier && (
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate"><strong className="text-[#7e22ce]">{t("checkout.instapayId")}:</strong> {paySettings.instapayIdentifier}</p>
                            <CopyButton value={paySettings.instapayIdentifier} className="border-[#d8b4fe] text-[#7e22ce] hover:bg-[#f3e8ff]" />
                          </div>
                        )}
                        {paySettings.instapayAccountName && (
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate"><strong className="text-[#7e22ce]">{t("checkout.accountHolder")}:</strong> {paySettings.instapayAccountName}</p>
                            <CopyButton value={paySettings.instapayAccountName} className="border-[#d8b4fe] text-[#7e22ce] hover:bg-[#f3e8ff]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#7e22ce] mt-2">
                        {t("checkout.instapayNote")}
                      </p>
                      <p className="text-[11px] text-[#7e22ce] mt-1">
                        {t("checkout.receiptReminder")}
                      </p>
                      {/* Receipt upload zone */}
                      <div className="mt-4 pt-4 border-t border-[#9333ea]/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#7e22ce]">
                            {t("checkout.attachReceipt")} <span className="text-red-500">*</span>
                          </span>
                          {receiptFile && (
                            <button type="button" onClick={() => receiptInputRef.current?.click()}
                              className="text-xs text-[#7e22ce] underline underline-offset-2">
                              {t("checkout.changeReceipt")}
                            </button>
                          )}
                        </div>
                        {receiptFile && receiptPreview ? (
                          <div className="rounded-xl overflow-hidden border border-[#9333ea]/30">
                            <img src={receiptPreview} alt="receipt preview" className="w-full max-h-44 object-cover" />
                            <div className="flex items-center gap-1.5 bg-[#15803d]/90 text-white text-xs py-1.5 px-3">
                              <Check className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{receiptFile.name}</span>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => receiptInputRef.current?.click()}
                            className="w-full rounded-xl border-2 border-dashed border-[#9333ea]/40 bg-white hover:border-[#9333ea] hover:bg-[#f3e8ff] transition p-4 flex flex-col items-center gap-1.5">
                            <Upload className="h-5 w-5 text-[#7e22ce]" />
                            <span className="text-sm font-semibold text-[#7e22ce]">{t("checkout.attachReceipt")}</span>
                            <span className="text-xs text-[#7e22ce]/70">{t("checkout.receiptHint")}</span>
                          </button>
                        )}
                      </div>
                    </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden shared file input for receipt upload */}
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleReceiptSelect}
                className="hidden"
              />

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#15803d] py-4 font-black text-white shadow-lg shadow-[#15803d]/25 transition hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {loadingStep === "receipt"
                      ? t("checkout.uploadingReceipt")
                      : t("checkout.creatingOrder")}
                  </>
                ) : paymentMethod === "paymob" ? (
                  t("checkout.proceedToPayment")
                ) : isManualPayment ? (
                  t("checkout.placeOrderWithReceipt")
                ) : (
                  t("checkout.placeOrder")
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-1 lg:order-2">
            <div className="rounded-3xl border border-[#edd1b6] bg-white p-4 sm:p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-black text-[#2b170d] mb-5">
                {t("checkout.orderSummary")}
              </h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl bg-[#f9f5f0] p-3"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-[#f0e6dc]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#2b170d] truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-[#6f4d34]">
                        {item.size} × {item.quantity}
                      </p>
                    </div>
                    <div className="font-bold text-[#2b170d] ltr-nums">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#edd1b6] pt-4 space-y-3">
                <div className="flex justify-between text-[#6f4d34]">
                  <span>{t("cart.subtotal")}</span>
                  <span className="ltr-nums">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-[#6f4d34]">
                  <span>{t("cart.shipping")}</span>
                  <span className="ltr-nums">{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-[#2b170d] pt-3 border-t border-[#edd1b6]">
                  <span>{t("cart.total")}</span>
                  <span className="ltr-nums">{formatPrice(orderTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
