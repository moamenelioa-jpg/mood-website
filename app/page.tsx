"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Mail,
  Menu,
  Play,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  User,
  LogOut,
  X,
} from "lucide-react";
import { useLanguage, LanguageSwitcher } from "@/app/lib/language-context";
import { useCart } from "@/app/lib/cart-context";
import { useContactForm } from "@/app/lib/contact-form-context";
import { useAuth } from "@/app/lib/auth-context";
import { featuredProducts } from "@/app/lib/products";

// Social Media Icons
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// Social media links
const socialLinks = [
  {
    name: "WhatsApp",
    href: "https://wa.me/201200666859",
    icon: WhatsAppIcon,
    color: "text-[#25D366]",
    hoverBg: "hover:bg-[#25D366] hover:text-white hover:shadow-lg hover:shadow-[#25D366]/40",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/MOODPeanutButter/?locale=ar_AR",
    icon: FacebookIcon,
    color: "text-[#1877F2]",
    hoverBg: "hover:bg-[#1877F2] hover:text-white hover:shadow-lg hover:shadow-[#1877F2]/40",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/mood_gf.shop",
    icon: InstagramIcon,
    color: "text-[#E4405F]",
    hoverBg: "hover:bg-[#E4405F] hover:text-white hover:shadow-lg hover:shadow-[#E4405F]/40",
  },
  {
    name: "Email",
    href: "mailto:info@mood-gf.com",
    icon: Mail,
    color: "text-[#EA4335]",
    hoverBg: "hover:bg-[#EA4335] hover:text-white hover:shadow-lg hover:shadow-[#EA4335]/40",
  },
];

const testimonials = [
  {
    name: "Nour A.",
    textEn:
      "The brand feels premium, trustworthy, and ready for international shelves.",
    textAr: "البراند يبدو فاخرًا وموثوقًا وجاهزًا للظهور بشكل عالمي.",
  },
  {
    name: "Moamen A.",
    textEn:
      "Very clean layout, strong product presentation, and more memorable than standard templates.",
    textAr: "التصميم نظيف جدًا، وعرض المنتجات قوي، وأكثر تميزًا من القوالب العادية.",
  },
  {
    name: "Mariam S.",
    textEn:
      "This style gives the product a real brand identity, not just a generic online shop look.",
    textAr: "هذا الأسلوب يمنح المنتج هوية حقيقية، وليس مجرد متجر إلكتروني تقليدي.",
  },
];

const navLinks = [
  ["home", { en: "Home", ar: "الرئيسية" }],
  ["products", { en: "Products", ar: "المنتجات" }],
  ["export", { en: "Export", ar: "التصدير" }],
  ["blogs", { en: "Brand Story", ar: "عن موود " }],
  ["wholesale", { en: "Wholesale", ar: "الجملة" }],
  ["contact", { en: "Contact", ar: "تواصل" }],
] as const;

const heroBadges = [
  { en: "Authentic", ar: "طبيعي" },
  { en: "Smooth", ar: "سلس" },
  { en: "Trusted", ar: "موثوق" },
  { en: "Fast", ar: "سريع" },
] as const;

/* Account button component used in the header */
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

export default function MoodWorldClassStore() {
  const { language, isArabic, toggleLanguage, formatPrice, dir } = useLanguage();
  const { addToCart, cartCount, setCartOpen } = useCart();
  const { openContactForm } = useContactForm();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const currentTestimonial = useMemo(
    () => testimonials[activeTestimonial],
    [activeTestimonial]
  );

  const nextTestimonial = () =>
    setActiveTestimonial((value) => (value + 1) % testimonials.length);

  const previousTestimonial = () =>
    setActiveTestimonial(
      (value) => (value - 1 + testimonials.length) % testimonials.length
    );

  // Direction-aware arrow
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div dir="rtl" className="min-h-screen bg-[#f2f7f4] text-[#2b170d]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_25%),linear-gradient(180deg,#f2f7f4_0%,#ecfdf5_40%,#f2f7f4_100%)]" />

      <header className="sticky top-0 z-50 border-b border-white/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <a href="#home" className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80">
            <div className="relative h-16 w-16 overflow-hidden">
  <Image
    src="/logo.png"
    alt="Mood Premium Peanut Butter Logo"
    fill
    sizes="64px"
    className="object-contain"
    priority
  />
</div>
            <div className="leading-tight">
              <div className="text-5xl font-archivo-black uppercase tracking-[0.2em] text-[#16a34a]">Mood</div>
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#9b5a1a]">Premium Peanut Butter</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 font-semibold uppercase tracking-[0.12em] text-[#5f3b1f] lg:flex text-base">
            {navLinks.map(([href, label]) =>
              href === "products" || href === "export" || href === "blogs" ? (
                <Link key={href} href={`/${href}`} className="transition hover:text-[#15803d]">
                  {isArabic ? label.ar : label.en}
                </Link>
              ) : (
                <a key={href} href={`#${href}`} className="transition hover:text-[#15803d]">
                  {isArabic ? label.ar : label.en}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            {/* Social Media Icons */}
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

            {/* Account Icon */}
            <AccountButton />

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative inline-flex h-11 items-center gap-2 rounded-full border border-[#edd1b6] bg-white/90 px-4 text-sm font-black text-[#5f3b1f] transition hover:border-[#d2a57b]"
              aria-label={isArabic ? "افتح السلة" : "Open cart"}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{isArabic ? "السلة" : "Cart"}</span>
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#15803d] px-1.5 text-[10px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <Link href="/products" className="hidden rounded-full bg-[#15803d] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-[#15803d]/25 transition hover:bg-[#7f4d1d] lg:inline-flex">
              {isArabic ? "تسوق الآن" : "Shop Now"}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenu((value) => !value)}
              className="rounded-full border border-[#edd1b6] bg-white/90 p-2 text-[#5f3b1f] transition lg:hidden"
              aria-label={isArabic ? "فتح القائمة" : "Toggle menu"}
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="border-t border-[#f0e2d0] bg-white/95 px-6 py-5 lg:hidden">
            <div className="flex flex-col gap-4 font-bold uppercase tracking-[0.14em] text-[#5f3b1f] text-base">
              {navLinks.map(([href, label]) =>
                href === "products" || href === "export" || href === "blogs" ? (
                  <Link key={href} href={`/${href}`} className="block transition hover:text-[#15803d]">
                    {isArabic ? label.ar : label.en}
                  </Link>
                ) : (
                  <a key={href} href={`#${href}`} className="block transition hover:text-[#15803d]">
                    {isArabic ? label.ar : label.en}
                  </a>
                )
              )}
            </div>
            {/* Mobile Social Media Icons */}
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
            </div>
          </div>
        )}
      </header>

      <main id="home">
        <section className="relative overflow-hidden px-6 pt-12 pb-20 lg:px-10 lg:pt-16 lg:pb-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#e7c9a8] bg-[#fff4e6]/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9b5a1a] shadow-sm shadow-[#d1ba9d]/20">
                <Sparkles className="h-4 w-4 text-[#9b5a1a]" />
                {isArabic ? "تجربة براند عالمية" : "A world-class brand experience"}
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl font-black leading-tight tracking-[-0.05em] text-[#2d170d] sm:text-6xl lg:text-7xl">
                  {isArabic ? "زبدة فول سوداني بروح فاخرة" : "Premium peanut butter for modern shelves."}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[#5f4330] sm:text-xl">
                  {isArabic
                    ? "تجربة تصميم متكاملة تصنع انطباعًا قويًا، تبني ثقة، وتجعل العلامة التجارية تبدو عالمية وفخمة."
                    : "A refined shopping experience that builds trust, boosts conversion, and positions Mood as a premium international brand."}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 rounded-full bg-[#15803d] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_20px_45px_rgba(154,92,36,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#7f4d1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]/40"
                >
                  {isArabic ? "تسوق المجموعات" : "Explore the collection"}
                  <BackArrow className="h-4 w-4 rtl-flip" />
                </a>
                <button className="inline-flex items-center gap-2 rounded-full border border-[#e5c8a5] bg-white/90 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#5f3b1f] transition duration-300 hover:border-[#d1a570] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]/40">
                  <Play className="h-4 w-4" />
                  {isArabic ? "اكتشف البراند" : "Discover Mood"}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {heroBadges.map((badge) => (
                  <div
                    key={badge.en}
                    className="rounded-[2rem] border border-[#eed7be] bg-white/90 p-5 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="text-lg font-black text-[#15803d]">{isArabic ? badge.ar : badge.en}</div>
                    <p className="mt-3 text-sm leading-6 text-[#6f4d34]">
                      {isArabic
                        ? "تجربة تسوق أكثر وضوحًا وفخامة."
                        : "Sharper messaging, premium clarity, assured confidence."}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 rounded-[2rem] border border-[#e8d3b8] bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.28em] text-[#15803d]">
                    {isArabic ? "موثوق به من" : "Trusted by"}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#5f3b1f]">
                    <span className="rounded-full bg-[#f3e2cf] px-3 py-2">{isArabic ? "تجار" : "Retail"}</span>
                    <span className="rounded-full bg-[#f3e2cf] px-3 py-2">{isArabic ? "مقاهي" : "Cafés"}</span>
                    <span className="rounded-full bg-[#f3e2cf] px-3 py-2">{isArabic ? "صحّة" : "Health"}</span>
                  </div>
                </div>
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#5f3b1f] transition hover:text-[#15803d]"
                >
                  {isArabic ? "ابدأ التصفح" : "Browse the range"}
                  <ChevronDown className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-[#f7ce8f]/70 blur-3xl" />
              <div className="absolute -right-10 bottom-16 h-36 w-36 rounded-full bg-[#15803d]/15 blur-3xl" />

              <div className="overflow-hidden rounded-[3rem] border border-white/80 bg-white/80 p-4 shadow-[0_35px_90px_rgba(78,41,12,0.14)] backdrop-blur-md sm:p-6">
                <div className="grid gap-6">
                  <div className="relative overflow-hidden rounded-[2.2rem]">
                    <div className="absolute inset-0 z-10 flex items-start justify-between p-6 text-xs font-black uppercase tracking-[0.24em] text-white drop-shadow-md">
                      <span>{isArabic ? "المنتج المفضل" : "Favorite product"}</span>
                      <span>2026</span>
                    </div>
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src="/products/crunchy.jfif"
                        alt={isArabic ? "زبدة فول سوداني كرنشي من موود" : "Mood crunchy peanut butter jar - premium natural"}
                        fill
                        sizes="(max-width: 768px) 90vw, 60vw"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[2rem] bg-gradient-to-r from-[#16a34a] to-[#22c55e] p-6 text-white shadow-xl">
                      <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.24em] text-[#f6d29b]">
                        <Globe2 className="h-4 w-4" />
                        {isArabic ? "تصميم عالمي" : "International appeal"}
                      </div>
                      <div className="mt-5 text-3xl font-black leading-tight">
                        {isArabic ? "هوية تُشعر بها" : "A brand you feel."}
                      </div>
                      <p className="mt-4 text-sm leading-7 text-white/80">
                        {isArabic
                          ? "تجربة مرئية راقية، تدرجات دافئة، وتفاصيل تقود إلى الشراء."
                          : "Elegant visuals, refined details, and a look that inspires confidence."}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.8rem] border border-[#ead6c0] bg-white/85 p-5 shadow-sm">
                        <ShieldCheck className="h-6 w-6 text-[#15803d]" />
                        <div className="mt-4 text-lg font-black text-[#2b170d]">{isArabic ? "ثقة" : "Trust"}</div>
                        <p className="mt-2 text-sm leading-6 text-[#6f4d34]">
                          {isArabic
                            ? "هوية أقوى ورسائل أوضح تزيد من مصداقية المنتج."
                            : "Stronger messaging and clearer product confidence."}
                        </p>
                      </div>
                      <div className="rounded-[1.8rem] border border-[#ead6c0] bg-white/85 p-5 shadow-sm">
                        <Truck className="h-6 w-6 text-[#d18f55]" />
                        <div className="mt-4 text-lg font-black text-[#2b170d]">{isArabic ? "سلاسة" : "Smooth flow"}</div>
                        <p className="mt-2 text-sm leading-6 text-[#6f4d34]">
                          {isArabic
                            ? "رحلة تسوق سهلة، أزرار واضحة، وتركيز على المنتج."
                            : "A smoother checkout journey with clear calls to action."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#e8d3b8] bg-white/90 text-[#15803d] shadow-sm shadow-[#d6b18d]/10">
              <ChevronDown className="h-5 w-5 animate-bounce" />
            </div>
          </div>
        </section>

        <section id="products" className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.32em] text-[#15803d]">
                {isArabic ? "مجموعة مميزة" : "Featured range"}
              </div>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#2d170d] md:text-5xl">
                {isArabic
                  ? "منتجات موود. جودة فائقة وطعم لا يقاوم"
                  : "Products presented with premium polish."}
              </h2>
            </div>
            <Link
              href="/products"
              className="rounded-full border border-[#e8d3b8] bg-white/90 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#5f3b1f] transition hover:border-[#d6b18d]"
            >
              {isArabic ? "استكشف الكتالوج" : "Browse catalog"}
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[2.4rem] border border-[#f0dfc7] bg-white/90 shadow-[0_24px_75px_rgba(82,44,12,0.09)] transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_32px_96px_rgba(82,44,12,0.16)]"
              >
                <div className="relative overflow-hidden bg-[#f9f0e6]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_30%)]" />
                  <div className="relative aspect-[5/6] w-full min-h-[22rem] overflow-hidden rounded-[2rem] bg-[#f9f0e6] md:aspect-[4/5]">
                    <Image
                      src={product.image}
                      alt={isArabic ? product.nameAr : product.nameEn}
                      fill
                      className="object-cover object-center transition duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <span className="absolute left-4 top-4 rounded-full bg-[#15803d] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                    {isArabic ? product.badgeAr : product.badgeEn}
                  </span>
                  <span className="absolute right-4 top-4 rounded-full bg-[#f59e0b] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {isArabic ? "شحن مجاني" : "Free Shipping"}
                  </span>
                </div>

                <div className="space-y-4 px-5 pb-6 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-[#2d170d]">
                        {isArabic ? product.nameAr : product.nameEn}
                      </h3>
                      <p className="mt-2 text-sm text-[#6a4f37]">
                        {isArabic ? product.subtitleAr : product.subtitleEn}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f7e4d2] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#15803d]">
                      {product.size}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="text-2xl font-black text-[#2d170d]">EGP {product.price}</div>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#15803d] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7f4d1d]"
                    >
                      {isArabic ? "اضف الى السلة" : "Add to Cart"}
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* View All Products Button */}
          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-[#15803d] px-8 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#0f6d32]"
            >
              {isArabic ? "عرض جميع المنتجات" : "View All Products"}
              {isArabic ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            </Link>
          </div>
        </section>

        <section id="story" className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
            <div className="rounded-[2.4rem] bg-gradient-to-r from-[#16a34a] to-[#22c55e] p-10 text-white shadow-[0_30px_80px_rgba(47,27,13,0.22)]">
              <div className="text-sm font-black uppercase tracking-[0.28em] text-[#f4d79a]">
                {isArabic ? "قصة البراند" : "Brand story"}
              </div>
              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.04em] md:text-5xl">
                {isArabic
                  ? "تصميم عالمي لمنتج يروي قصة قوية."
                  : "Design that turns peanut butter into a premium brand."}
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
                {isArabic
                  ? "الموقع لا يبيع منتجًا فقط، بل يبني قيمة، يضع الثقة في المقدمة، ويجعل كل قسم يتكلم بلغة الفخامة."
                  : "This experience builds value, puts trust front and center, and positions every section as premium storytelling."}
              </p>
              <button className="mt-10 rounded-full bg-[#f6eadb] px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#2b170d] shadow-lg shadow-[#523211]/10 transition hover:bg-white">
                {isArabic ? "ابدأ مع Mood" : "Start with Mood"}
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                [
                  isArabic ? "واجهة سينمائية" : "Cinematic hero",
                  isArabic ? "تركيز أكبر على المنتج والتفاصيل." : "Stronger product emphasis and premium detail.",
                ],
                [
                  isArabic ? "تصفح مرن" : "Clear browsing",
                  isArabic ? "تنسيق متوازن وسهل القراءة." : "Balanced layout and effortless readability.",
                ],
                [
                  isArabic ? "ثقة أعلى" : "More trust",
                  isArabic ? "مؤشرات ثقة جذابة ومصداقية." : "Trust cues that feel authentic and elevated.",
                ],
                [
                  isArabic ? "هوية عالمية" : "Global appeal",
                  isArabic ? "ألوان دافئة وأسلوب محترف عالمي." : "Warm palette and elegant international style.",
                ],
              ].map(([title, description]) => (
                <div key={title as string} className="rounded-[2rem] border border-[#eed7be] bg-white/90 p-6 shadow-sm">
                  <h3 className="text-xl font-black text-[#2d170d]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#6f4d34]">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
          <div className="overflow-hidden rounded-[2.8rem] border border-[#f0dfc7] bg-white/85 p-8 shadow-[0_30px_80px_rgba(78,44,12,0.10)] backdrop-blur-md lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:items-center">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.28em] text-[#15803d]">
                  {isArabic ? "آراء العملاء" : "Customer voice"}
                </div>
                <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#2d170d] md:text-5xl">
                  {isArabic
                    ? "التجربة يجب أن تشعر بالفخامة والثقة."
                    : "The experience should feel premium, trusted, and inviting."}
                </h2>

                <div className="mt-10 rounded-[2rem] bg-[#f8efe3] p-8 shadow-sm">
                  <div className="flex items-center gap-2 text-[#d18f56]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-6 text-lg leading-8 text-[#5a3f29]">
                    “{isArabic ? currentTestimonial.textAr : currentTestimonial.textEn}”
                  </p>
                  <div className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-[#15803d]">
                    {currentTestimonial.name}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {testimonials.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setActiveTestimonial(index)}
                    className={`rounded-[1.8rem] border p-5 text-left transition ${
                      index === activeTestimonial
                        ? "border-[#d4b48c] bg-[#2b170d] text-white shadow-lg"
                        : "border-[#f0dfc7] bg-white text-[#5f3b1f] hover:border-[#d4b48c]"
                    }`}
                  >
                    <div className="font-black">{item.name}</div>
                    <p className={`mt-3 text-sm leading-7 ${
                      index === activeTestimonial ? "text-white/80" : "text-[#6f4d34]"
                    }`}>
                      {(isArabic ? item.textAr : item.textEn).slice(0, 90)}...
                    </p>
                  </button>
                ))}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={previousTestimonial}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7d5bd] bg-white shadow-sm transition hover:bg-[#f7f0e6]"
                    aria-label={isArabic ? "الاستعراض السابق" : "Previous testimonial"}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextTestimonial}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7d5bd] bg-white shadow-sm transition hover:bg-[#f7f0e6]"
                    aria-label={isArabic ? "الاستعراض التالي" : "Next testimonial"}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="wholesale" className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
          <div className="rounded-[2.8rem] bg-[linear-gradient(135deg,#16a34a_50%,#22c55e_80%)] p-10 text-white shadow-[0_35px_90px_rgba(47,27,13,0.24)] lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.28em] text-[#f9d49c]">
                  {isArabic ? "الجملة والتوزيع" : "Wholesale & distribution"}
                </div>
                <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] md:text-5xl">
                  {isArabic
                    ? "  عروض خاصة وحصرية لتجار الجملة والموزعين   ."
                    : "  Special and exclusive offers for wholesalers and distributors   ."}
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">
                  {isArabic
                    ? "هذا العرض التجاري مصمم ليُظهر المنتج بمظهر احترافي، واضح، وجذاب للأسواق العالية القيمة."
                    : "A premium wholesale presentation designed to attract high-value partners and bulk buyers."}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <a href="https://wa.me/201200666859?text=%D8%B7%D9%84%D8%A8%20%D8%B9%D8%B1%D8%B6%20%D8%B3%D8%B9%D8%B1" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#2b170d] shadow-lg shadow-[#1b0f05]/10 transition hover:bg-[#f7f0e6]">
                  {isArabic ? "طلب عرض سعر" : "Request pricing"}
                </a>
                <a href="https://wa.me/201200666859?text=%D9%83%D9%86%20%D9%85%D9%88%D8%B2%D8%B9%20%D9%85%D8%B9%D8%AA%D9%85%D8%AF" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/40 bg-white/10 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/15">
                  {isArabic ? "كن موزع معتمد " : "Become a partner"}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="grid gap-8 rounded-[2.4rem] border border-[#f0dfc7] bg-white/85 p-8 shadow-sm md:grid-cols-3">
          <div>
            <div className="text-3xl font-archivo-black uppercase tracking-[0.2em] text-[#15803d]">Mood</div>
            <div className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-[#5f3b1f]">Premium Peanut Butter</div>
            <p className="mt-4 leading-7 text-[#6f4d34]">
              {isArabic
                ? "واجهتك الآن تبدو أكثر احترافية، عصرية، ومرغوبة من المتاجر التقليدية."
                : "Your storefront now feels modern, premium, and built for high-value shoppers."}
            </p>
            {/* Social Media Icons */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) =>
                social.name === "Email" ? (
                  <button
                    key={social.name}
                    onClick={openContactForm}
                    className={`rounded-full border border-[#edd1b6] bg-white p-3 transition-all duration-200 hover:scale-110 ${social.color} ${social.hoverBg}`}
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
                    className={`rounded-full border border-[#edd1b6] bg-white p-3 transition-all duration-200 hover:scale-110 ${social.color} ${social.hoverBg}`}
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                )
              )}
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-[#2d170d]">{isArabic ? "خريطة الموقع" : "Site map"}</div>
            <div className="mt-4 space-y-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#6f4d34]">
              {navLinks.slice(0, 4).map(([_, label]) => (
                <div key={label.en}>{isArabic ? label.ar : label.en}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-[#2d170d]">{isArabic ? "الخطوة التالية" : "Next step"}</div>
            <p className="mt-4 leading-7 text-[#6f4d34]">
              {isArabic
                ? "أضف السلة، الدفع، وصقل التفاصيل لاحقًا لموقع متجر كامل."
                : "This version includes cart and checkout flow, ready to evolve into a complete premium store."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
