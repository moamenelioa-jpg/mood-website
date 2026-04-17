"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Mail,
  Phone,
  User,
  LogOut,
  Menu,
  X,
  MapPin,
} from "lucide-react";
import { useLanguage, LanguageSwitcher } from "@/app/lib/language-context";
import { useCart } from "@/app/lib/cart-context";
import { useContactForm } from "@/app/lib/contact-form-context";
import { useAuth } from "@/app/lib/auth-context";

/* ── Social Media Icons ── */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
  );
}

/* ── Data ── */
const socialLinks = [
  {
    name: "WhatsApp",
    href: "https://wa.me/201200666859",
    icon: WhatsAppIcon,
    color: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
    hoverBg: "hover:bg-[#25D366] hover:text-white hover:shadow-lg hover:shadow-[#25D366]/40",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/MOODPeanutButter/?locale=ar_AR",
    icon: FacebookIcon,
    color: "text-[#1877F2]",
    bg: "bg-[#1877F2]/10",
    hoverBg: "hover:bg-[#1877F2] hover:text-white hover:shadow-lg hover:shadow-[#1877F2]/40",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/mood_gf.shop",
    icon: InstagramIcon,
    color: "text-[#E4405F]",
    bg: "bg-[#E4405F]/10",
    hoverBg: "hover:bg-[#E4405F] hover:text-white hover:shadow-lg hover:shadow-[#E4405F]/40",
  },
  {
    name: "Email",
    href: "mailto:info@mood-gf.com",
    icon: Mail,
    color: "text-[#EA4335]",
    bg: "bg-[#EA4335]/10",
    hoverBg: "hover:bg-[#EA4335] hover:text-white hover:shadow-lg hover:shadow-[#EA4335]/40",
  },
];

const phoneNumbers = [
  { display: "+20 12 00666859", href: "tel:+201200666859" },
  { display: "+20 10 20797209", href: "tel:+201020797209" },
  { display: "+20 12 74788647", href: "tel:+201274788647" },
  { display: "+20 12 00149370", href: "tel:+201200149370" },
];

/* ── Account Button ── */
function AccountButton() {
  const { isArabic } = useLanguage();
  const { user, openLogin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return (
      <button
        type="button"
        onClick={openLogin}
        className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[#edd1b6] bg-white/90 px-4 text-sm font-black text-[#5f3b1f] transition hover:border-[#d2a57b]"
        aria-label={isArabic ? "تسجيل الدخول" : "Sign In"}
      >
        <User className="h-5 w-5" />
        <span className="hidden sm:inline">{isArabic ? "حسابي" : "Account"}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[#15803d]/30 bg-[#15803d]/10 px-4 text-sm font-black text-[#15803d] transition hover:bg-[#15803d]/20"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#15803d] text-[10px] font-black text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline max-w-[80px] truncate">{user.name}</span>
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className={`absolute top-full mt-2 ${isArabic ? "left-0" : "right-0"} z-50 w-56 rounded-xl border border-[#e7c9a8]/60 bg-white p-2 shadow-xl`}>
            <div className="px-3 py-2 border-b border-[#e7c9a8]/40 mb-1">
              <p className="text-sm font-bold text-[#2d170d] truncate">{user.name}</p>
              <p className="text-xs text-[#9b5a1a] truncate">{user.email}</p>
            </div>
            <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#5f3b1f] hover:bg-[#f0e2d0]/60 transition">
              <User className="h-4 w-4" />
              {isArabic ? "حسابي" : "My Account"}
            </Link>
            <button type="button" onClick={() => { logout(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition">
              <LogOut className="h-4 w-4" />
              {isArabic ? "تسجيل الخروج" : "Sign Out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Page ── */
export default function ContactPage() {
  const { isArabic } = useLanguage();
  const { cartCount } = useCart();
  const { openContactForm } = useContactForm();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f2f7f4] text-[#2b170d]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_25%),linear-gradient(180deg,#f2f7f4_0%,#ecfdf5_40%,#f2f7f4_100%)]" />

      {/* ── Header ── */}
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

          <nav className="hidden items-center gap-6 text-base font-semibold uppercase tracking-[0.12em] text-[#5f3b1f] xl:flex">
            <Link href="/" className="transition hover:text-[#15803d]">{isArabic ? "الرئيسية" : "Home"}</Link>
            <Link href="/products" className="transition hover:text-[#15803d]">{isArabic ? "المنتجات" : "Products"}</Link>
            <Link href="/export" className="transition hover:text-[#15803d]">{isArabic ? "التصدير" : "Export"}</Link>
            <Link href="/blogs" className="transition hover:text-[#15803d]">{isArabic ? "عن موود" : "Brand Story"}</Link>
            <Link href="/#wholesale" className="transition hover:text-[#15803d]">{isArabic ? "الجملة" : "Wholesale"}</Link>
            <Link href="/contact" className="text-[#15803d]">{isArabic ? "تواصل" : "Contact"}</Link>
          </nav>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden items-center gap-1 lg:flex">
              {socialLinks.map((social) =>
                social.name === "Email" ? (
                  <button
                    key={social.name}
                    onClick={openContactForm}
                    className={`rounded-full p-2.5 transition-all duration-200 hover:scale-110 ${social.color} ${social.hoverBg}`}
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </button>
                ) : (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-2.5 transition-all duration-200 hover:scale-110 ${social.color} ${social.hoverBg}`}
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                )
              )}
            </div>

            <LanguageSwitcher className="hidden lg:inline-flex" />
            <AccountButton />

            <Link
              href="/checkout"
              className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[#edd1b6] bg-white/90 px-4 text-sm font-black text-[#5f3b1f] transition hover:border-[#d2a57b]"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="hidden sm:inline">{isArabic ? "السلة" : "Cart"}</span>
              {cartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#15803d] text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenu((v) => !v)}
              className="rounded-full border border-[#edd1b6] bg-white/90 p-2 text-[#5f3b1f] transition xl:hidden"
              aria-label={isArabic ? "فتح القائمة" : "Toggle menu"}
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="border-t border-[#f0e2d0] bg-white/95 px-6 py-5 xl:hidden">
            <div className="flex flex-col gap-4 text-base font-bold uppercase tracking-[0.14em] text-[#5f3b1f]">
              <Link href="/" onClick={() => setMobileMenu(false)} className="block transition hover:text-[#15803d]">{isArabic ? "الرئيسية" : "Home"}</Link>
              <Link href="/products" onClick={() => setMobileMenu(false)} className="block transition hover:text-[#15803d]">{isArabic ? "المنتجات" : "Products"}</Link>
              <Link href="/export" onClick={() => setMobileMenu(false)} className="block transition hover:text-[#15803d]">{isArabic ? "التصدير" : "Export"}</Link>
              <Link href="/blogs" onClick={() => setMobileMenu(false)} className="block transition hover:text-[#15803d]">{isArabic ? "عن موود" : "Brand Story"}</Link>
              <Link href="/#wholesale" onClick={() => setMobileMenu(false)} className="block transition hover:text-[#15803d]">{isArabic ? "الجملة" : "Wholesale"}</Link>
              <Link href="/contact" onClick={() => setMobileMenu(false)} className="block text-[#15803d]">{isArabic ? "تواصل" : "Contact"}</Link>
            </div>
            <div className="mt-5 flex items-center gap-3 border-t border-[#f0e2d0] pt-5">
              {socialLinks.map((social) =>
                social.name === "Email" ? (
                  <button
                    key={social.name}
                    onClick={openContactForm}
                    className={`rounded-full p-3 border border-[#edd1b6] transition-all duration-200 hover:scale-110 ${social.color} ${social.hoverBg}`}
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </button>
                ) : (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-full p-3 border border-[#edd1b6] transition-all duration-200 hover:scale-110 ${social.color} ${social.hoverBg}`}
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                )
              )}
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-10">
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

        {/* Page Header */}
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-[#15803d]/10 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-[#15803d]">
            {isArabic ? "تواصل معنا" : "Contact Us"}
          </span>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-[#2d170d] sm:text-4xl md:text-5xl">
            {isArabic ? "نحب نسمع منك" : "We'd Love to Hear from You"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#6a4f37] sm:text-lg">
            {isArabic
              ? "تواصل معنا عبر الهاتف أو البريد الإلكتروني أو وسائل التواصل الاجتماعي — فريقنا جاهز لمساعدتك"
              : "Reach out by phone, email, or social media — our team is ready to help"}
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Phone Numbers Card */}
          <div className="rounded-[2rem] border border-[#f0dfc7] bg-white/90 p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#15803d]/10">
                <Phone className="h-6 w-6 text-[#15803d]" />
              </div>
              <h2 className="text-xl font-black text-[#2d170d] sm:text-2xl">
                {isArabic ? "أرقام الهاتف" : "Phone Numbers"}
              </h2>
            </div>
            <div className="space-y-3">
              {phoneNumbers.map((phone) => (
                <a
                  key={phone.href}
                  href={phone.href}
                  className="flex items-center gap-3 rounded-xl border border-[#f0dfc7] bg-[#faf5ee]/60 px-4 py-3 text-base font-semibold text-[#5f3b1f] transition hover:border-[#15803d]/40 hover:bg-[#15803d]/5 sm:text-lg ltr-nums"
                  dir="ltr"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[#15803d]" />
                  {phone.display}
                </a>
              ))}
            </div>
          </div>

          {/* Email Card */}
          <div className="rounded-[2rem] border border-[#f0dfc7] bg-white/90 p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EA4335]/10">
                <Mail className="h-6 w-6 text-[#EA4335]" />
              </div>
              <h2 className="text-xl font-black text-[#2d170d] sm:text-2xl">
                {isArabic ? "البريد الإلكتروني" : "Email"}
              </h2>
            </div>
            <a
              href="mailto:info@mood-gf.com"
              className="flex items-center gap-3 rounded-xl border border-[#f0dfc7] bg-[#faf5ee]/60 px-4 py-3 text-base font-semibold text-[#5f3b1f] transition hover:border-[#EA4335]/40 hover:bg-[#EA4335]/5 sm:text-lg"
              dir="ltr"
            >
              <Mail className="h-4 w-4 shrink-0 text-[#EA4335]" />
              info@mood-gf.com
            </a>
            <p className="mt-4 text-sm text-[#6a4f37]">
              {isArabic
                ? "راسلنا في أي وقت وسنرد عليك في أقرب فرصة"
                : "Email us anytime and we'll get back to you as soon as possible"}
            </p>

            {/* Send Message Button */}
            <button
              type="button"
              onClick={openContactForm}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#15803d] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-[#15803d]/25 transition hover:bg-[#166534]"
            >
              <Mail className="h-4 w-4" />
              {isArabic ? "أرسل رسالة" : "Send a Message"}
            </button>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="mt-10 rounded-[2rem] border border-[#f0dfc7] bg-white/90 p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-black text-[#2d170d] sm:text-2xl">
              {isArabic ? "تابعنا على وسائل التواصل" : "Follow Us on Social Media"}
            </h2>
            <p className="mt-2 text-sm text-[#6a4f37]">
              {isArabic
                ? "تابعنا للحصول على آخر الأخبار والعروض الحصرية"
                : "Stay connected for the latest updates and exclusive offers"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target={social.name === "Email" ? undefined : "_blank"}
                rel={social.name === "Email" ? undefined : "noopener noreferrer"}
                className={`group flex flex-col items-center gap-3 rounded-2xl border border-[#f0dfc7] ${social.bg} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${social.color} bg-white shadow-sm transition-all duration-300 group-hover:scale-110`}>
                  <social.icon className="h-7 w-7" />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.15em] text-[#5f3b1f]">
                  {social.name}
                </span>
                <span className="text-xs text-[#6a4f37]">
                  {social.name === "WhatsApp" && (isArabic ? "راسلنا على واتساب" : "Chat with us")}
                  {social.name === "Facebook" && (isArabic ? "تابعنا على فيسبوك" : "Like our page")}
                  {social.name === "Instagram" && (isArabic ? "تابعنا على انستجرام" : "Follow us")}
                  {social.name === "Email" && (isArabic ? "أرسل بريد إلكتروني" : "Send an email")}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Quick WhatsApp CTA */}
        <div className="mt-10 rounded-[2rem] bg-gradient-to-r from-[#16a34a] to-[#22c55e] p-8 text-center text-white shadow-[0_30px_80px_rgba(47,27,13,0.15)] sm:p-10">
          <h2 className="text-xl font-black sm:text-2xl">
            {isArabic ? "محتاج مساعدة سريعة؟" : "Need Quick Help?"}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80 sm:text-base">
            {isArabic
              ? "تواصل معنا مباشرة على واتساب للرد الفوري على استفساراتك"
              : "Reach us directly on WhatsApp for instant replies to your questions"}
          </p>
          <a
            href="https://wa.me/201200666859"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#15803d] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {isArabic ? "ابدأ محادثة واتساب" : "Start WhatsApp Chat"}
          </a>
        </div>
      </main>
    </div>
  );
}
