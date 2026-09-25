import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { sendMetaPurchaseEvent } from "@/lib/metaConversionsApi";

export const dynamic = "force-dynamic";

/**
 * Verify Shopify Webhook HMAC signature
 */
function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET;
  if (!secret) {
    console.warn("[Shopify Webhook] SHOPIFY_WEBHOOK_SECRET and SHOPIFY_CLIENT_SECRET are not configured.");
    return false;
  }
  if (!hmacHeader) return false;

  const generatedHmac = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  return generatedHmac === hmacHeader;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const topic = req.headers.get("x-shopify-topic");
    const shopDomain = req.headers.get("x-shopify-shop-domain");

    console.log(`[Shopify Webhook] Received webhook: topic=${topic}, shop=${shopDomain}`);

    // Verify cryptographic signature from Shopify
    const isVerified = verifyShopifyHmac(rawBody, hmacHeader);
    if (!isVerified) {
      console.error("[Shopify Webhook] HMAC verification failed. Request rejected.");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    // Only process orders/paid topic
    if (topic && topic !== "orders/paid") {
      console.log(`[Shopify Webhook] Ignoring non-paid topic: ${topic}`);
      return NextResponse.json({ message: "Topic ignored" }, { status: 200 });
    }

    const order = JSON.parse(rawBody);

    if (!order || !order.id) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    console.log(`[Shopify Webhook] Processing orders/paid for Shopify Order ID: ${order.id} (${order.name || "N/A"})`);

    // Extract customer information
    const customer = order.customer || {};
    const shippingAddress = order.shipping_address || order.billing_address || {};

    const email = order.email || customer.email || "";
    const phone = order.phone || customer.phone || shippingAddress.phone || "";
    const firstName = shippingAddress.first_name || customer.first_name || "";
    const lastName = shippingAddress.last_name || customer.last_name || "";
    const city = shippingAddress.city || "";
    const state = shippingAddress.province || shippingAddress.province_code || "";
    const zip = shippingAddress.zip || "";
    const country = shippingAddress.country_code || "in";

    // Extract line items
    const items = (order.line_items || []).map((li: any) => ({
      id: String(li.product_id || li.id),
      variantId: String(li.variant_id || li.id),
      title: li.title,
      price: li.price,
      quantity: li.quantity || 1,
    }));

    // Client details captured by Shopify
    const clientDetails = order.client_details || {};
    const clientIp = clientDetails.browser_ip || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = clientDetails.user_agent || req.headers.get("user-agent");

    // Asynchronously dispatch Purchase event to Meta Conversions API
    // Note: Deduplication key is String(order.id)
    sendMetaPurchaseEvent({
      orderId: String(order.id),
      orderNumber: order.name,
      amount: order.total_price || "0",
      currency: order.currency || "INR",
      items,
      customer: {
        email,
        phone,
        firstName,
        lastName,
        city,
        state,
        zip,
        country,
      },
      reqContext: {
        ip: clientIp,
        userAgent,
        url: order.order_status_url || "https://shopgodsown.com/checkout",
      },
    }).catch((err) => {
      console.error("[Shopify Webhook -> Meta CAPI] Async error sending Purchase event:", err);
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        orderName: order.name,
        message: "orders/paid webhook received and processed successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Shopify Webhook] Unexpected error handling webhook:", error);
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
