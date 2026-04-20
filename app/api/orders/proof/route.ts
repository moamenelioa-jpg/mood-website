import { NextResponse } from "next/server";
import {
  getFirestoreOrderByNumber,
  updateFirestoreOrder,
} from "@/app/lib/firestore-orders-admin";
import { getSupabaseServer, getSupabaseBucket } from "@/app/lib/supabase";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf", // optionally allow PDF receipts
];

function getStorageErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const loweredMessage = message.toLowerCase();

  if (loweredMessage.includes("not set") || loweredMessage.includes("is not set")) {
    return "Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";
  }

  if (loweredMessage.includes("bucket") && loweredMessage.includes("not")) {
    return "Supabase Storage bucket is missing. Create the bucket in Supabase → Storage and set SUPABASE_BUCKET.";
  }

  if (loweredMessage.includes("permission") || loweredMessage.includes("forbidden") || loweredMessage.includes("unauthorized")) {
    return "Supabase Storage rejected the upload. Check bucket policies and the service role key.";
  }

  if (loweredMessage.includes("fetch failed") || loweredMessage.includes("network")) {
    return "Cannot reach Supabase Storage (network/DNS). Verify NEXT_PUBLIC_SUPABASE_URL and internet connectivity.";
  }

  return `Upload failed: ${message}`;
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
        { success: false, error: "Only JPEG, PNG, WebP, HEIC images or PDF are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image must be under 5 MB" },
        { status: 400 }
      );
    }

    // --- Validate order exists & is a manual payment method ---
    const order = await getFirestoreOrderByNumber(orderNumber);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (!["bank_transfer", "wallet", "instapay"].includes(order.paymentMethod)) {
      return NextResponse.json(
        { success: false, error: "Receipt upload is only for bank transfer, wallet, or instapay orders" },
        { status: 400 }
      );
    }

    // --- Supabase connectivity + bucket preflight ---
    const supabase = getSupabaseServer();
    const bucket = getSupabaseBucket();

    try {
      const { data: preflightList, error: preErr } = await supabase.storage
        .from(bucket)
        .list("", { limit: 1 });
      if (preErr) {
        console.error("[Supabase Preflight] Error:", JSON.stringify(preErr));
        return NextResponse.json(
          { success: false, error: getStorageErrorMessage(preErr), detail: JSON.stringify(preErr) },
          { status: 500 }
        );
      }
    } catch (e) {
      console.error("[Supabase Preflight] Exception:", e);
      return NextResponse.json(
        { success: false, error: "Cannot reach Supabase Storage (network)", detail: String(e) },
        { status: 500 }
      );
    }

    // --- Upload to Supabase Storage ---
    const timestamp = Date.now();
    let ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!ext) {
      // Derive extension from MIME type if filename doesn't include one
      if (file.type === "application/pdf") ext = "pdf";
      else if (file.type === "image/png") ext = "png";
      else if (file.type === "image/webp") ext = "webp";
      else if (file.type === "image/heic") ext = "heic";
      else ext = "jpg";
    }
    // Organized folders by payment type and order id
    const objectPath = `receipts/${order.paymentMethod}/${order.id}/receipt-${timestamp}.${ext}`;

    console.log(`[Receipt Upload] bucket=${bucket} path=${objectPath} type=${file.type} size=${file.size}`);

    // Upload the raw File/Blob directly to Supabase (streamed)
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      const raw = JSON.stringify(uploadError);
      console.error("[Supabase Receipt Upload] Error:", raw);
      return NextResponse.json(
        { success: false, error: getStorageErrorMessage(uploadError), detail: raw },
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
      paymentStatus: "under_review",
      orderStatus: "awaiting_payment_review",
      hasProof: true,
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
