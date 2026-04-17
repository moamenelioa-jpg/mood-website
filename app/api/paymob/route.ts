import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const total = items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    const secretKey = process.env.PAYMOB_SECRET_KEY;
    const publicKey = process.env.PAYMOB_PUBLIC_KEY;
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    const apiKey = process.env.PAYMOB_API_KEY;

    if (secretKey && publicKey) {
      console.log("Trying Intention API...");
      
      const intentionRes = await fetch("https://accept.paymob.com/v1/intention/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": secretKey,
        },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          currency: "EGP",
          payment_methods: [Number(integrationId)],
          items: items.map((item: any) => ({
            name: item.name,
            amount: Math.round(item.price * 100),
            quantity: item.quantity,
          })),
          billing_data: {
            apartment: "NA",
            first_name: "Customer",
            last_name: "Mood",
            street: "NA",
            building: "NA",
            phone_number: "+201000000000",
            city: "Cairo",
            country: "EG",
            email: "customer@mood.store",
            floor: "NA",
            state: "Cairo",
          },
          customer: {
            first_name: "Customer",
            last_name: "Mood",
            email: "customer@mood.store",
          },
          redirection_url: (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000") + "/success",
        }),
      });

      const intentionText = await intentionRes.text();
      console.log("Intention API status:", intentionRes.status);
      console.log("Intention API response:", intentionText);

      try {
        const intentionData = JSON.parse(intentionText);
        
        if (intentionRes.ok && intentionData?.client_secret) {
          const paymentUrl = "https://accept.paymob.com/unifiedcheckout/?publicKey=" + publicKey + "&clientSecret=" + intentionData.client_secret;
          console.log("Unified checkout URL:", paymentUrl);
          return NextResponse.json({ url: paymentUrl });
        }
        
        console.log("Intention API failed, trying legacy...", intentionData);
      } catch (e) {
        console.log("Failed to parse intention response, trying legacy...");
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Payment configuration missing. Contact support." },
        { status: 500 }
      );
    }

    console.log("Using Legacy Accept API...");

    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const authData = await authRes.json();
    if (!authRes.ok || !authData?.token) {
      console.error("Auth failed:", authData);
      return NextResponse.json(
        { error: "Payment authentication failed", details: authData },
        { status: 500 }
      );
    }
    console.log("Auth token obtained");

    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authData.token,
        delivery_needed: false,
        amount_cents: Math.round(total * 100),
        currency: "EGP",
        items: items.map((item: any) => ({
          name: item.name,
          amount_cents: Math.round(item.price * 100),
          quantity: item.quantity,
        })),
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData?.id) {
      console.error("Order creation failed:", orderData);
      return NextResponse.json(
        { error: "Failed to create order", details: orderData },
        { status: 500 }
      );
    }
    console.log("Order created:", orderData.id);

    const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: authData.token,
        amount_cents: Math.round(total * 100),
        expiration: 3600,
        order_id: orderData.id,
        billing_data: {
          apartment: "NA",
          email: "customer@mood.store",
          floor: "NA",
          first_name: "Customer",
          street: "NA",
          building: "NA",
          phone_number: "+201000000000",
          shipping_method: "NA",
          postal_code: "11511",
          city: "Cairo",
          country: "EG",
          last_name: "Mood",
          state: "Cairo",
        },
        currency: "EGP",
        integration_id: Number(integrationId),
      }),
    });

    const paymentKeyData = await paymentKeyRes.json();
    if (!paymentKeyRes.ok || !paymentKeyData?.token) {
      console.error("Payment key creation failed:", paymentKeyData);
      return NextResponse.json(
        { error: "Failed to create payment key", details: paymentKeyData },
        { status: 500 }
      );
    }
    console.log("Payment key obtained");

    const iframeId = process.env.PAYMOB_IFRAME_ID;
    if (!iframeId) {
      return NextResponse.json({
        error: "PAYMOB_IFRAME_ID required. Get it from: accept.paymob.com -> Developers -> iframes",
      }, { status: 500 });
    }

    const paymentUrl = "https://accept.paymob.com/api/acceptance/iframes/" + iframeId + "?payment_token=" + paymentKeyData.token;
    console.log("Iframe URL:", paymentUrl);
    
    return NextResponse.json({ url: paymentUrl });

  } catch (error: any) {
    console.error("PAYMOB ERROR:", error);
    return NextResponse.json(
      { error: "Payment error", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
