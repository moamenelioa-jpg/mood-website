"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Save,
  CheckCircle2,
  Building2,
  Smartphone,
  Banknote,
  Zap,
} from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface Settings {
  // Bank Transfer
  bankName?: string;
  accountName?: string;
  iban?: string;
  bankActive?: boolean;
  // Mobile Wallet
  walletNumber?: string;
  walletAccountName?: string;
  walletActive?: boolean;
  // InstaPay
  instapayIdentifier?: string;
  instapayAccountName?: string;
  instapayActive?: boolean;
  // COD
  codActive?: boolean;
  // System
  contactPhone?: string;
  uploadsBucket?: string;
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        on ? "bg-[#15803d]" : "bg-[#d4b9a6]"
      }`}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const { getToken } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    bankActive: true,
    codActive: true,
    walletActive: false,
    instapayActive: false,
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشل تحميل الإعدادات");
      setSettings((prev) => ({ ...prev, ...(data.settings || {}) }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشل الحفظ");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  const inputCls =
    "w-full rounded-xl border border-[#edd1b6] bg-white px-4 py-2.5 text-sm text-[#2b170d] placeholder:text-[#c0a898] focus:outline-none focus:border-[#15803d] transition";
  const labelCls = "block text-xs font-semibold text-[#5f3b1f] mb-1.5";

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-[#2b170d]">إعدادات الدفع</h1>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-white px-4 py-2 text-sm font-semibold text-[#5f3b1f] hover:bg-[#f9f5f0]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Saved banner */}
      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 mb-6">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">تم حفظ الإعدادات بنجاح</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
        </div>
      ) : (
        <div className="space-y-5">

          {/* ── COD ── */}
          <div className="rounded-2xl border border-[#edd1b6] bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0fdf4]">
                  <Banknote className="h-5 w-5 text-[#15803d]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#2b170d]">الدفع عند الاستلام</h2>
                  <p className="text-xs text-[#9a7055]">Cash on Delivery</p>
                </div>
              </div>
              <Toggle
                on={settings.codActive ?? true}
                onChange={(v) => set("codActive", v)}
                label="تفعيل الدفع عند الاستلام"
              />
            </div>
          </div>

          {/* ── Bank Transfer ── */}
          <div className="rounded-2xl border border-[#edd1b6] bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fefce8]">
                  <Building2 className="h-5 w-5 text-[#ca8a04]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#2b170d]">التحويل البنكي</h2>
                  <p className="text-xs text-[#9a7055]">Bank Transfer</p>
                </div>
              </div>
              <Toggle
                on={settings.bankActive ?? true}
                onChange={(v) => set("bankActive", v)}
                label="تفعيل التحويل البنكي"
              />
            </div>
            <div className="space-y-4 pt-2 border-t border-[#f5e9df]">
                <div>
                  <label className={labelCls}>اسم البنك</label>
                  <input
                    className={inputCls}
                    placeholder="مثال: QNB - Qatar National Bank"
                    value={settings.bankName || ""}
                    onChange={(e) => set("bankName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>اسم صاحب الحساب</label>
                  <input
                    className={inputCls}
                    placeholder="الاسم كما هو في الحساب البنكي"
                    value={settings.accountName || ""}
                    onChange={(e) => set("accountName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>رقم IBAN</label>
                  <input
                    className={inputCls}
                    dir="ltr"
                    placeholder="EG12 0037 ..."
                    value={settings.iban || ""}
                    onChange={(e) => set("iban", e.target.value)}
                  />
                </div>
              </div>
          </div>

          {/* ── Mobile Wallet ── */}
          <div className="rounded-2xl border border-[#edd1b6] bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ff]">
                  <Smartphone className="h-5 w-5 text-[#2563eb]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#2b170d]">المحفظة الإلكترونية</h2>
                  <p className="text-xs text-[#9a7055]">Mobile Wallet (فودافون كاش / اتصالات / أورنج)</p>
                </div>
              </div>
              <Toggle
                on={settings.walletActive ?? false}
                onChange={(v) => set("walletActive", v)}
                label="تفعيل المحفظة الإلكترونية"
              />
            </div>
            <div className="space-y-4 pt-2 border-t border-[#f5e9df]">
                <div>
                  <label className={labelCls}>رقم المحفظة</label>
                  <input
                    className={inputCls}
                    dir="ltr"
                    placeholder="01XXXXXXXXX"
                    value={settings.walletNumber || ""}
                    onChange={(e) => set("walletNumber", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>اسم صاحب المحفظة</label>
                  <input
                    className={inputCls}
                    placeholder="الاسم المسجل على المحفظة"
                    value={settings.walletAccountName || ""}
                    onChange={(e) => set("walletAccountName", e.target.value)}
                  />
                </div>
              </div>
          </div>

          {/* ── InstaPay ── */}
          <div className="rounded-2xl border border-[#edd1b6] bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fdf4ff]">
                  <Zap className="h-5 w-5 text-[#9333ea]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#2b170d]">InstaPay</h2>
                  <p className="text-xs text-[#9a7055]">تحويل فوري عبر InstaPay</p>
                </div>
              </div>
              <Toggle
                on={settings.instapayActive ?? false}
                onChange={(v) => set("instapayActive", v)}
                label="تفعيل InstaPay"
              />
            </div>
            <div className="space-y-4 pt-2 border-t border-[#f5e9df]">
                <div>
                  <label className={labelCls}>معرّف InstaPay</label>
                  <input
                    className={inputCls}
                    dir="ltr"
                    placeholder="username@ أو رقم الهاتف"
                    value={settings.instapayIdentifier || ""}
                    onChange={(e) => set("instapayIdentifier", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>اسم صاحب الحساب</label>
                  <input
                    className={inputCls}
                    placeholder="الاسم المسجل على InstaPay"
                    value={settings.instapayAccountName || ""}
                    onChange={(e) => set("instapayAccountName", e.target.value)}
                  />
                </div>
              </div>
          </div>

          {/* ── System ── */}
          <div className="rounded-2xl border border-[#edd1b6] bg-white p-6">
            <h2 className="font-bold text-[#2b170d] mb-4">إعدادات النظام</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>هاتف التواصل</label>
                <input
                  className={inputCls}
                  dir="ltr"
                  placeholder="+201XXXXXXXXX"
                  value={settings.contactPhone || ""}
                  onChange={(e) => set("contactPhone", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-[#15803d] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#15803d]/20 hover:bg-[#166534] disabled:opacity-60 transition"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ الإعدادات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

