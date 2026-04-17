import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getOrderByStripeSession,
  markOrderPaid,
  cancelOrder,
  logNotification,
} from "@/app/lib/orders";
import { PaymentStatuses, OrderStatuses } from "@/app/lib/types";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === "paid") {
        // Find the order
        const order = await getOrderByStripeSession(session.id);
        
        if (order) {
          // Mark order as paid
          await markOrderPaid(order.id, session.payment_intent as string);
          
          // Log notification (for future SMS/Email integration)
          await logNotification(
            order.id,
            "email",
            order.email || order.phone,
            `Your order ${order.orderNumber} has been paid and confirmed.`,
            "pending"
          );
          
          console.log(`Order ${order.orderNumber} marked as paid`);
        } else {
          console.error(`Order not found for session ${session.id}`);
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Find and cancel order if session expired
      const order = await getOrderByStripeSession(session.id);
      
      if (order) {
        await cancelOrder(order.id);
        console.log(`Order ${order.orderNumber} cancelled (session expired)`);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed for intent ${paymentIntent.id}`);
      // You could update order status here if needed
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
