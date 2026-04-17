import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cairo, Archivo_Black } from "next/font/google";
import "./globals.css";
import { FirebaseAnalytics } from "@/app/lib/firebase-analytics";
import { LanguageProvider } from "@/app/lib/language-context";
import { CartProvider } from "@/app/lib/cart-context";
import CartDrawer from "@/app/lib/cart-drawer";
import { ContactFormProvider } from "@/app/lib/contact-form-context";
import ContactFormModal from "@/app/lib/contact-form-modal";
import { AuthProvider } from "@/app/lib/auth-context";
import AuthModal from "@/app/lib/auth-modal";
import { CommentsProvider } from "@/app/lib/comments-context";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://moodpb.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#16a34a",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mood | Premium Peanut Butter – زبدة فول سوداني فاخرة",
    template: "%s | Mood Premium Peanut Butter",
  },
  description:
    "Mood offers premium peanut butter made from 100% natural peanuts. Crunchy, creamy, chocolate, diet & more. Order online in Egypt. موود - زبدة فول سوداني طبيعية فاخرة - كرنشي، كريمي، شوكولاتة، دايت - اطلب اونلاين في مصر",
  keywords: [
    "peanut butter",
    "premium peanut butter",
    "natural peanut butter",
    "crunchy peanut butter",
    "creamy peanut butter",
    "chocolate peanut butter",
    "diet peanut butter",
    "high protein peanut butter",
    "peanut butter Egypt",
    "buy peanut butter online",
    "Mood peanut butter",
    "زبدة فول سوداني",
    "زبدة فول سوداني طبيعية",
    "زبدة فول سوداني كرنشي",
    "زبدة فول سوداني كريمي",
    "زبدة فول سوداني بالشوكولاتة",
    "زبدة فول سوداني دايت",
    "زبدة فول سوداني موود",
    "شراء زبدة فول سوداني اون لاين",
    "زبدة فول سوداني مصر",
    "زبدة فول سوداني بروتين",
    "موود",
    "healthy snacks Egypt",
    "protein spread",
    "hazelnut chocolate spread",
  ],
  authors: [{ name: "Mood" }],
  creator: "Mood",
  publisher: "Mood",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "Mood Premium Peanut Butter",
    title: "Mood | Premium Peanut Butter – زبدة فول سوداني فاخرة",
    description:
      "Premium peanut butter made from 100% natural peanuts. Crunchy, creamy, chocolate, diet & more. Order online in Egypt.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Mood Premium Peanut Butter Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mood | Premium Peanut Butter",
    description:
      "Premium peanut butter made from 100% natural peanuts. Order online in Egypt.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
  },
  category: "Food & Beverages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} ${archivoBlack.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Mood",
              description:
                "Premium peanut butter made from 100% natural peanuts in Egypt",
              url: siteUrl,
              logo: `${siteUrl}/logo.png`,
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                areaServed: "EG",
                availableLanguage: ["Arabic", "English"],
              },
              sameAs: [],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Mood Premium Peanut Butter",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/products?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans rtl:font-cairo">
        <Analytics />
        <FirebaseAnalytics />
        <LanguageProvider>
          <AuthProvider>
            <CommentsProvider>
              <CartProvider>
                <ContactFormProvider>
                  {children}
                  <CartDrawer />
                  <ContactFormModal />
                  <AuthModal />
                </ContactFormProvider>
              </CartProvider>
            </CommentsProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
