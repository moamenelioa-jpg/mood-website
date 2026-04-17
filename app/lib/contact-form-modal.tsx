"use client";

import { useState, useEffect } from "react";
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useLanguage } from "@/app/lib/language-context";
import { useContactForm } from "@/app/lib/contact-form-context";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactFormModal() {
  const { isArabic } = useLanguage();
  const { isOpen, closeContactForm } = useContactForm();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContactForm();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeContactForm]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = isArabic ? "الاسم مطلوب" : "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = isArabic
        ? "البريد الإلكتروني مطلوب"
        : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isArabic
        ? "بريد إلكتروني غير صالح"
        : "Invalid email address";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = isArabic ? "الموضوع مطلوب" : "Subject is required";
    }
    if (!formData.message.trim()) {
      newErrors.message = isArabic ? "الرسالة مطلوبة" : "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
          setStatus("idle");
          return;
        }
        throw new Error(data.error || "Failed to send");
      }

      setStatus("success");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });

      // Auto-close after 3 seconds on success
      setTimeout(() => {
        closeContactForm();
        setStatus("idle");
      }, 3000);
    } catch {
      setStatus("error");
      setErrorMessage(
        isArabic
          ? "حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى."
          : "Failed to send your message. Please try again."
      );
    }
  };

  const resetAndClose = () => {
    closeContactForm();
    // Delay reset so animation can play
    setTimeout(() => {
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setErrors({});
      setStatus("idle");
      setErrorMessage("");
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      >
        <div
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.4rem] border border-[#f0dfc7] bg-white shadow-[0_32px_96px_rgba(82,44,12,0.2)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[2.4rem] border-b border-[#f0dfc7] bg-white/95 backdrop-blur-sm px-8 py-5">
            <div>
              <h2 className="text-2xl font-black text-[#2d170d]">
                {isArabic ? "تواصل معنا" : "Contact Us"}
              </h2>
              <p className="mt-1 text-sm text-[#6f4d34]">
                {isArabic
                  ? "أرسل لنا رسالة وسنرد عليك قريبًا"
                  : "Send us a message and we'll get back to you"}
              </p>
            </div>
            <button
              onClick={resetAndClose}
              className="rounded-full p-2 text-[#6f4d34] transition hover:bg-[#f7f0e6]"
              aria-label={isArabic ? "إغلاق" : "Close"}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {/* Success State */}
            {status === "success" && (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#15803d]/10">
                  <CheckCircle2 className="h-10 w-10 text-[#15803d]" />
                </div>
                <h3 className="text-2xl font-black text-[#2d170d]">
                  {isArabic ? "تم الإرسال بنجاح!" : "Message Sent!"}
                </h3>
                <p className="max-w-sm text-[#6a4f37]">
                  {isArabic
                    ? "شكرًا لتواصلك معنا. سنرد عليك في أقرب وقت ممكن."
                    : "Thank you for reaching out. We'll get back to you as soon as possible."}
                </p>
              </div>
            )}

            {/* Error Banner */}
            {status === "error" && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Form */}
            {status !== "success" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2d170d]">
                    <User className="h-4 w-4 text-[#15803d]" />
                    {isArabic ? "الاسم الكامل" : "Full Name"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder={
                      isArabic ? "أدخل اسمك الكامل" : "Enter your full name"
                    }
                    className={`w-full rounded-2xl border bg-[#faf7f3] px-5 py-3.5 text-sm text-[#2d170d] placeholder-[#b8a08a] outline-none transition focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 ${
                      errors.fullName
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                        : "border-[#e8d3b8]"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2d170d]">
                    <Mail className="h-4 w-4 text-[#15803d]" />
                    {isArabic ? "البريد الإلكتروني" : "Email Address"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={
                      isArabic ? "أدخل بريدك الإلكتروني" : "Enter your email"
                    }
                    className={`w-full rounded-2xl border bg-[#faf7f3] px-5 py-3.5 text-sm text-[#2d170d] placeholder-[#b8a08a] outline-none transition focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 ${
                      errors.email
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                        : "border-[#e8d3b8]"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2d170d]">
                    <Phone className="h-4 w-4 text-[#15803d]" />
                    {isArabic ? "رقم الهاتف" : "Phone Number"}{" "}
                    <span className="text-xs text-[#b8a08a]">
                      ({isArabic ? "اختياري" : "optional"})
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={
                      isArabic ? "أدخل رقم هاتفك" : "Enter your phone number"
                    }
                    className="w-full rounded-2xl border border-[#e8d3b8] bg-[#faf7f3] px-5 py-3.5 text-sm text-[#2d170d] placeholder-[#b8a08a] outline-none transition focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2d170d]">
                    <FileText className="h-4 w-4 text-[#15803d]" />
                    {isArabic ? "الموضوع" : "Subject"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={
                      isArabic ? "موضوع الرسالة" : "What is this about?"
                    }
                    className={`w-full rounded-2xl border bg-[#faf7f3] px-5 py-3.5 text-sm text-[#2d170d] placeholder-[#b8a08a] outline-none transition focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 ${
                      errors.subject
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                        : "border-[#e8d3b8]"
                    }`}
                  />
                  {errors.subject && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#2d170d]">
                    <MessageSquare className="h-4 w-4 text-[#15803d]" />
                    {isArabic ? "الرسالة" : "Message"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder={
                      isArabic ? "اكتب رسالتك هنا..." : "Write your message here..."
                    }
                    className={`w-full resize-none rounded-2xl border bg-[#faf7f3] px-5 py-3.5 text-sm text-[#2d170d] placeholder-[#b8a08a] outline-none transition focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20 ${
                      errors.message
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                        : "border-[#e8d3b8]"
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-[1.7rem] bg-[#15803d] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#126e34]"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isArabic ? "جاري الإرسال..." : "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      {isArabic ? "إرسال الرسالة" : "Send Message"}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
