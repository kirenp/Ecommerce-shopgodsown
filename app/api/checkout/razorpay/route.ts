import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { calculateAuthoritativeOrder } from "@/lib/checkoutSecurity";
import { savePendingCheckout } from "@/lib/checkoutStore";
import { validateContact } from "@/lib/emailValidation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.checkout);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { items, discountCode, contact, shippingAddress, billingAddress } = body;

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Graceful check: if keys are not defined, return a mock response so test environments simulate transaction
    if (!keyId || !keySecret) {
      console.warn("Razorpay API credentials not set. Returning simulation response.");
      return NextResponse.json({
        mock: true,
        message: "Credentials missing in .env.local. Simulating transaction."
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { error: "Invalid cart items." },
        { status: 400 }
      );
    }

    // Validate contact and shipping address details
    if (!contact || typeof contact !== "string" || !contact.trim()) {
      return NextResponse.json(
        { error: "Contact email or phone number is required." },
        { status: 400 }
      );
    }
    const contactValidation = validateContact(contact);
    if (!contactValidation.isValid) {
      return NextResponse.json(
        { error: contactValidation.error || "Invalid contact email or phone number." },
        { status: 400 }
      );
    }
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return NextResponse.json(
        { error: "Shipping address is required." },
        { status: 400 }
      );
    }
    const cleanFirstName = String(shippingAddress.firstName || "").trim();
    const cleanLastName = String(shippingAddress.lastName || "").trim();
    const cleanAddress = String(shippingAddress.address || "").trim();
    const cleanCity = String(shippingAddress.city || "").trim();
    const cleanPinCode = String(shippingAddress.pinCode || "").trim().replace(/\D/g, "");
    const cleanPhone = String(shippingAddress.phone || (contact.includes("@") ? "" : contact)).trim().replace(/\D/g, "");

    if (!cleanFirstName) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }
    if (!cleanLastName) {
      return NextResponse.json(
        { error: "Last name is required." },
        { status: 400 }
      );
    }
    if (!cleanAddress) {
      return NextResponse.json(
        { error: "Delivery street address is required." },
        { status: 400 }
      );
    }
    if (!cleanCity) {
      return NextResponse.json(
        { error: "City is required." },
        { status: 400 }
      );
    }
    if (!cleanPinCode || cleanPinCode.length !== 6) {
      return NextResponse.json(
        { error: "A valid 6-digit PIN code is required." },
        { status: 400 }
      );
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "A valid 10-digit phone number is required for shipping." },
        { status: 400 }
      );
    }

    const customerEmail = contact.includes("@") ? contact.trim().toLowerCase() : undefined;

    // SEC-01 & SEC-04 REMEDIATION:
    // Calculate order total entirely server-side using authoritative Shopify catalog prices.
    // Client-supplied `discountAmount` is completely discarded and ignored.
    const calculation = await calculateAuthoritativeOrder({
      items,
      discountCode: typeof discountCode === "string" ? discountCode : undefined,
      customerEmail,
      customerPhone: cleanPhone,
    });

    if (!calculation.isValid) {
      return NextResponse.json(
        { error: calculation.error || "Failed to verify cart items." },
        { status: 400 }
      );
    }

    const amountInPaise = calculation.finalTotalInPaise;

    // Basic Auth header for Razorpay API
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          contact: contact.slice(0, 50),
          email: customerEmail ? customerEmail.slice(0, 50) : "",
          phone: cleanPhone.slice(0, 20),
          discountCode: calculation.appliedDiscount?.code || "",
          subtotal: String(calculation.subtotal),
          discountAmount: String(calculation.discountAmount),
          ship_name: `${cleanFirstName} ${cleanLastName}`.trim().slice(0, 50),
          ship_addr: cleanAddress.slice(0, 100),
          ship_city: cleanCity.slice(0, 40),
          ship_pin: cleanPinCode.slice(0, 10),
          ship_state: String(shippingAddress.state || "Kerala").slice(0, 30),
          item_summary: calculation.lineItems.map(i => `${i.title} (${i.size || 'M'}) x${i.quantity}`).join(", ").slice(0, 150),
          item_variants: JSON.stringify(calculation.lineItems.map(i => ({ v: i.numericVariantId || i.variantId, q: i.quantity, s: i.size, c: i.color }))).slice(0, 250),
        },
      }),
    });

    if (!rzpResponse.ok) {
      const errText = await rzpResponse.text();
      console.error("[Razorpay API] Order creation error:", errText);
      return NextResponse.json(
        { error: "Payment gateway error. Please try again." },
        { status: 502 }
      );
    }

    const orderData = await rzpResponse.json();

    // Cache pending checkout for asynchronous webhook recovery (BUG-01)
    savePendingCheckout(orderData.id, {
      orderId: orderData.id,
      items: calculation.lineItems,
      contact,
      shippingAddress: {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        address: cleanAddress,
        apartment: String(shippingAddress.apartment || "").trim(),
        city: cleanCity,
        state: String(shippingAddress.state || "Kerala").trim(),
        pinCode: cleanPinCode,
        phone: cleanPhone,
      },
      billingAddress: billingAddress || undefined,
      discountCode: calculation.appliedDiscount?.code,
      discountAmount: calculation.discountAmount,
      finalTotal: calculation.finalTotal,
      amountInPaise,
      createdAt: Date.now(),
    });

    // Return order details to frontend Razorpay SDK
    return NextResponse.json({
      id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: keyId,
      serverTotal: calculation.subtotal,
      discountAmount: calculation.discountAmount,
    });

  } catch (error: any) {
    console.error("[Razorpay Order] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
