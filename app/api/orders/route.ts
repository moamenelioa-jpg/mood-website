import { NextResponse } from "next/server";
import {
  createFirestoreOrder,
  getFirestoreOrderById,
  getFirestoreOrderByNumber,
  updateFirestoreOrder,
} from "@/app/lib/firestore-orders-admin";
import {
  CartItem,
  CreateOrderResponse,
  Order,
  PaymentMethod,
  EGYPTIAN_GOVERNORATES,
} from "@/app/lib/types";
import { createPaymobIntention, type PaymobBillingData } from "@/app/lib/paymob";

interface CreateOrderRequest {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  governorate?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  shippingFee?: number;
}

export async function POST(req: Request) {
  console.log("[API] POST /api/orders called");
  
  try {
    const body: CreateOrderRequest = await req.json();
    console.log("[API] Request body received:", JSON.stringify(body, null, 2));
    
    const {
      customerName,
      phone,
      email,
      address,
      city,
      governorate,
      notes,
      paymentMethod,
      items,
      shippingFee = 0,
    } = body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!customerName || customerName.trim().length < 2) {
      return NextResponse.json<CreateOrderResponse>(
        { success: false, error: "Full name is required (min 2 characters)" },
        { status: 400 }
      );
    }

    // Egyptian phone validation
    const cleanPhone = phone?.replace(/[\s\-\(\)]/g, "") || "";
    if (!cleanPhone || !/^(\+?2)?01[0125][0-9]{8}$/.test(cleanPhone)) {
      return NextResponse.json<CreateOrderResponse>(
        { success: false, error: "Valid Egyptian phone number is required (e.g., 01012345678)" },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json<CreateOrderResponse>(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!address || address.trim().length < 10) {
      return NextResponse.json<CreateOrderResponse>(
        { success: false, error: "Detailed address is required (min 10 characters)" },
        { status: 400 }
      );
    }

    if (!city || city.trim().length < 2) {
      return NextResponse.json<CreateOrderResponse>(
        { success: false, error: "City is required" },
        { status: 400 }
      );
    }

    if (governorate && !EGYPTIAN_GOVERNORATES.includes(governorate as any)) {
      return NextResponse.json<CreateOrderResponse>(
        { success: false, error: "Invalid governorate" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json<CreateOrderResponse>(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.id || !item.name || !item.price || !item.quantity) {
        return NextResponse.json<CreateOrderResponse>(
          { success: false, error: "Invalid cart item" },
          { status: 400 }
        );
      }
      if (item.quantity < 1 || item.price < 0) {
        return NextResponse.json<CreateOrderResponse>(
          { success: false, error: "Invalid item quantity or price" },
          { status: 400 }
        );
      }
    }

    if (!["cod", "paymob", "bank_transfer"].includes(paymentMethod)) {
      return NextResponse.json<CreateOrderResponse>(
        { success: false, error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // ==========================================
    // CALCULATE TOTALS
    // ==========================================
    
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal + shippingFee;

    // ==========================================
    // CREATE ORDER IN FIRESTORE
    // ==========================================

    const order = await createFirestoreOrder({
      customerName: customerName.trim(),
      phone: cleanPhone,
      email: email?.trim(),
      address: address.trim(),
      city: city.trim(),
      governorate: governorate?.trim(),
      notes: notes?.trim(),
      paymentMethod,
      items,
      subtotal,
      shippingFee,
      total,
    });

    // ==========================================
    // HANDLE PAYMENT METHODS
    // ==========================================

    if (paymentMethod === "cod") {
      // Cash on Delivery - order is ready
      return NextResponse.json<CreateOrderResponse>({
        success: true,
        order: order as unknown as Order,
        redirectUrl: `${baseUrl}/success?order=${order.orderNumber}`,
      });
    }

    if (paymentMethod === "paymob") {
      // Paymob card payment
      const nameParts = customerName.trim().split(/\s+/);
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || "Mood";

      const billing: PaymobBillingData = {
        first_name: firstName,
        last_name: lastName,
        email: email || "customer@mood-gf.com",
        phone_number: cleanPhone.startsWith("+") ? cleanPhone : `+2${cleanPhone}`,
        street: address.trim(),
        city: city.trim(),
        state: governorate?.trim() || city.trim(),
        country: "EG",
        apartment: "NA",
        building: "NA",
        floor: "NA",
      };

      const paymobItems = items.map((item) => ({
        name: item.name,
        amount: Math.round(item.price * 100),
        quantity: item.quantity,
      }));

      const result = await createPaymobIntention({
        amountCents: Math.round(total * 100),
        items: paymobItems,
        billing,
        orderNumber: order.orderNumber,
        redirectUrl: `${baseUrl}/success?order=${order.orderNumber}`,
      });

      // Save Paymob order ID to Firestore
      if (result.paymobOrderId) {
        await updateFirestoreOrder(order.id, {
          paymobOrderId: result.paymobOrderId,
        });
      }

      return NextResponse.json<CreateOrderResponse>({
        success: true,
        order: order as unknown as Order,
        redirectUrl: result.paymentUrl,
      });
    }

    if (paymentMethod === "bank_transfer") {
      // Bank transfer - order saved with pending payment, awaiting proof
      await updateFirestoreOrder(order.id, {
        paymentStatus: "pending_verification",
      });
      return NextResponse.json<CreateOrderResponse>({
        success: true,
        order: order as unknown as Order,
        redirectUrl: `${baseUrl}/success?order=${order.orderNumber}&payment=bank`,
      });
    }

    return NextResponse.json<CreateOrderResponse>(
      { success: false, error: "Unhandled payment method" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("[API] Order creation error!");
    console.error("[API] Error code:", err.code);
    console.error("[API] Error message:", err.message);
    console.error("[API] Full error:", error);
    return NextResponse.json<CreateOrderResponse>(
      {
        success: false,
        error: err.message || "Failed to create order",
      },
      { status: 500 }
    );
  }
}

// GET order by ID or order number
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const orderNumber = searchParams.get("order");

    if (!id && !orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order ID or order number required" },
        { status: 400 }
      );
    }

    let order;
    if (id) {
      order = await getFirestoreOrderById(id);
    } else if (orderNumber) {
      order = await getFirestoreOrderByNumber(orderNumber);
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Strip proof image from public response (large base64), include flag only
    const { bankTransferProof, ...orderData } = order as Record<string, unknown>;
    const hasProof = !!(orderData.receiptImageUrl || bankTransferProof);
    return NextResponse.json({
      success: true,
      order: { ...orderData, hasProof },
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get order" },
      { status: 500 }
    );
  }
}
