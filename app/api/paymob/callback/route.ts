import { NextRequest, NextResponse } from "next/server";
import {
  getFirestoreOrderByNumber,
  updateFirestoreOrder,
} from "@/app/lib/firestore-orders-admin";
import { verifyPaymobHmac } from "@/app/lib/paymob";

export const runtime = "nodejs";

function parseJsonSafely(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function parsePaymobCallbackBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  const rawBody = await req.text();
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) {
    return null;
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const parsed = parseJsonSafely(trimmedBody);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(trimmedBody);
    const objValue = params.get("obj");
    if (objValue) {
      const parsedObj = parseJsonSafely(objValue);
      if (parsedObj && typeof parsedObj === "object") {
        return { obj: parsedObj as Record<string, unknown> };
      }
    }

    const payloadValue = params.get("payload") || params.get("data");
    if (payloadValue) {
      const parsedPayload = parseJsonSafely(payloadValue);
      if (parsedPayload && typeof parsedPayload === "object") {
        return parsedPayload as Record<string, unknown>;
      }
    }

    return Object.fromEntries(params.entries());
  }

  const parsed = parseJsonSafely(trimmedBody);
  return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
}

/**
 * Paymob Transaction Callback (POST)
 *
 * Paymob sends a server-to-server POST with the transaction result.
 * We verify the HMAC, then update the order in Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await parsePaymobCallbackBody(req);
    const txn = body?.obj;

    if (!txn) {
      console.error("[Paymob Callback] No transaction object in body", {
        contentType: req.headers.get("content-type"),
      });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log("[Paymob Callback] Transaction ID:", txn.id, "Success:", txn.success);

    // Verify HMAC
    const hmac = new URL(req.url).searchParams.get("hmac") || "";
    if (hmac && !verifyPaymobHmac(txn, hmac)) {
      console.error("[Paymob Callback] HMAC verification failed");
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 403 });
    }

    // Extract order number from extras or merchant_order_id
    const orderNumber =
      txn.order?.extras?.order_number ||
      txn.order?.merchant_order_id ||
      txn.payment_key_claims?.extra?.order_number;

    if (!orderNumber) {
      console.error("[Paymob Callback] No order number found in transaction");
      return NextResponse.json({ error: "No order number" }, { status: 400 });
    }

    const order = await getFirestoreOrderByNumber(orderNumber);
    if (!order) {
      console.error("[Paymob Callback] Order not found:", orderNumber);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order with Paymob data
    const updateData: Record<string, unknown> = {
      paymobTransactionId: String(txn.id),
      paymobOrderId: String(txn.order?.id || ""),
    };

    if (txn.success === true) {
      updateData.paymentStatus = "paid";
      updateData.orderStatus = "confirmed";
      console.log("[Paymob Callback] Payment SUCCESS for order:", orderNumber);
    } else {
      updateData.paymentStatus = "failed";
      console.log("[Paymob Callback] Payment FAILED for order:", orderNumber, "Error:", txn.data?.message);
    }

    await updateFirestoreOrder(order.id, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Paymob Callback] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Paymob Redirect Callback (GET)
 *
 * After payment, Paymob redirects the user here with query params.
 * We verify the result and redirect to the appropriate page.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const success = params.get("success") === "true";
  const txnId = params.get("id");
  const orderId = params.get("order");
  const hmac = params.get("hmac") || "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  console.log("[Paymob Redirect] success:", success, "txnId:", txnId, "orderId:", orderId);

  // Try to find order number
  // Paymob may include it in `merchant_order_id` param or we look it up
  const merchantOrderId = params.get("merchant_order_id") || "";

  // If we have an order param from our redirect URL
  if (merchantOrderId || orderId) {
    const orderNumber = merchantOrderId || orderId || "";
    const order = await getFirestoreOrderByNumber(orderNumber);

    if (order && success) {
      // Update payment status
      await updateFirestoreOrder(order.id, {
        paymentStatus: "paid",
        orderStatus: "confirmed",
        paymobTransactionId: txnId || "",
      });
      return NextResponse.redirect(`${baseUrl}/success?order=${orderNumber}`);
    }

    if (order && !success) {
      await updateFirestoreOrder(order.id, {
        paymentStatus: "failed",
        paymobTransactionId: txnId || "",
      });
      return NextResponse.redirect(`${baseUrl}/cancel?order=${orderNumber}`);
    }
  }

  // Fallback: redirect based on success flag
  if (success) {
    return NextResponse.redirect(`${baseUrl}/success`);
  }
  return NextResponse.redirect(`${baseUrl}/cancel`);
}
