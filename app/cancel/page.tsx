"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { useLanguage } from "@/app/lib/language-context";

function CancelContent() {
  const { t, isArabic } = useLanguage();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  // Arrow icon based on direction
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-[#f2f7f4] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="rounded-3xl border border-[#edd1b6] bg-white p-8 shadow-sm text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          <h1 className="text-2xl font-black text-[#2b170d] mb-2">
            {t("cancel.title")}
          </h1>

          <p className="text-[#6f4d34] mb-6">
            {t("cancel.description")}
            {orderNumber && (
              <span className="block mt-2 text-sm font-mono">
                {isArabic ? "الطلب " : "Order "}
                <strong className="text-[#15803d] ltr-nums">{orderNumber}</strong>
                {" "}{t("cancel.orderPending")}
              </span>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#15803d] px-6 py-3 font-bold text-white hover:bg-[#166534] transition"
            >
              <RefreshCw className="h-4 w-4" />
              {t("cancel.tryAgain")}
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#edd1b6] bg-white px-6 py-3 font-bold text-[#5f3b1f] hover:bg-[#f9f5f0] transition"
            >
              <BackArrow className="h-4 w-4 rtl-flip" />
              {t("cancel.backToStore")}
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-[#6f4d34] mt-6">
          {t("cancel.needHelp")}{" "}
          <a href="#contact" className="text-[#15803d] font-semibold hover:underline">
            {t("cancel.contactSupport")}
          </a>
        </p>
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f2f7f4]">
          <div className="animate-pulse text-[#15803d]">Loading...</div>
        </div>
      }
    >
      <CancelContent />
    </Suspense>
  );
}