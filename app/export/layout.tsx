import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Export & Wholesale – التصدير والجملة",
  description:
    "Partner with Mood for premium peanut butter wholesale and export. Bulk orders, B2B pricing, international shipping. شراكات التصدير والجملة مع موود - زبدة فول سوداني فاخرة",
  keywords: [
    "peanut butter wholesale",
    "peanut butter export",
    "bulk peanut butter",
    "B2B peanut butter",
    "peanut butter supplier Egypt",
    "تصدير زبدة فول سوداني",
    "جملة زبدة فول سوداني",
    "موزع زبدة فول سوداني",
  ],
  openGraph: {
    title: "Export & Wholesale | Mood Premium Peanut Butter",
    description:
      "Partner with Mood for premium peanut butter wholesale and export opportunities.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Mood Export" }],
  },
  alternates: { canonical: "/export" },
};

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
