"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, User, Mail, LogOut, ShoppingBag } from "lucide-react";
import { useLanguage, LanguageSwitcher } from "@/app/lib/language-context";
import { useAuth } from "@/app/lib/auth-context";
import { useCart } from "@/app/lib/cart-context";

export default function AccountPage() {
  const { isArabic } = useLanguage();
  const { user, openLogin, logout } = useAuth();
  const { cartCount } = useCart();

  if (!user) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#f2f7f4] text-[#2b170d]">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_25%),linear-gradient(180deg,#f2f7f4_0%,#ecfdf5_40%,#f2f7f4_100%)]" />

        {/* Header */}
        <header dir="rtl" className="sticky top-0 z-50 border-b border-white/80 bg-white/80 backdrop-blur-xl shadow-sm font-cairo">
          <div className="flex w-full items-center justify-between px-4 py-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3 shrink-0 cursor-pointer transition-opacity hover:opacity-80">
              <div className="relative h-14 w-14 overflow-hidden lg:h-16 lg:w-16">
                <Image src="/logo.png" alt="Mood Premium Peanut Butter Logo" fill sizes="64px" className="object-contain" priority />
              </div>
              <div className="leading-tight">
                <div className="text-2xl font-archivo-black uppercase tracking-[0.2em] text-[#16a34a] sm:text-4xl lg:text-5xl">Mood</div>
                <div className="hidden text-[11px] uppercase tracking-[0.3em] text-[#9b5a1a] sm:block">Premium Peanut Butter</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#15803d]/10 mb-6">
              <User className="h-10 w-10 text-[#15803d]" />
            </div>
            <h1 className="text-2xl font-black text-[#2d170d] mb-3">
              {isArabic ? "سجل دخول لعرض حسابك" : "Sign in to view your account"}
            </h1>
            <p className="text-sm text-[#6a4f37] mb-6">
              {isArabic ? "تحتاج إلى تسجيل الدخول للوصول إلى حسابك" : "You need to sign in to access your account"}
            </p>
            <button
              type="button"
              onClick={openLogin}
              className="inline-flex items-center gap-2 rounded-xl bg-[#15803d] px-8 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#15803d]/25 transition hover:bg-[#166534]"
            >
              {isArabic ? "تسجيل الدخول" : "Sign In"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f2f7f4] text-[#2b170d]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_25%),linear-gradient(180deg,#f2f7f4_0%,#ecfdf5_40%,#f2f7f4_100%)]" />

      {/* Header */}
      <header dir="rtl" className="sticky top-0 z-50 border-b border-white/80 bg-white/80 backdrop-blur-xl shadow-sm font-cairo">
        <div className="flex w-full items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 shrink-0 cursor-pointer transition-opacity hover:opacity-80">
            <div className="relative h-14 w-14 overflow-hidden lg:h-16 lg:w-16">
              <Image src="/logo.png" alt="Mood Premium Peanut Butter Logo" fill sizes="64px" className="object-contain" priority />
            </div>
            <div className="leading-tight">
              <div className="text-2xl font-archivo-black uppercase tracking-[0.2em] text-[#16a34a] sm:text-4xl lg:text-5xl">Mood</div>
              <div className="hidden text-[11px] uppercase tracking-[0.3em] text-[#9b5a1a] sm:block">Premium Peanut Butter</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden lg:inline-flex" />
            <Link
              href="/checkout"
              className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[#edd1b6] bg-white/90 px-4 text-sm font-black text-[#5f3b1f] transition hover:border-[#d2a57b]"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">{isArabic ? "السلة" : "Cart"}</span>
              {cartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#15803d] text-xs text-white">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-10">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f3b1f] hover:text-[#15803d] transition"
          >
            {isArabic ? (
              <>
                <ArrowRight className="h-4 w-4" />
                <span>العودة للرئيسية</span>
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </>
            )}
          </Link>
        </div>

        {/* Account Card */}
        <div className="rounded-2xl border border-[#e7c9a8]/60 bg-white/90 p-8 shadow-sm backdrop-blur-sm md:p-10">
          <div className="flex items-center gap-5 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#15803d] text-2xl font-black text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#2d170d]">{user.name}</h1>
              <p className="text-sm text-[#9b5a1a]">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#e7c9a8]/40 bg-[#faf6f1]/60 p-5">
              <div className="flex items-center gap-3 mb-2">
                <User className="h-5 w-5 text-[#15803d]" />
                <h2 className="text-sm font-black uppercase tracking-wider text-[#9b5a1a]">
                  {isArabic ? "معلومات الحساب" : "Account Information"}
                </h2>
              </div>
              <div className="space-y-3 ps-8">
                <div>
                  <span className="text-xs font-semibold text-[#9b5a1a]">{isArabic ? "الاسم" : "Name"}</span>
                  <p className="text-sm font-bold text-[#2d170d]">{user.name}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#9b5a1a]">{isArabic ? "البريد الإلكتروني" : "Email"}</span>
                  <p className="text-sm font-bold text-[#2d170d]">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#e7c9a8]/40">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              {isArabic ? "تسجيل الخروج" : "Sign Out"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
