"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon, GripVertical, CheckCircle2 } from "lucide-react";

// ─── Shared types ─────────────────────────────────────────────────────────────

/** A stored image: its public URL and its Supabase storage path. */
export interface ImageEntry {
  url: string;
  path: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hex8(): string {
  return Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, "0");
}

/** Build a storage path with collision-safe naming. */
function buildPath(folder: string, prefix: string, filename: string): string {
  const raw = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? raw : "jpg";
  return `${folder}/${prefix}-${Date.now()}-${hex8()}.${ext}`;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function validate(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return "نوع الملف غير مدعوم — JPEG أو PNG أو WebP فقط";
  if (file.size > MAX_SIZE_BYTES) return "الحجم الأقصى 10 ميجابايت";
  return null;
}

/** Upload via XHR so we can track progress. */
async function uploadFile(
  file: File,
  path: string,
  token: string,
  onProgress: (pct: number) => void
): Promise<ImageEntry> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("path", path);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as { success: boolean; url?: string; path?: string; error?: string };
        if (!data.success) reject(new Error(data.error ?? "Upload failed"));
        else resolve({ url: data.url!, path: data.path! });
      } catch {
        reject(new Error("Invalid server response"));
      }
    };
    xhr.onerror = () => reject(new Error("خطأ في الشبكة"));
    xhr.send(fd);
  });
}

async function deleteFile(path: string, token: string): Promise<void> {
  if (!path) return;
  await fetch("/api/admin/upload", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
}

// ─── Single-image uploader ────────────────────────────────────────────────────

interface ImageUploaderProps {
  label: string;
  /** Current image — pass empty strings when none. */
  current: ImageEntry;
  /** Supabase folder path, e.g. "products/abc123" */
  storagePath: string;
  /** Filename prefix, e.g. "main" */
  storagePrefix: string;
  token: string;
  onUploaded: (entry: ImageEntry) => void;
  onDeleted?: () => void;
  accept?: string;
}

export function ImageUploader({
  label,
  current,
  storagePath,
  storagePrefix,
  token,
  onUploaded,
  onDeleted,
  accept = "image/jpeg,image/png,image/webp",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    setProgress(0);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const path = buildPath(storagePath, storagePrefix, file.name);
      const result = await uploadFile(file, path, token, setProgress);

      // Best-effort: delete the old file from storage
      if (current.path) await deleteFile(current.path, token).catch(() => {});

      onUploaded(result);
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = async () => {
    onDeleted?.();
    setPreview(null);
    if (current.path) await deleteFile(current.path, token).catch(() => {});
  };

  const displayUrl = preview ?? current.url;

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
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/55 gap-1.5">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
              <span className="text-white text-[10px] font-bold">{progress}%</span>
              <div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <>
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition shadow"
              >
                <X className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-0 inset-x-0 rounded-b-xl bg-black/50 text-white text-[10px] py-1 text-center hover:bg-black/70 transition"
              >
                استبدال
              </button>
            </>
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
            <>
              <Loader2 className="h-5 w-5 animate-spin mb-1" />
              <span className="text-[10px]">{progress}%</span>
            </>
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
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ─── Gallery uploader (multi-image + drag-to-reorder) ────────────────────────

interface GalleryUploaderProps {
  images: ImageEntry[];
  productId: string;
  token: string;
  onChange: (images: ImageEntry[]) => void;
}

interface UploadSlot {
  id: string;
  preview: string;
  progress: number;
  error: string | null;
}

const MAX_GALLERY = 8;

export function GalleryUploader({ images, productId, token, onChange }: GalleryUploaderProps) {
  const [slots, setSlots] = useState<UploadSlot[]>([]);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_GALLERY - images.length - slots.length;

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const valid = Array.from(incoming)
        .filter((f) => !validate(f))
        .slice(0, Math.max(0, remaining));
      if (!valid.length) return;

      // Create placeholders immediately for instant feedback
      const newSlots: UploadSlot[] = valid.map((f) => ({
        id: `${Date.now()}-${Math.random()}`,
        preview: URL.createObjectURL(f),
        progress: 0,
        error: null,
      }));
      setSlots((prev) => [...prev, ...newSlots]);

      const uploaded: ImageEntry[] = [];

      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const slot = newSlots[i];
        const idx = images.length + uploaded.length;
        const path = buildPath(`products/${productId}`, `gallery-${idx}`, file.name);

        try {
          const result = await uploadFile(file, path, token, (pct) =>
            setSlots((prev) =>
              prev.map((s) => (s.id === slot.id ? { ...s, progress: pct } : s))
            )
          );
          uploaded.push(result);
          setSlots((prev) =>
            prev.map((s) => (s.id === slot.id ? { ...s, progress: 100 } : s))
          );
        } catch (e) {
          setSlots((prev) =>
            prev.map((s) =>
              s.id === slot.id
                ? { ...s, error: e instanceof Error ? e.message : "فشل الرفع" }
                : s
            )
          );
        }
      }

      // Remove successful slots after a brief visual confirmation delay
      setTimeout(
        () =>
          setSlots((prev) =>
            prev.filter((s) => s.error !== null && s.progress !== 100)
          ),
        900
      );

      // Merge only successfully uploaded entries
      onChange([...images, ...uploaded]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, productId, token, onChange, remaining]
  );

  const removeImage = async (idx: number) => {
    const entry = images[idx];
    onChange(images.filter((_, i) => i !== idx));
    if (entry.path) await deleteFile(entry.path, token).catch(() => {});
  };

  // ── Drag-to-reorder handlers ───────────────────────────────────────────────

  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const onDragOver = (e: React.DragEvent, idx: number) => {
    // Only handle reorder drags (not file drops)
    if (!e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverIdx(idx);
    }
  };

  const onDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
    setDragIdx(null);
    setOverIdx(null);
  };

  const onDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  // ── File-drop on the zone ──────────────────────────────────────────────────

  const onZoneDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files") && remaining > 0) {
      e.preventDefault();
      setDropZoneActive(true);
    }
  };

  const onZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropZoneActive(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[#5f3b1f]">
          صور المعرض ({images.length}/{MAX_GALLERY})
        </p>
        {images.length > 1 && (
          <p className="text-[10px] text-[#a08672]">اسحب الصور لإعادة الترتيب</p>
        )}
      </div>

      <div
        className={`flex flex-wrap gap-3 p-3 rounded-xl border-2 transition-colors min-h-[5.5rem] ${
          dropZoneActive
            ? "border-[#15803d] bg-[#f0faf4]"
            : "border-dashed border-[#c0a898]"
        }`}
        onDragOver={onZoneDragOver}
        onDragLeave={() => setDropZoneActive(false)}
        onDrop={onZoneDrop}
      >
        {/* Saved images */}
        {images.map((entry, idx) => (
          <div
            key={entry.url}
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDrop={(e) => onDrop(e, idx)}
            onDragEnd={onDragEnd}
            className={`relative group cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
              dragIdx === idx ? "opacity-40 scale-95" : ""
            } ${
              overIdx === idx && dragIdx !== idx
                ? "ring-2 ring-[#15803d] ring-offset-1 rounded-lg"
                : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.url}
              alt=""
              className="h-20 w-20 rounded-lg object-cover border border-[#edd1b6] pointer-events-none"
              draggable={false}
            />
            {/* Position badge */}
            <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] rounded px-1 leading-4 pointer-events-none">
              {idx + 1}
            </span>
            {/* Drag handle hint */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none rounded-lg bg-black/10">
              <GripVertical className="h-5 w-5 text-white drop-shadow" />
            </div>
            {/* Delete */}
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow opacity-0 group-hover:opacity-100 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* In-progress upload slots */}
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="relative h-20 w-20 rounded-lg overflow-hidden border border-[#edd1b6] flex-shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slot.preview}
              alt=""
              className="h-full w-full object-cover opacity-50"
              draggable={false}
            />
            {slot.error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 text-white p-1 text-center gap-0.5">
                <X className="h-4 w-4" />
                <span className="text-[9px] leading-tight">{slot.error}</span>
              </div>
            ) : slot.progress === 100 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/80">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-1">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
                <span className="text-white text-[10px] font-semibold">{slot.progress}%</span>
                <div className="w-14 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-200"
                    style={{ width: `${slot.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add-more button */}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center h-20 w-20 rounded-lg border-2 border-dashed border-[#c0a898] hover:border-[#15803d] hover:bg-[#f0faf4] transition text-[#a08672] flex-shrink-0"
          >
            <Upload className="h-4 w-4 mb-1" />
            <span className="text-[10px]">إضافة</span>
          </button>
        )}
      </div>

      {remaining <= 2 && remaining > 0 && (
        <p className="text-[10px] text-[#a08672] mt-1">
          متبقي {remaining} {remaining === 1 ? "صورة" : "صور"}
        </p>
      )}
      {remaining <= 0 && (
        <p className="text-[10px] text-amber-600 mt-1">
          وصلت للحد الأقصى ({MAX_GALLERY} صور)
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

