import { NextResponse } from "next/server";
import {
  getFirestoreOrderByNumber,
  updateFirestoreOrder,
} from "@/app/lib/firestore-orders-admin";
import { adminStorage, adminStorageBucket } from "@/app/lib/firebase-admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

function getStorageErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const loweredMessage = message.toLowerCase();

  if (loweredMessage.includes("specified bucket does not exist")) {
    return "Firebase Storage bucket is missing. Create the default bucket in Firebase Console > Storage and verify the bucket name in NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or FIREBASE_ADMIN_STORAGE_BUCKET.";
  }

  if (loweredMessage.includes("permission") || loweredMessage.includes("forbidden")) {
    return "Firebase Storage rejected the upload. Verify the project billing plan, bucket existence, and the service account permissions.";
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

    // --- Upload to Firebase Storage ---
    const timestamp = Date.now();
    // Sanitize filename: keep only alphanumeric, dots, hyphens, underscores
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `payment_proofs/${orderNumber}/${timestamp}-${safeFileName}`;

    if (!adminStorageBucket) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase Storage bucket is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or FIREBASE_ADMIN_STORAGE_BUCKET.",
        },
        { status: 500 }
      );
    }

    const bucket = adminStorage.bucket(adminStorageBucket);
    const storageFile = bucket.file(storagePath);

    const buffer = Buffer.from(await file.arrayBuffer());

    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          orderNumber,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make the file publicly readable via a signed URL (valid 10 years)
    const [signedUrl] = await storageFile.getSignedUrl({
      action: "read",
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
    });

    // --- Update Firestore order ---
    await updateFirestoreOrder(order.id, {
      receiptImageUrl: signedUrl,
      receiptImagePath: storagePath,
      receiptUploadedAt: new Date().toISOString(),
      paymentStatus: "pending_verification",
    });

    return NextResponse.json({ success: true, receiptImageUrl: signedUrl });
  } catch (error) {
    console.error("[API] Receipt upload error:", error);
    return NextResponse.json(
      { success: false, error: getStorageErrorMessage(error) },
      { status: 500 }
    );
  }
}
