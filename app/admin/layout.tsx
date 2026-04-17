"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Users,
  LogOut,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "@/app/lib/admin-auth-context";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
  { href: "/admin/orders", icon: ShoppingBag, label: "الطلبات" },
  { href: "/admin/receipts", icon: Receipt, label: "إيصالات التحويل" },
  { href: "/admin/users", icon: Users, label: "المشرفون" },
];

function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authState, session, logout } = useAdminAuth();

  // Login page renders without the sidebar guard
  const isLoginPage = pathname === "/admin/login";

  // Redirect to login if not authenticated (only for non-login pages)
  useEffect(() => {
    if (!isLoginPage && (authState === "idle" || authState === "unauthorized")) {
      document.cookie = "__admin_authed=; path=/; max-age=0";
      router.replace(`/admin/login?from=${encodeURIComponent(pathname)}`);
    }
    if (authState === "authenticated") {
      document.cookie = "__admin_authed=1; path=/; max-age=3600; SameSite=Strict";
    }
  }, [authState, pathname, router, isLoginPage]);

  // Always render the login page as-is (no sidebar, no auth check)
  if (isLoginPage) return <>{children}</>;

  if (authState === "loading" || authState === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f7f4]">
        <Loader2 className="h-10 w-10 animate-spin text-[#15803d]" />
      </div>
    );
  }

  if (authState !== "authenticated") return null;

  return (
    <div className="flex min-h-screen bg-[#f2f7f4]" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-l border-[#edd1b6] flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-[#edd1b6]">
          <span className="text-xl font-black text-[#15803d]">MOOD</span>
          <p className="text-xs text-[#a08672] mt-0.5">لوحة التحكم الإدارية</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[#15803d] text-white shadow-md shadow-[#15803d]/25"
                    : "text-[#5f3b1f] hover:bg-[#f9f5f0]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[#edd1b6]">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs font-semibold text-[#2b170d] truncate">{session?.displayName ?? session?.email}</p>
            <p className="text-xs text-[#a08672] truncate">{session?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AdminAuthProvider>
  );
}
