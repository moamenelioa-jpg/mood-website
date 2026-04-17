import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog – عن موود | Peanut Butter Articles & Tips",
  description:
    "Read about Mood's premium peanut butter varieties, health benefits, recipes, and nutrition tips. Discover what makes our natural peanut butter the best in Egypt. اقرأ مقالات عن زبدة الفول السوداني الطبيعية من موود",
  keywords: [
    "peanut butter blog",
    "peanut butter benefits",
    "peanut butter recipes",
    "healthy peanut butter",
    "peanut butter nutrition",
    "Mood blog",
    "مدونة زبدة فول سوداني",
    "فوائد زبدة الفول السوداني",
    "وصفات زبدة الفول السوداني",
    "عن موود",
  ],
  openGraph: {
    title: "Blog – About Mood | Premium Peanut Butter",
    description:
      "Articles about Mood's premium peanut butter, health benefits, and recipes.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Mood Blog" }],
  },
  alternates: { canonical: "/blogs" },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
