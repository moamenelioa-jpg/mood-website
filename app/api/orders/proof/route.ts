import { NextResponse } from "next/server";
import {
  getFirestoreOrderByNumber,
  updateFirestoreOrder,
} from "@/app/lib/firestore-orders-admin";
import { getSupabaseServer, getSupabaseBucket } from "@/app/lib/supabase";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

function getStorageErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const loweredMessage = message.toLowerCase();

  if (loweredMessage.includes("bucket") && loweredMessage.includes("not")) {
    return "Supabase Storage bucket is missing. Create the bucket in Supabase → Storage and set SUPABASE_BUCKET.";
  }

  if (loweredMessage.includes("permission") || loweredMessage.includes("forbidden") || loweredMessage.includes("unauthorized")) {
    return "Supabase Storage rejected the upload. Check bucket policies and the service role key.";
  }

  return "Failed to upload receipt";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const orderNumber = formData.get("orderNumber") as string | null;
    const file = formData.get("receipt") as File | null;

    // --- Validate order number ---
    if (!orderNumber || typeof orderNumber !== "string") {
      return NextResponse.json(
        { success: false, error: "Order number is required" },
        { status: 400 }
      );
    }

    if (!/^MOOD-\d{8}-\d{3,}$/.test(orderNumber)) {
      return NextResponse.json(
        { success: false, error: "Invalid order number format" },
        { status: 400 }
      );
    }

    // --- Validate file ---
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Receipt image is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, WebP and HEIC images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image must be under 5 MB" },
        { status: 400 }
      );
    }

    // --- Validate order exists & is bank_transfer ---
    const order = await getFirestoreOrderByNumber(orderNumber);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentMethod !== "bank_transfer") {
      return NextResponse.json(
        { success: false, error: "Receipt upload is only for bank transfer orders" },
        { status: 400 }
      );
    }

    // --- Upload to Supabase Storage ---
    const timestamp = Date.now();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const objectPath = `receipts/${orderNumber}/receipt-${timestamp}.${ext}`;

    const supabase = getSupabaseServer();
    const bucket = getSupabaseBucket();

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("[Supabase Receipt Upload] Error:", uploadError);
      return NextResponse.json(
        { success: false, error: getStorageErrorMessage(uploadError) },
        { status: 500 }
      );
    }

    // Prefer public URL when bucket is public; otherwise sign for long view
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    let receiptUrl = pub?.publicUrl || null;
    if (!receiptUrl) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(objectPath, 60 * 60 * 24 * 365); // 1 year
      if (signErr || !signed) {
        console.error("[Supabase Signed URL] Error:", signErr);
        return NextResponse.json(
          { success: false, error: "Failed to generate receipt URL" },
          { status: 500 }
        );
      }
      receiptUrl = signed.signedUrl;
    }

    // --- Update Firestore order ---
    await updateFirestoreOrder(order.id, {
      receiptImageUrl: receiptUrl,
      receiptImagePath: objectPath,
      receiptUploadedAt: new Date().toISOString(),
      paymentStatus: "pending_verification",
    });

    return NextResponse.json({ success: true, receiptImageUrl: receiptUrl });
  } catch (error) {
    console.error("[API] Receipt upload error:", error);
    return NextResponse.json(
      { success: false, error: getStorageErrorMessage(error) },
      { status: 500 }
    );
  }
}
