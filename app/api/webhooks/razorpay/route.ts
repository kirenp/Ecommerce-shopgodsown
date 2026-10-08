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
  const notes = paymentEntity?.notes || orderEntity?.notes || {};

  let lineItems = pending?.items;
  let contact = pending?.contact || notes.email || notes.phone || notes.contact || paymentEntity?.email || paymentEntity?.contact || "";
  let shippingAddress = pending?.shippingAddress;
  let billingAddress = pending?.billingAddress;
  let discountCode = pending?.discountCode || notes.discountCode;
  let finalTotal = (pending?.amountInPaise || paymentEntity?.amount || 0) / 100;
  let discountAmount: number | undefined = undefined;
  if (typeof pending?.discountAmount === "number" && !isNaN(pending.discountAmount)) {
    discountAmount = pending.discountAmount;
  } else if (notes.discountAmount && !isNaN(Number(notes.discountAmount))) {
    discountAmount = Number(notes.discountAmount);
  } else if (discountCode && lineItems && Array.isArray(lineItems) && finalTotal > 0) {
    const subtotal = lineItems.reduce((acc: number, item: any) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    if (subtotal > finalTotal) {
      discountAmount = Math.round((subtotal - finalTotal) * 100) / 100;
    }
  }

  // Fallback recovery from Razorpay notes if local container restarted
  if (!lineItems && notes.ship_addr) {
    try {
      const parsedVariants = notes.item_variants ? JSON.parse(notes.item_variants) : [];
      if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
        shippingAddress = {
          firstName: notes.ship_name ? notes.ship_name.split(" ")[0] : "Customer",
          lastName: notes.ship_name ? notes.ship_name.split(" ").slice(1).join(" ") : "",
          address: notes.ship_addr,
          city: notes.ship_city || "",
          state: notes.ship_state || "Kerala",
          pinCode: notes.ship_pin || "",
          phone: notes.phone || paymentEntity?.contact || "",
        };
        lineItems = parsedVariants.map((v: any) => ({
          variantId: v.v,
          numericVariantId: typeof v.v === "number" ? v.v : (!isNaN(Number(v.v)) ? Number(v.v) : undefined),
          quantity: v.q || 1,
          size: v.s,
          color: v.c,
          title: "GOD’S OWN CULTURE T-Shirt",
          price: finalTotal,
        }));
      }
    } catch (parseErr) {
      console.warn("[Razorpay Webhook] Failed to reconstruct line items from notes:", parseErr);
    }
  }

  if (!lineItems || !shippingAddress) {
    console.warn(`[Razorpay Webhook] No pending checkout cached for order ${orderId}. Payment recorded: ${paymentId}`);

    // Asynchronously alert store admin via email about unreconciled payment
    const adminEmail = process.env.CONTACT_RECEIVER_EMAIL || "godsownculture@gmail.com";
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    if (adminEmail && smtpUser && smtpPass) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT || "465", 10),
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
        });
        transporter.sendMail({
          from: `"Payment Alert" <${smtpUser}>`,
          to: adminEmail,
          subject: `⚠️ ACTION REQUIRED: Unreconciled Payment Received (₹${finalTotal})`,
          text: `Payment ID: ${paymentId}\nRazorpay Order ID: ${orderId}\nContact: ${contact}\nAmount: ₹${finalTotal}\nPlease check Razorpay dashboard and contact customer to fulfill the order.`,
        }).catch((e: any) => console.error("[Razorpay Webhook] Alert email send error:", e));
      } catch (mailErr) {
        console.error("[Razorpay Webhook] Mailer init error:", mailErr);
      }
    }

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
      lineItems,
      contact,
      shippingAddress,
      billingAddress,
      discountCode,
      discountAmount,
      finalTotal,
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
