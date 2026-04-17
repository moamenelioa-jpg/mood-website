import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Successful – تم الطلب بنجاح",
  description: "Your Mood peanut butter order has been placed successfully.",
  robots: { index: false, follow: false },
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
