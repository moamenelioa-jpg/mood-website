import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account – حسابي",
  description: "Manage your Mood account, view profile information and settings. إدارة حسابك في موود",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
