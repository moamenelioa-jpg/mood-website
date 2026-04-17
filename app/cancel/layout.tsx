import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Cancelled – تم إلغاء الدفع",
  description: "Your payment was cancelled. You can try again or return to the store.",
  robots: { index: false, follow: false },
};

export default function CancelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
