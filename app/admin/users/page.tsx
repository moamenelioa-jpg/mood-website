"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-auth-context";

interface AdminUser {
  uid: string;
  email: string;
  displayName: string | null;
  addedAt: string;
  addedBy: string | null;
}

export default function AdminUsersPage() {
  const { getToken, session } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to load admins");
      setAdmins(data.admins ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to add admin");

      setNewEmail("");
      await fetchAdmins();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveAdmin = async (uid: string, email: string) => {
    if (!confirm(`هل أنت متأكد من إزالة صلاحيات المشرف من ${email}؟`)) return;
    setRemovingUid(uid);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const res = await fetch(`/api/admin/users?uid=${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Failed to remove admin");

      setAdmins((prev) => prev.filter((a) => a.uid !== uid));
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setRemovingUid(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#2b170d]">إدارة المشرفين</h1>
          <p className="text-sm text-[#a08672] mt-1">إضافة وإزالة صلاحيات المشرف</p>
        </div>
        <button
          onClick={fetchAdmins}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[#edd1b6] bg-white px-4 py-2 text-sm font-semibold text-[#5f3b1f] hover:bg-[#f9f5f0] transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Add admin form */}
      <div className="rounded-2xl border border-[#edd1b6] bg-white p-6 mb-6">
        <h2 className="font-bold text-[#2b170d] mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-[#15803d]" />
          إضافة مشرف جديد
        </h2>

        {addError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {addError}
          </div>
        )}

        <form onSubmit={handleAddAdmin} className="flex gap-3">
          <div className="relative flex-1">
            <Mail className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-[#a08672]" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              dir="ltr"
              placeholder="email@example.com"
              className="w-full rounded-xl border border-[#edd1b6] bg-white py-3 pr-10 pl-4 text-sm text-[#2b170d] placeholder:text-[#a08672] focus:border-[#15803d] focus:outline-none focus:ring-2 focus:ring-[#15803d]/20"
            />
          </div>
          <button
            type="submit"
            disabled={addLoading || !newEmail.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#15803d] px-5 py-3 text-sm font-bold text-white hover:bg-[#166534] transition disabled:opacity-50"
          >
            {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            إضافة
          </button>
        </form>

        <p className="text-xs text-[#a08672] mt-3">
          يجب أن يكون المستخدم مسجلاً في Firebase Auth أولاً قبل منحه صلاحيات المشرف.
        </p>
      </div>

      {/* Admins list */}
      <div className="rounded-2xl border border-[#edd1b6] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#edd1b6]">
          <h2 className="font-bold text-[#2b170d] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#15803d]" />
            المشرفون الحاليون ({admins.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#15803d]" />
          </div>
        ) : admins.length === 0 ? (
          <div className="py-12 text-center text-[#a08672]">لا يوجد مشرفون</div>
        ) : (
          <ul className="divide-y divide-[#edd1b6]/60">
            {admins.map((admin) => {
              const isSelf = admin.uid === session?.uid;
              return (
                <li key={admin.uid} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[#f0faf4] flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-[#15803d]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#2b170d] text-sm truncate">
                        {admin.displayName ?? admin.email}
                        {isSelf && (
                          <span className="mr-2 text-xs text-[#15803d] font-normal">(أنت)</span>
                        )}
                      </p>
                      <p className="text-xs text-[#a08672] dir-ltr">{admin.email}</p>
                      <p className="text-xs text-[#a08672]">
                        أُضيف: {new Date(admin.addedAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.uid, admin.email)}
                      disabled={removingUid === admin.uid}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                    >
                      {removingUid === admin.uid ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      إزالة
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
