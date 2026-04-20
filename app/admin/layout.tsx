"use client";

import { useEffect, useState } from "react";
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
  Package,
  PlusCircle,
  FileText,
  FilePlus,
  Menu,
  X,
} from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "@/app/lib/admin-auth-context";

const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
    ],
  },
  {
    title: "المنتجات",
    items: [
      { href: "/admin/products", icon: Package, label: "جميع المنتجات" },
      { href: "/admin/products/new", icon: PlusCircle, label: "إضافة منتج" },
      { href: "/admin/categories", icon: Package, label: "الفئات" },
      { href: "/admin/inventory", icon: Package, label: "المخزون" },
    ],
  },
  {
    title: "الطلبات",
    items: [
      { href: "/admin/orders", icon: ShoppingBag, label: "الطلبات" },
      { href: "/admin/receipts", icon: Receipt, label: "إيصالات التحويل" },
    ],
  },
  {
    title: "العملاء",
    items: [
      { href: "/admin/customers", icon: Users, label: "العملاء" },
    ],
  },
  {
    title: "المقالات",
    items: [
      { href: "/admin/articles", icon: FileText, label: "جميع المقالات" },
      { href: "/admin/articles/new", icon: FilePlus, label: "إضافة مقال" },
    ],
  },
  {
    title: "الإعدادات",
    items: [
      { href: "/admin/users", icon: Users, label: "المشرفون" },
      { href: "/admin/settings", icon: LayoutDashboard, label: "إعدادات الدفع" },
      { href: "/admin/uploads", icon: PlusCircle, label: "مركز الرفع" },
    ],
  },
];

// Flatten for matching
const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authState, session, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-6 py-5 border-b border-[#edd1b6] flex items-center justify-between">
        <div>
          <span className="text-xl font-black text-[#15803d]">MOOD</span>
          <p className="text-xs text-[#a08672] mt-0.5">لوحة التحكم الإدارية</p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-lg hover:bg-[#f9f5f0]"
        >
          <X className="h-5 w-5 text-[#5f3b1f]" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#a08672]">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map(({ href, icon: Icon, label }) => {
                const active =
                  pathname === href ||
                  (href !== "/admin" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
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
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#edd1b6]">
        <div className="px-4 py-2 mb-2">
          <p className="text-xs font-semibold text-[#2b170d] truncate">
            {session?.displayName ?? session?.email}
          </p>
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#f2f7f4]" dir="rtl">
      {/* Mobile top bar */}
      <div className="fixed top-0 inset-x-0 z-40 lg:hidden bg-white border-b border-[#edd1b6] px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-1">
          <Menu className="h-6 w-6 text-[#5f3b1f]" />
        </button>
        <span className="text-lg font-black text-[#15803d]">MOOD</span>
        <div className="w-6" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-l border-[#edd1b6] flex-col sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-[#edd1b6] flex flex-col transform transition-transform lg:hidden ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
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
