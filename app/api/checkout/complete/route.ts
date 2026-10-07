import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import {
  calculateAuthoritativeOrder,
  verifyRazorpaySignature,
  verifyRazorpayPaymentCapture,
} from "@/lib/checkoutSecurity";
import { createOrGetShopifyOrder } from "@/lib/shopifyOrder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.checkout);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const {
      items,
      contact,
      shippingAddress,
      billingAddress,
      paymentId,
      orderId,
      razorpaySignature,
      discountCode,
    } = body;

    // Validate essential inputs
    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: "Invalid cart items." }, { status: 400 });
    }

    if (!paymentId || !orderId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Payment verification data is incomplete." },
        { status: 400 }
      );
    }

    if (!contact || typeof contact !== "string" || !contact.trim()) {
      return NextResponse.json(
        { error: "Customer contact information is required." },
        { status: 400 }
      );
    }

    if (!shippingAddress || typeof shippingAddress !== "object") {
      return NextResponse.json(
        { error: "Shipping address is required." },
        { status: 400 }
      );
    }

    // ── 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION ──
    const isSignatureValid = verifyRazorpaySignature(orderId, paymentId, razorpaySignature);
    if (!isSignatureValid) {
      console.error("[Order Complete] Razorpay signature verification FAILED.", { orderId, paymentId });
      return NextResponse.json(
        { error: "Payment verification failed. Invalid cryptographic signature." },
        { status: 403 }
      );
    }

    const customerEmail = contact.includes("@") ? contact.trim().toLowerCase() : undefined;
    const cleanPhone = String(shippingAddress.phone || (contact.includes("@") ? "" : contact) || "").trim().replace(/\D/g, "");

    // ── 2. AUTHORITATIVE PRICE & DISCOUNT RE-CALCULATION (SEC-01 & SEC-02) ──
    // Never trust client-supplied prices (item.price) or client-supplied amounts (amount, discountAmount).
    const calculation = await calculateAuthoritativeOrder({
      items,
      discountCode: typeof discountCode === "string" ? discountCode : undefined,
      customerEmail,
      customerPhone: cleanPhone,
    });

    if (!calculation.isValid) {
      console.error("[Order Complete] Cart items could not be verified:", calculation.error);
      return NextResponse.json(
        { error: calculation.error || "Failed to verify cart pricing." },
        { status: 400 }
      );
    }

    // ── 3. INDEPENDENT RAZORPAY PAYMENT VERIFICATION (SEC-02) ──
    // Query Razorpay Payments API server-side to confirm payment is captured and matches exact paise.
    const paymentCheck = await verifyRazorpayPaymentCapture({
      paymentId,
      orderId,
      expectedAmountInPaise: calculation.finalTotalInPaise,
    });

    if (!paymentCheck.verified) {
      console.error("[Order Complete] Razorpay payment verification rejected:", paymentCheck.error);
      return NextResponse.json(
        { error: paymentCheck.error || "Payment verification failed." },
        { status: 400 }
      );
    }

    // ── 4. IDEMPOTENT ORDER CREATION IN SHOPIFY ──
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");
    const fbp = req.cookies.get("_fbp")?.value || null;
    const fbc = req.cookies.get("_fbc")?.value || null;
    const referer = req.headers.get("referer");

    const orderResult = await createOrGetShopifyOrder({
      orderId,
      paymentId,
      lineItems: calculation.lineItems,
      contact,
      shippingAddress,
      billingAddress,
      discountCode: calculation.appliedDiscount?.code,
      discountAmount: calculation.discountAmount,
      finalTotal: calculation.finalTotal,
      reqContext: {
        ip: clientIp,
        userAgent,
        fbp,
        fbc,
        referer,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      orderNumber: orderResult.orderNumber,
      eventId: orderResult.eventId,
      message: orderResult.alreadyProcessed
        ? "Order already recorded."
        : "Order placed and recorded in Shopify successfully.",
    });

  } catch (error: any) {
    console.error("[Order Complete] Unexpected completion error:", error);
    return NextResponse.json(
      { error: "Failed to process order completion. Please contact support." },
      { status: 500 }
    );
  }
}
