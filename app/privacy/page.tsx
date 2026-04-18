"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/app/lib/language-context";

export default function PrivacyPolicyPage() {
  const { isArabic } = useLanguage();
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-[#f2f7f4]">
      <header className="border-b border-white/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden">
                <Image src="/logo.png" alt="Mood Logo" fill className="object-contain" />
              </div>
              <span className="text-2xl font-archivo-black uppercase tracking-[0.15em] text-[#16a34a]">
                Mood
              </span>
            </Link>
            <h1 className="text-lg font-bold text-[#2b170d]">
              {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f3b1f] hover:text-[#15803d] transition mb-8"
        >
          <BackArrow className="h-4 w-4 rtl-flip" />
          {isArabic ? "العودة للرئيسية" : "Back to Home"}
        </Link>

        <div className="rounded-3xl border border-[#edd1b6] bg-white p-6 sm:p-10 shadow-sm space-y-8">
          <h1 className="text-3xl font-black text-[#2b170d]">
            {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>
          <p className="text-sm text-[#6f4d34]">
            {isArabic ? "آخر تحديث: أبريل 2026" : "Last updated: April 2026"}
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-[#2b170d]">
              {isArabic ? "المعلومات التي نجمعها" : "Information We Collect"}
            </h2>
            <p className="leading-7 text-[#6f4d34]">
              {isArabic
                ? "نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند إتمام عملية الشراء، بما في ذلك الاسم ورقم الهاتف والبريد الإلكتروني وعنوان التوصيل."
                : "We collect information you provide directly when completing a purchase, including your name, phone number, email address, and delivery address."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-[#2b170d]">
              {isArabic ? "كيف نستخدم معلوماتك" : "How We Use Your Information"}
            </h2>
            <p className="leading-7 text-[#6f4d34]">
              {isArabic
                ? "نستخدم المعلومات التي نجمعها لمعالجة طلباتك وتوصيلها، والتواصل معك بشأن طلبك، وتحسين خدماتنا."
                : "We use the information we collect to process and deliver your orders, communicate with you about your order, and improve our services."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-[#2b170d]">
              {isArabic ? "حماية المعلومات" : "Information Protection"}
            </h2>
            <p className="leading-7 text-[#6f4d34]">
              {isArabic
                ? "نتخذ إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التغيير أو الإفصاح أو الإتلاف."
                : "We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-[#2b170d]">
              {isArabic ? "مشاركة المعلومات" : "Information Sharing"}
            </h2>
            <p className="leading-7 text-[#6f4d34]">
              {isArabic
                ? "لا نبيع أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا عند الضرورة لإتمام طلبك (مثل شركات الشحن ومعالجة الدفع)."
                : "We do not sell or share your personal information with third parties except as necessary to fulfill your order (such as shipping carriers and payment processors)."}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-[#2b170d]">
              {isArabic ? "تواصل معنا" : "Contact Us"}
            </h2>
            <p className="leading-7 text-[#6f4d34]">
              {isArabic
                ? "إذا كان لديك أي أسئلة حول سياسة الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني: info@mood-gf.com"
                : "If you have any questions about this Privacy Policy, you can contact us at: info@mood-gf.com"}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
