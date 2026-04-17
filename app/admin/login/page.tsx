"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const { authState, error, signInWithGoogle, signInWithEmail, session } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"google" | "email">("google");

  // Redirect once authenticated
  useEffect(() => {
    if (authState === "authenticated" && session) {
      // Set the session cookie so middleware lets future navigations through
      document.cookie = "__admin_authed=1; path=/; max-age=3600; SameSite=Strict";
      router.replace(from);
    }
  }, [authState, session, router, from]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email, password);
  };

  const isLoading = authState === "loading";

  return (
    <div className="min-h-screen bg-[#f2f7f4] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm mb-4 overflow-hidden">
            <Image src="/logo.png" alt="Mood" width={48} height={48} className="object-contain" />
          </div>
          <h1 className="text-2xl font-black text-[#2b170d]">لوحة التحكم</h1>
          <p className="text-sm text-[#6f4d34] mt-1">Admin Dashboard · Mood Foods</p>
        </div>

        <div className="rounded-3xl border border-[#edd1b6] bg-white p-8 shadow-sm">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Google sign-in (primary) */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#edd1b6] bg-white px-6 py-3 font-semibold text-[#2b170d] hover:bg-[#f9f5f0] transition disabled:opacity-50 mb-4"
          >
            {isLoading && mode === "google" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            تسجيل الدخول بـ Google
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#edd1b6]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#a08672]">
              <span className="bg-white px-3">أو بالبريد الإلكتروني</span>
            </div>
          </div>

          {/* Email/password sign-in */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#5f3b1f] mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-[#a08672]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  placeholder="moamenelioa@gmail.com"
                  className="w-full rounded-xl border border-[#edd1b6] bg-white py-3 pr-10 pl-4 text-sm text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#5f3b1f] mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-[#a08672]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#edd1b6] bg-white py-3 pr-10 pl-10 text-sm text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 -translate-y-1/2 left-3 text-[#a08672] hover:text-[#5f3b1f]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              onClick={() => setMode("email")}
              disabled={isLoading}
              className="w-full rounded-xl bg-[#15803d] py-3 font-bold text-white shadow-md shadow-[#15803d]/25 hover:bg-[#166534] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && mode === "email" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : "تسجيل الدخول"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#a08672] mt-6">
          الوصول مقتصر على المشرفين المعتمدين فقط
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#15803d]" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
