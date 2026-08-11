import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import nodemailer from "nodemailer";
import { saveServerCustomerAddress } from "@/lib/serverCustomerStore";
import { saveServerCustomerOrder } from "@/lib/serverOrderStore";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { escapeHtml } from "@/lib/security";

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

    // 4. Send order confirmation email to customer & admin notification
    sendOrderEmailAlerts({
      orderNumber,
      email,
      contact,
      amount,
      paymentId,
      items,
      shippingAddress: formattedShipping,
    }).catch((err) => console.error("Async order email send error:", err));

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

/**
 * Helper function to send HTML email receipt to customer & alert to admin via Nodemailer
 */
async function sendOrderEmailAlerts({
  orderNumber,
  email,
  contact,
  amount,
  paymentId,
  items,
  shippingAddress,
}: {
  orderNumber: string;
  email: string;
  contact: string;
  amount: any;
  paymentId: string;
  items: any[];
  shippingAddress: any;
}) {
  const adminEmail = process.env.CONTACT_RECEIVER_EMAIL || "godsownculture@gmail.com";
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  const targetEmail = email || (contact?.includes("@") ? contact.trim() : null);
  if (!smtpUser || !smtpPass || !smtpPass.trim()) {
    console.log("[Order Email] SMTP credentials missing. Skipping automated email delivery.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const formattedAmount = parseFloat(amount || "0").toLocaleString("en-IN");
  const itemsHtml = items.map((i: any) => `
    <tr style="border-bottom: 1px solid #1f1f1f;">
      <td style="padding: 12px 0; color: #ffffff; font-weight: 600;">
        ${escapeHtml(i.title)} ${i.size ? `<span style="color: #888888;">(${escapeHtml(i.size)})</span>` : ""}
      </td>
      <td style="padding: 12px 0; text-align: center; color: #aaaaaa;">x${i.quantity || 1}</td>
      <td style="padding: 12px 0; text-align: right; color: #ffffff; font-weight: 700;">₹${parseFloat(i.price || "0").toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 20px 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #0a0a0a; border: 1px solid #222222; border-radius: 16px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1f1f1f;">
          <h1 style="font-size: 22px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; margin: 0;"><span style="color: #C81E1E;">GODS</span> OWN CULTURE</h1>
          <p style="color: #22c55e; font-size: 11px; font-weight: 700; uppercase; letter-spacing: 0.15em; margin-top: 10px;">✔ Order Confirmed & Paid</p>
        </div>

        <div style="padding: 24px 0;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Thank you for your order!</h2>
          <p style="font-size: 13px; color: #aaaaaa; margin: 0 0 20px 0;">Order <strong>${escapeHtml(orderNumber)}</strong> has been received and is being processed.</p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 1px solid #333333; text-align: left; color: #666666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em;">
                <th style="padding-bottom: 8px;">Item</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="background-color: #141414; padding: 16px; border-radius: 8px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #888888;">Total Amount Paid:</span>
              <span style="font-weight: 800; color: #ffffff;">₹${formattedAmount} INR</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #888888;">Payment ID:</span>
              <span style="color: #aaaaaa; font-family: monospace;">${escapeHtml(paymentId || "N/A")}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #1f1f1f; font-size: 11px; color: #666666;">
          GODS OWN CULTURE &bull; Streetwear Born from Kerala Heritage
        </div>
      </div>
    </body>
    </html>
  `;

  if (targetEmail) {
    await transporter.sendMail({
      from: `"GODS OWN CULTURE" <${smtpUser}>`,
      to: targetEmail,
      subject: `Order Confirmation — ${orderNumber} (GODS OWN CULTURE)`,
      html: customerHtml,
    });
    console.log(`[Order Email] Confirmation sent to customer: ${targetEmail}`);
  }

  // Also send alert copy to admin
  await transporter.sendMail({
    from: `"Store Checkout Alert" <${smtpUser}>`,
    to: adminEmail,
    subject: `🚨 New Paid Order: ${orderNumber} (₹${formattedAmount})`,
    html: customerHtml,
  });
  console.log(`[Order Email] Admin alert sent to: ${adminEmail}`);
}
