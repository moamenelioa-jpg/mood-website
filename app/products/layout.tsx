import type { Metadata } from "next";
import { products } from "@/app/lib/products";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://moodpb.com";

export const metadata: Metadata = {
  title: "Shop Premium Peanut Butter – تسوق زبدة فول سوداني فاخرة",
  description:
    "Browse Mood's full range of premium peanut butter: crunchy, creamy, chocolate, diet, honey roasted, hazelnut spread & more. 100% natural, high protein. Order online in Egypt. تصفح منتجات موود من زبدة الفول السوداني الفاخرة",
  keywords: [
    "buy peanut butter online Egypt",
    "Mood peanut butter products",
    "crunchy peanut butter",
    "creamy peanut butter",
    "chocolate peanut butter",
    "diet peanut butter",
    "honey roasted peanut butter",
    "hazelnut chocolate spread",
    "تسوق زبدة فول سوداني",
    "منتجات موود",
    "زبدة فول سوداني كرنشي",
    "زبدة فول سوداني كريمي",
  ],
  openGraph: {
    title: "Shop Premium Peanut Butter | Mood",
    description:
      "Browse Mood's full range of premium peanut butter. 100% natural, high protein. Order online.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Mood Products" }],
  },
  alternates: { canonical: "/products" },
};

// Product structured data for SEO
function ProductJsonLd() {
  const jsonLd = products.map((product) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameEn,
    description: product.subtitleEn,
    image: `${siteUrl}${product.image}`,
    brand: { "@type": "Brand", name: "Mood" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EGP",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/products`,
    },
    weight: { "@type": "QuantitativeValue", value: product.size },
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProductJsonLd />
      {children}
    </>
  );
}
