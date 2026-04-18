import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout – إتمام الطلب",
  description:
    "Complete your Mood peanut butter order. Secure checkout with multiple payment options. Fast delivery across Egypt. أكمل طلبك من موود - توصيل سريع في جميع أنحاء مصر",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
