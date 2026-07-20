import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Graceful check: if keys are not defined, return a mock response so checkouts run simulation mode
    if (!keyId || !keySecret) {
      console.warn("Razorpay API credentials not set. Returning simulation response.");
      return NextResponse.json({
        mock: true,
        message: "Credentials missing in .env.local. Simulating transaction."
      });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Cart is empty or order total is ₹0. Cannot initialize payment." },
        { status: 400 }
      );
    }

    // Razorpay expects amount in paise (Rupees * 100)
    const amountInPaise = Math.round(amount * 100);

    // Basic Auth header for Razorpay API
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Razorpay API error: ${errText}`);
    }

    const orderData = await response.json();

    // Return order details along with the public key ID for front-end SDK configuration
    return NextResponse.json({
      id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: keyId,
    });

  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
