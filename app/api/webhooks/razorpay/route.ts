import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getPendingCheckout } from "@/lib/checkoutStore";
import {
  findExistingShopifyOrderByRazorpayId,
  createOrGetShopifyOrder,
} from "@/lib/shopifyOrder";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/razorpay
 * 
 * Asynchronous server-to-server webhook endpoint for Razorpay payment events.
 * Guarantees order fulfillment even if buyer tab closes or drops connection.
 * Idempotent against multiple webhook deliveries and race conditions with client callbacks.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!webhookSecret) {
    console.error("[Razorpay Webhook] Missing RAZORPAY_WEBHOOK_SECRET or RAZORPAY_KEY_SECRET in environment.");
    return NextResponse.json({ error: "Webhook secret not configured on server." }, { status: 500 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    console.warn("[Razorpay Webhook] Request missing x-razorpay-signature header.");
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[Razorpay Webhook] Failed to read request body:", err);
    return NextResponse.json({ error: "Failed to read payload." }, { status: 400 });
  }

  // 1. Verify Razorpay Webhook HMAC-SHA256 signature
  try {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.error("[Razorpay Webhook] Invalid signature match.");
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }
  } catch (sigErr) {
    console.error("[Razorpay Webhook] Signature verification exception:", sigErr);
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  // 2. Parse event payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (jsonErr) {
    return NextResponse.json({ error: "Malformed JSON payload." }, { status: 400 });
  }

  const eventType = payload.event;
  console.log(`[Razorpay Webhook] Received event: ${eventType}`);

  // We process payment.captured and order.paid events
  if (eventType !== "payment.captured" && eventType !== "order.paid") {
    return NextResponse.json({ received: true, ignored: true, reason: "Unhandled event type" });
  }

  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;

  const orderId = orderEntity?.id || paymentEntity?.order_id;
  const paymentId = paymentEntity?.id;

  if (!orderId) {
    console.warn("[Razorpay Webhook] Webhook payload missing order_id.");
    return NextResponse.json({ received: true, ignored: true, reason: "No order ID in payload" });
  }

  // 3. Idempotency Check: see if order already exists in Shopify
  const existingOrder = await findExistingShopifyOrderByRazorpayId(orderId, paymentId);
  if (existingOrder) {
    console.log(`[Razorpay Webhook] Order already recorded in Shopify for ${orderId}: ${existingOrder.name}`);
    return NextResponse.json({ received: true, status: "already_processed", orderNumber: existingOrder.name });
  }

  // 4. Retrieve pending checkout information cached during order initiation
  const pending = getPendingCheckout(orderId);

  if (!pending) {
    console.warn(`[Razorpay Webhook] No pending checkout cached for order ${orderId}. Payment recorded: ${paymentId}`);
    return NextResponse.json({
      received: true,
      status: "pending_checkout_not_found",
      message: "Payment captured, awaiting client callback or manual reconciliation."
    });
  }

  // 5. Authoritatively create order in Shopify idempotently
  try {
    const result = await createOrGetShopifyOrder({
      orderId,
      paymentId: paymentId || `pay_wh_${Date.now()}`,
      lineItems: pending.items,
      contact: pending.contact,
      shippingAddress: pending.shippingAddress,
      billingAddress: pending.billingAddress,
      discountCode: pending.discountCode,
      discountAmount: undefined,
      finalTotal: pending.amountInPaise / 100,
    });

    console.log(`[Razorpay Webhook] Successfully processed and created Shopify order: ${result.orderNumber}`);

    return NextResponse.json({
      received: true,
      status: "success",
      orderNumber: result.orderNumber,
      orderId: result.orderId,
    });
  } catch (err: any) {
    console.error("[Razorpay Webhook] Order creation error:", err);
    return NextResponse.json({ error: "Failed to process order creation from webhook." }, { status: 500 });
  }
}
