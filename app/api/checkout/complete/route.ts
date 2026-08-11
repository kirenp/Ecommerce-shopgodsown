import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { saveServerCustomerAddress } from "@/lib/serverCustomerStore";
import { saveServerCustomerOrder } from "@/lib/serverOrderStore";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN?.startsWith("shpat_") ? process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN : undefined);
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-01";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

/**
 * Verify Razorpay payment signature.
 * Razorpay signs: orderId + "|" + paymentId using HMAC-SHA256 with the key secret.
 */
function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!razorpayKeySecret || !orderId || !paymentId || !signature) return false;
  const expectedSignature = createHmac("sha256", razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expectedSignature === signature;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.checkout);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { items, contact, shippingAddress, billingAddress, amount, paymentId, orderId, razorpaySignature } = body;

    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: "Invalid cart items." }, { status: 400 });
    }

    // ── RAZORPAY SIGNATURE VERIFICATION ──
    // This is the critical security check that prevents fake payment IDs
    if (!razorpayKeySecret) {
      console.warn("RAZORPAY_KEY_SECRET not configured. Skipping signature verification.");
    } else {
      if (!paymentId || !orderId || !razorpaySignature) {
        return NextResponse.json(
          { error: "Payment verification data is incomplete." },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpaySignature(orderId, paymentId, razorpaySignature);
      if (!isValid) {
        console.error("Razorpay signature verification FAILED.", { orderId, paymentId });
        return NextResponse.json(
          { error: "Payment verification failed. This transaction has been rejected." },
          { status: 403 }
        );
      }
      console.log("Razorpay signature verified successfully for order:", orderId);
    }

    const isEmail = contact?.includes("@");
    const email = isEmail ? contact.trim().toLowerCase() : "";
    const phone = isEmail ? (shippingAddress?.phone || "") : contact.trim();

    // Map items to Shopify line items format
    const lineItems = items.map((item: any) => {
      const lineItem: any = {
        title: String(item.title || "").slice(0, 256),
        price: parseFloat(item.price || "0").toFixed(2),
        quantity: Math.max(1, Math.min(Number(item.quantity) || 1, 100)),
      };

      // Add variant ID if available (Extract GID numeric ID if string format)
      if (item.variantId) {
        const rawId = String(item.variantId);
        const numericId = rawId.includes("/") ? rawId.split("/").pop() : rawId;
        if (numericId && !isNaN(Number(numericId))) {
          lineItem.variant_id = Number(numericId);
        }
      }

      // Add variant title if color/size present
      const variantTitleParts = [item.color, item.size].filter(Boolean).map((v: string) => String(v).slice(0, 100));
      if (variantTitleParts.length > 0) {
        lineItem.variant_title = variantTitleParts.join(" / ");
      }

      return lineItem;
    });

    // Format shipping address
    const formatAddress = (addr: any) => ({
      first_name: String(addr?.firstName || "").slice(0, 100),
      last_name: String(addr?.lastName || "").slice(0, 100),
      address1: String(addr?.address || "").slice(0, 256),
      address2: String(addr?.apartment || "").slice(0, 256),
      city: String(addr?.city || "").slice(0, 100),
      province: String(addr?.state || "Kerala").slice(0, 100),
      country: "India",
      zip: String(addr?.pinCode || "").slice(0, 10),
      phone: String(addr?.phone || phone || "").slice(0, 20),
    });

    const formattedShipping = formatAddress(shippingAddress);
    const formattedBilling = formatAddress(billingAddress || shippingAddress);

    // 1. Save shipping address persistently to server store for customer account
    if (email && shippingAddress) {
      try {
        saveServerCustomerAddress(email, {
          id: `addr_checkout_${Date.now()}`,
          firstName: shippingAddress.firstName || "",
          lastName: shippingAddress.lastName || "",
          address: [shippingAddress.address, shippingAddress.apartment].filter(Boolean).join(", "),
          city: shippingAddress.city || "",
          state: shippingAddress.state || "Kerala",
          pinCode: shippingAddress.pinCode || "",
          phone: shippingAddress.phone || phone || "",
          isDefault: true,
        });
      } catch (e) {
        console.warn("Failed to auto-save address to server store:", e);
      }
    }

    let shopifyOrderResult: any = null;
    let shopifyApiError: string | null = null;

    // 2. Call Shopify Admin REST API to create order if token exists
    if (adminToken && domain) {
      try {
        const endpoint = `https://${domain}/admin/api/${apiVersion}/orders.json`;
        let shopifyRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminToken,
          },
          body: JSON.stringify({
            order: {
              email: email || undefined,
              phone: phone || undefined,
              financial_status: "paid",
              fulfillment_status: null,
              send_receipt: true,
              send_fulfillment_receipt: true,
              line_items: lineItems,
              shipping_address: formattedShipping,
              billing_address: formattedBilling,
              note: `Payment completed via Razorpay. Payment ID: ${paymentId || "N/A"}, Razorpay Order ID: ${orderId || "N/A"}`,
              tags: "Razorpay, Online Order, Paid",
            },
          }),
        });

        if (!shopifyRes.ok) {
          const errText = await shopifyRes.text();
          console.warn("Primary Shopify Order Creation failed:", shopifyRes.status, errText);

          // Fallback: Try without variant_id in case variant ID mismatched in Shopify catalog
          const fallbackLineItems = lineItems.map((li: any) => ({
            title: li.title + (li.variant_title ? ` (${li.variant_title})` : ""),
            price: li.price,
            quantity: li.quantity,
          }));

          shopifyRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": adminToken,
            },
            body: JSON.stringify({
              order: {
                email: email || undefined,
                phone: phone || undefined,
                financial_status: "paid",
                fulfillment_status: null,
                send_receipt: true,
                send_fulfillment_receipt: true,
                line_items: fallbackLineItems,
                shipping_address: formattedShipping,
                billing_address: formattedBilling,
                note: `Payment completed via Razorpay. Payment ID: ${paymentId || "N/A"}, Razorpay Order ID: ${orderId || "N/A"}`,
                tags: "Razorpay, Online Order, Paid",
              },
            }),
          });
        }

        if (shopifyRes.ok) {
          const shopifyData = await shopifyRes.json();
          shopifyOrderResult = shopifyData.order;
        } else {
          const errText2 = await shopifyRes.text();
          shopifyApiError = errText2;
          console.error("Shopify Order Creation Error:", shopifyRes.status, errText2);
        }
      } catch (err: any) {
        shopifyApiError = err.message;
        console.error("Shopify Admin Order creation error:", err);
      }
    }

    const orderNumber = shopifyOrderResult?.name || `#GOC-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Save order to server store as fail-safe fallback for Customer Account Dashboard & tracking
    if (email) {
      try {
        saveServerCustomerOrder({
          id: shopifyOrderResult?.id || `local_${Date.now()}`,
          email,
          orderNumber,
          processedAt: new Date().toISOString(),
          totalPrice: parseFloat(amount || "0").toFixed(2),
          fulfillmentStatus: "UNFULFILLED",
          financialStatus: "PAID",
          items: items.map((i: any) => ({
            title: i.title,
            quantity: i.quantity || 1,
            price: parseFloat(i.price || "0").toFixed(2),
            image: i.image || "",
            size: i.size || "",
            color: i.color || "",
          })),
          shippingAddress: formattedShipping,
          paymentId: paymentId || "",
        });
      } catch (e) {
        console.warn("Failed to save order to server order store:", e);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: shopifyOrderResult?.id || `local_${Date.now()}`,
      orderNumber: orderNumber,
      message: shopifyOrderResult
        ? "Order placed and recorded in Shopify successfully."
        : "Order saved to local server store.",
    });

  } catch (error: any) {
    console.error("Order completion error:", error);
    return NextResponse.json(
      { error: "Failed to process order. Please contact support." },
      { status: 500 }
    );
  }
}
