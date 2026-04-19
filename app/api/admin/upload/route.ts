import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";
import { getSupabaseServer, getSupabaseBucket } from "@/app/lib/supabase";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function sanitizePath(p: string) {
  return p.replace(/\.\./g, "").replace(/^\/+/, "");
}

export async function POST(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;

    if (!file || !path) {
      return NextResponse.json(
        { success: false, error: "Missing file or path" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Max 10MB" },
        { status: 400 }
      );
    }

    const bucket = getSupabaseBucket();
    const supabase = getSupabaseServer();
    const objectPath = sanitizePath(path);

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Supabase Upload] Error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Upload failed" },
        { status: 500 }
      );
    }

    // Try to get a public URL; if bucket is private, fall back to a long-lived signed URL
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    let publicUrl = pub?.publicUrl || null;
    if (!publicUrl) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(objectPath, 60 * 60 * 24 * 365); // 1 year
      if (signErr || !signed) {
        console.error("[Supabase Signed URL] Error:", signErr);
        return NextResponse.json(
          { success: false, error: "Failed to generate file URL" },
          { status: 500 }
        );
      }
      publicUrl = signed.signedUrl;
    }

    return NextResponse.json({ success: true, url: publicUrl, path: objectPath });
  } catch (err) {
    console.error("[Admin Upload] Error:", err);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const adminOrRes = await requireAdmin(req);
  if (adminOrRes instanceof Response) return adminOrRes;

  try {
    const { path } = await req.json();
    if (!path) {
      return NextResponse.json(
        { success: false, error: "Missing path" },
        { status: 400 }
      );
    }

    const objectPath = sanitizePath(path);
    const bucket = getSupabaseBucket();
    const supabase = getSupabaseServer();

    const { error } = await supabase.storage.from(bucket).remove([objectPath]);
    if (error) {
      console.error("[Supabase Remove] Error:", error);
      return NextResponse.json(
        { success: false, error: "Delete failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Upload Delete] Error:", err);
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 }
    );
  }
}
