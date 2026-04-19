"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  label: string;
  currentUrl: string;
  storagePath: string;           // e.g. "products/abc123/main"
  token: string;
  onUploaded: (url: string) => void;
  onDeleted?: () => void;
  accept?: string;
}

export function ImageUploader({
  label,
  currentUrl,
  storagePath,
  token,
  onUploaded,
  onDeleted,
  accept = "image/jpeg,image/png,image/webp",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Client-side validation
    if (file.size > 10 * 1024 * 1024) {
      setError("الحجم الأقصى 10 ميجابايت");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("نوع الملف غير مدعوم");
      return;
    }

    setError(null);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", `${storagePath}.${ext}`);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onUploaded(data.url);
      setPreview(null); // clear local preview — use real URL
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الرفع");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;
    // Optimistic UI — clear immediately
    onDeleted?.();
    setPreview(null);

    // Best-effort: attempt to delete the underlying object from Supabase Storage
    try {
      // Expected public URL formats:
      //  - .../storage/v1/object/public/<bucket>/<path>
      //  - .../storage/v1/object/sign/<bucket>/<path>?token=...
      const u = new URL(currentUrl);
      const ixPublic = u.pathname.indexOf("/object/public/");
      const ixSign = ixPublic === -1 ? u.pathname.indexOf("/object/sign/") : -1;
      let afterPrefix = "";
      if (ixPublic !== -1) afterPrefix = u.pathname.slice(ixPublic + "/object/public/".length);
      else if (ixSign !== -1) afterPrefix = u.pathname.slice(ixSign + "/object/sign/".length);

      if (afterPrefix) {
        // afterPrefix is '<bucket>/<path>' — strip the first segment (bucket)
        const parts = afterPrefix.split("/");
        if (parts.length >= 2) {
          const path = parts.slice(1).join("/");
          await fetch("/api/admin/upload", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ path }),
          });
        }
      }
    } catch {
      // Ignore cleanup failures
    }
  };

  const displayUrl = preview ?? currentUrl;

  return (
    <div>
      <p className="text-xs font-semibold text-[#5f3b1f] mb-2">{label}</p>
      {displayUrl ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt={label}
            className="h-28 w-28 rounded-xl object-cover border border-[#edd1b6]"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition shadow"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {/* Replace button */}
          {!uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-0 inset-x-0 rounded-b-xl bg-black/50 text-white text-[10px] py-1 text-center hover:bg-black/70 transition"
            >
              استبدال
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center h-28 w-28 rounded-xl border-2 border-dashed border-[#c0a898] hover:border-[#15803d] hover:bg-[#f0faf4] transition text-[#a08672] disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6 mb-1" />
              <span className="text-xs">رفع صورة</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ── Multi-image gallery uploader ──────────────────────────────

interface GalleryUploaderProps {
  images: string[];
  productId: string;
  token: string;
  onChange: (images: string[]) => void;
}

export function GalleryUploader({ images, productId, token, onChange }: GalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const toUpload = Array.from(files).slice(0, 8 - images.length); // max 8 gallery images
    if (!toUpload.length) return;

    setUploading(true);
    setError(null);
    const uploaded: string[] = [];

    for (const file of toUpload) {
      if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) continue;
      try {
        const ext = file.name.split(".").pop() ?? "jpg";
        const filename = `gallery_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", `products/${productId}/gallery/${filename}`);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.success) uploaded.push(data.url);
      } catch {
        // skip failed file
      }
    }

    onChange([...images, ...uploaded]);
    setUploading(false);
  };

  const removeImage = (url: string) => {
    onChange(images.filter((u) => u !== url));
  };

  return (
    <div>
      <p className="text-xs font-semibold text-[#5f3b1f] mb-2">
        صور المعرض ({images.length}/8)
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-[#edd1b6]" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < 8 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center h-20 w-20 rounded-lg border-2 border-dashed border-[#c0a898] hover:border-[#15803d] hover:bg-[#f0faf4] transition text-[#a08672] disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
