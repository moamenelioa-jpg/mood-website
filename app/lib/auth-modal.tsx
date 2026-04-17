"use client";

import { useState } from "react";
import { X, Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/app/lib/language-context";
import { useAuth } from "@/app/lib/auth-context";

export default function AuthModal() {
  const { isArabic } = useLanguage();
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    login,
    signup,
    openLogin,
    openSignup,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === "login";

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (isLogin) {
        const success = login(email, password);
        if (!success) {
          setError(isArabic ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password");
        } else {
          resetForm();
        }
      } else {
        if (!name.trim()) {
          setError(isArabic ? "الاسم مطلوب" : "Name is required");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError(isArabic ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const success = signup(name.trim(), email, password);
        if (!success) {
          setError(isArabic ? "هذا البريد الإلكتروني مسجل بالفعل" : "This email is already registered");
        } else {
          resetForm();
        }
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          closeAuthModal();
          resetForm();
        }}
      />
      <div
        dir="rtl"
        className="relative w-full max-w-md mx-4 rounded-2xl bg-white p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => {
            closeAuthModal();
            resetForm();
          }}
          className="absolute top-4 right-4 rounded-full p-2 text-[#5f3b1f] hover:bg-[#f0e2d0]/60 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#15803d]/10 mb-4">
            <User className="h-7 w-7 text-[#15803d]" />
          </div>
          <h2 className="text-2xl font-black text-[#2d170d]">
            {isLogin
              ? isArabic ? "تسجيل الدخول" : "Sign In"
              : isArabic ? "إنشاء حساب" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-[#6a4f37]">
            {isLogin
              ? isArabic ? "أدخل بياناتك للمتابعة" : "Enter your credentials to continue"
              : isArabic ? "أنشئ حسابك للتعليق على المقالات" : "Create your account to comment on articles"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#5f3b1f]">
                {isArabic ? "الاسم الكامل" : "Full Name"}
              </label>
              <div className="relative">
                <User className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[#9b5a1a]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#e7c9a8] bg-white py-3 ps-10 pe-4 text-sm text-[#2d170d] placeholder:text-[#b8977a] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
                  placeholder={isArabic ? "أحمد محمد" : "John Doe"}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#5f3b1f]">
              {isArabic ? "البريد الإلكتروني" : "Email"}
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[#9b5a1a]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#e7c9a8] bg-white py-3 ps-10 pe-4 text-sm text-[#2d170d] placeholder:text-[#b8977a] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
                placeholder={isArabic ? "example@email.com" : "example@email.com"}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#5f3b1f]">
              {isArabic ? "كلمة المرور" : "Password"}
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[#9b5a1a]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#e7c9a8] bg-white py-3 ps-10 pe-12 text-sm text-[#2d170d] placeholder:text-[#b8977a] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 -translate-y-1/2 end-3 p-1 text-[#9b5a1a] hover:text-[#5f3b1f] transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#15803d] py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-[#15803d]/25 transition hover:bg-[#166534] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : isLogin ? (
              isArabic ? "تسجيل الدخول" : "Sign In"
            ) : (
              isArabic ? "إنشاء حساب" : "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#6a4f37]">
          {isLogin ? (
            <>
              {isArabic ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  openSignup();
                  setError("");
                }}
                className="font-bold text-[#15803d] hover:underline"
              >
                {isArabic ? "سجل الآن" : "Sign Up"}
              </button>
            </>
          ) : (
            <>
              {isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  openLogin();
                  setError("");
                }}
                className="font-bold text-[#15803d] hover:underline"
              >
                {isArabic ? "سجل دخول" : "Sign In"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
