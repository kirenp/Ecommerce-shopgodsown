import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/security";
import { sendMetaPurchaseEvent } from "@/lib/metaConversionsApi";
import { removePendingCheckout } from "@/lib/checkoutStore";
import { saveServerCustomerAddress } from "@/lib/serverCustomerStore";
import { saveServerCustomerOrder } from "@/lib/serverOrderStore";
import {
  getProcessedOrder,
  saveProcessedOrder,
  getInFlightOrderPromise,
  setInFlightOrderPromise,
  clearInFlightOrderPromise,
  acquireOrderLock,
  releaseOrderLock,
  waitForProcessedOrder,
} from "@/lib/processedOrderStore";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN?.startsWith("shpat_") ? process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN : undefined);
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-01";

// Indian state to ISO 3166-2 province code mapping for Shopify address resolution
const STATE_TO_CODE: Record<string, string> = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  "Assam": "AS",
  "Bihar": "BR",
  "Chhattisgarh": "CG",
  "Goa": "GA",
  "Gujarat": "GJ",
  "Haryana": "HR",
  "Himachal Pradesh": "HP",
  "Jharkhand": "JH",
  "Karnataka": "KA",
  "Kerala": "KL",
  "Madhya Pradesh": "MP",
  "Maharashtra": "MH",
  "Manipur": "MN",
  "Meghalaya": "ML",
  "Mizoram": "MZ",
  "Nagaland": "NL",
  "Odisha": "OR",
  "Punjab": "PB",
  "Rajasthan": "RJ",
  "Sikkim": "SK",
  "Tamil Nadu": "TN",
  "Telangana": "TG",
  "Tripura": "TR",
  "Uttar Pradesh": "UP",
  "Uttarakhand": "UK",
  "West Bengal": "WB",
  "Andaman and Nicobar Islands": "AN",
  "Chandigarh": "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DH",
  "Delhi": "DL",
  "Jammu and Kashmir": "JK",
  "Ladakh": "LA",
  "Lakshadweep": "LD",
  "Puducherry": "PY",
};

// In-memory idempotency cache and in-flight promise locks
const processedOrders = new Map<string, any>();
const inFlightOrders = new Map<string, Promise<any>>();

/**
 * Format shipping or billing address to conform to Shopify REST API expectations.
 * Shopify drops address object if last_name is empty string ("").
 */
export function formatShopifyAddress(addr: any): any {
  const rawFirst = String(addr?.firstName || addr?.first_name || "").trim();
  const rawLast = String(addr?.lastName || addr?.last_name || "").trim();

  let firstName = rawFirst;
  let lastName = rawLast;

  if (!lastName && firstName.includes(" ")) {
    const parts = firstName.split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  if (!lastName) {
    lastName = "Customer";
  }

  const stateStr = String(addr?.state || addr?.province || "Kerala").trim();
  const provinceCode = STATE_TO_CODE[stateStr] || undefined;
  const pinCode = String(addr?.pinCode || addr?.zip || "").replace(/\D/g, "").slice(0, 6);
  const phone = String(addr?.phone || "").replace(/\D/g, "").slice(-10);

  return {
    first_name: firstName,
    last_name: lastName,
    address1: String(addr?.address || addr?.address1 || "").trim(),
    address2: addr?.apartment || addr?.address2 ? String(addr.apartment || addr.address2).trim() : undefined,
    city: String(addr?.city || "").trim(),
    province: stateStr,
    province_code: provinceCode,
    country: "India",
    country_code: "IN",
    zip: pinCode,
    phone: phone || undefined,
  };
}

/**
 * Checks whether an order with this Razorpay order ID or payment ID has already been created in Shopify.
 * Idempotency check.
 */
export async function findExistingShopifyOrderByRazorpayId(orderId: string, paymentId?: string): Promise<any | null> {
  // 1. Fast check against in-memory & persistent local store
  const localRecord = getProcessedOrder(orderId, paymentId);
  if (localRecord) {
    return {
      id: localRecord.id,
      name: localRecord.name,
      financialStatus: localRecord.financialStatus || "PAID",
    };
  }

  if (orderId && processedOrders.has(orderId)) {
    return processedOrders.get(orderId);
  }
  if (paymentId && processedOrders.has(paymentId)) {
    return processedOrders.get(paymentId);
  }

  if (!adminToken || !domain) return null;

  const tagQueries = [];
  if (orderId) tagQueries.push(`tag:rzp_order_${orderId}`);
  if (paymentId) tagQueries.push(`tag:rzp_pay_${paymentId}`);

  if (tagQueries.length === 0) return null;

  const queryStr = tagQueries.join(" OR ");
  const query = `
    query findOrderByTag($queryStr: String!) {
      orders(first: 1, query: $queryStr) {
        edges {
          node {
            id
            name
            displayFinancialStatus
            displayFulfillmentStatus
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(`https://${domain}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({ query, variables: { queryStr } }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const node = data?.data?.orders?.edges?.[0]?.node;
      if (node) {
        const orderSummary = {
          id: node.id,
          name: node.name,
          financialStatus: node.displayFinancialStatus || "PAID",
        };
        if (orderId) processedOrders.set(orderId, orderSummary);
        if (paymentId) processedOrders.set(paymentId, orderSummary);
        saveProcessedOrder(
          {
            id: String(node.id),
            name: String(node.name),
            financialStatus: node.displayFinancialStatus || "PAID",
            orderId,
            paymentId,
            processedAt: Date.now(),
          },
          orderId,
          paymentId
        );
        return orderSummary;
      }
    }
  } catch (err) {
    console.warn("[ShopifyOrder] Existing order lookup error:", err);
  }

  return null;
}

/**
 * Creates or retrieves a Shopify order for a confirmed Razorpay payment.
 * Ensures strict idempotency: if called concurrently or repeatedly (webhook + browser callback),
 * only one Shopify order is created.
 */
export async function createOrGetShopifyOrder({
  orderId,
  paymentId,
  lineItems,
  contact,
  shippingAddress,
  billingAddress,
  discountCode,
  discountAmount,
  finalTotal,
  reqContext,
}: {
  orderId: string;
  paymentId: string;
  lineItems: any[];
  contact: string;
  shippingAddress: any;
  billingAddress?: any;
  discountCode?: string;
  discountAmount?: number;
  finalTotal: number;
  reqContext?: {
    ip?: string | null;
    userAgent?: string | null;
    fbp?: string | null;
    fbc?: string | null;
    referer?: string | null;
  };
}): Promise<{
  success: boolean;
  orderId: string;
  orderNumber: string;
  eventId: string;
  alreadyProcessed: boolean;
  error?: string;
}> {
  // 1. Idempotency check: see if already processed
  const existingOrder = await findExistingShopifyOrderByRazorpayId(orderId, paymentId);
  if (existingOrder) {
    console.log(`[ShopifyOrder] Order already exists for Razorpay order ${orderId}: ${existingOrder.name}`);
    return {
      success: true,
      orderId: existingOrder.id,
      orderNumber: existingOrder.name,
      eventId: String(existingOrder.id || orderId),
      alreadyProcessed: true,
    };
  }

  // 2. In-flight lock in memory: prevent concurrent race between webhook and client callback
  const activeFlight = getInFlightOrderPromise(orderId, paymentId);
  if (activeFlight) {
    console.log(`[ShopifyOrder] In-flight order creation detected for ${orderId || paymentId}. Awaiting result...`);
    return await activeFlight;
  }

  // 3. Multi-instance lock check: if another worker holds the lock, wait for it to complete
  const lockAcquired = acquireOrderLock(orderId);
  if (!lockAcquired) {
    console.log(`[ShopifyOrder] Another worker holds lock for order ${orderId}. Waiting for completion...`);
    const finishedOrder = await waitForProcessedOrder(orderId, paymentId, 15000);
    if (finishedOrder) {
      console.log(`[ShopifyOrder] Awaited order completed by another worker: ${finishedOrder.name}`);
      return {
        success: true,
        orderId: finishedOrder.id,
        orderNumber: finishedOrder.name,
        eventId: String(finishedOrder.id || orderId),
        alreadyProcessed: true,
      };
    }
    // Timeout or stale lock: proceed to try lock again
    acquireOrderLock(orderId);
  }

  const executionPromise = (async () => {
    try {
      const isEmail = contact?.includes("@");
      const email = isEmail ? contact.trim().toLowerCase() : "";
      const phone = isEmail ? (shippingAddress?.phone || "") : contact.trim();

      const formattedShipping = formatShopifyAddress(shippingAddress);
      const formattedBilling = billingAddress ? formatShopifyAddress(billingAddress) : formattedShipping;

      // Map line items for Shopify REST API
      const shopifyLineItems = lineItems.map((item: any) => {
        const li: any = {
          title: String(item.title || "").slice(0, 256),
          price: Number(item.price).toFixed(2),
          quantity: Math.max(1, Math.min(Number(item.quantity) || 1, 100)),
        };

        if (item.numericVariantId) {
          li.variant_id = item.numericVariantId;
        } else if (item.variantId) {
          const rawId = String(item.variantId);
          const numericId = rawId.includes("/") ? rawId.split("/").pop() : rawId;
          if (numericId && !isNaN(Number(numericId))) {
            li.variant_id = Number(numericId);
          }
        }

        const variantParts = [item.color, item.size].filter(Boolean);
        if (variantParts.length > 0) {
          li.variant_title = variantParts.join(" / ");
        }

        return li;
      });

      const safeDiscountAmount = (typeof discountAmount === "number" && !isNaN(discountAmount) && discountAmount > 0)
        ? Math.round(discountAmount * 100) / 100
        : 0;

      const formattedDiscount = (discountCode && safeDiscountAmount > 0)
        ? [{
            code: String(discountCode).toUpperCase(),
            amount: safeDiscountAmount.toFixed(2),
            type: "fixed_amount",
          }]
        : undefined;

      const discountNotePart = discountCode
        ? (safeDiscountAmount > 0
            ? `Discount Code Applied: ${discountCode.toUpperCase()} (-₹${safeDiscountAmount.toFixed(2)})`
            : `Discount Code Applied: ${discountCode.toUpperCase()}`)
        : null;

      const orderNotes = [
        `Razorpay Order ID: ${orderId}`,
        `Razorpay Payment ID: ${paymentId}`,
        `Payment Method: Online (Razorpay)`,
        discountNotePart,
      ].filter(Boolean).join(" | ");

      const orderTags = `Razorpay, Online Order, Paid, rzp_order_${orderId}, rzp_pay_${paymentId}`;

      let shopifyOrderResult: any = null;

      if (adminToken && domain) {
        const endpoint = `https://${domain}/admin/api/${apiVersion}/orders.json`;

        const orderPayload = {
          order: {
            email: email || undefined,
            phone: phone || formattedShipping.phone || undefined,
            financial_status: "paid",
            fulfillment_status: null,
            send_receipt: true,
            send_fulfillment_receipt: true,
            line_items: shopifyLineItems,
            discount_codes: formattedDiscount,
            total_discounts: safeDiscountAmount > 0 ? safeDiscountAmount.toFixed(2) : undefined,
            transactions: [
              {
                kind: "sale",
                status: "success",
                amount: Number(finalTotal).toFixed(2),
                gateway: "Razorpay",
              }
            ],
            customer: {
              first_name: formattedShipping.first_name,
              last_name: formattedShipping.last_name,
              email: email || undefined,
              phone: phone || formattedShipping.phone || undefined,
            },
            shipping_address: formattedShipping,
            billing_address: formattedBilling,
            note: orderNotes,
            note_attributes: [
              { name: "razorpay_order_id", value: orderId },
              { name: "razorpay_payment_id", value: paymentId },
            ],
            tags: orderTags,
          },
        };

        let shopifyRes = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminToken,
          },
          body: JSON.stringify(orderPayload),
        });

        if (!shopifyRes.ok) {
          const errText = await shopifyRes.text();
          console.warn("[ShopifyOrder] Order creation attempt 1 failed:", shopifyRes.status, errText);

          // Build fallback line items (without variant_id if variant was mismatched)
          const fallbackLineItems = shopifyLineItems.map((li: any) => ({
            title: li.title + (li.variant_title ? ` (${li.variant_title})` : ""),
            price: li.price,
            quantity: li.quantity,
          }));

          // Attempt 2: If customer email/phone conflict (e.g. 422 has already been taken), omit customer object
          // Shopify automatically matches existing customer by top-level email/phone
          const isCustomerConflict = errText.includes("already been taken") || errText.includes("customer");
          const fallbackPayload: any = {
            order: {
              ...orderPayload.order,
              ...(isCustomerConflict ? { customer: undefined } : {}),
            },
          };

          shopifyRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": adminToken,
            },
            body: JSON.stringify(fallbackPayload),
          });

          // Attempt 3: If still failing, strip customer AND use fallback line items (and strip email if Shopify complained)
          if (!shopifyRes.ok) {
            const errText2 = await shopifyRes.text();
            console.warn("[ShopifyOrder] Order creation attempt 2 failed:", shopifyRes.status, errText2);

            const isEmailError = errText2.toLowerCase().includes("email");
            const safePayload = {
              order: {
                ...orderPayload.order,
                customer: undefined,
                ...(isEmailError ? { email: undefined, note: `${orderNotes} | Customer Email (Shopify rejected): ${email}` } : {}),
                line_items: fallbackLineItems,
              },
            };

            shopifyRes = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": adminToken,
              },
              body: JSON.stringify(safePayload),
            });

            // Attempt 4: If still failing and email might be the culprit, strip email completely
            if (!shopifyRes.ok) {
              const errText3 = await shopifyRes.text();
              console.warn("[ShopifyOrder] Order creation attempt 3 failed:", shopifyRes.status, errText3);
              if (errText3.toLowerCase().includes("email")) {
                const noEmailPayload = {
                  order: {
                    ...orderPayload.order,
                    email: undefined,
                    customer: undefined,
                    line_items: fallbackLineItems,
                    note: `${orderNotes} | Customer Email (Shopify rejected): ${email}`,
                  },
                };
                shopifyRes = await fetch(endpoint, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": adminToken,
                  },
                  body: JSON.stringify(noEmailPayload),
                });
              }
            }
          }
        }

        if (shopifyRes.ok) {
          const shopifyData = await shopifyRes.json();
          shopifyOrderResult = shopifyData.order;
        } else {
          const errText = await shopifyRes.text();
          console.error("[ShopifyOrder] Shopify Admin order creation error:", shopifyRes.status, errText);
        }
      }

      const orderNumber = shopifyOrderResult?.name || `#GOC-${Math.floor(100000 + Math.random() * 900000)}`;
      const confirmedOrderId = shopifyOrderResult?.id ? String(shopifyOrderResult.id) : `local_${Date.now()}`;
      const eventId = String(shopifyOrderResult?.id || orderId || orderNumber);

      // Record in idempotency cache
      const orderSummary = {
        id: confirmedOrderId,
        name: orderNumber,
        financialStatus: "PAID",
      };
      processedOrders.set(orderId, orderSummary);
      processedOrders.set(paymentId, orderSummary);
      saveProcessedOrder(
        {
          id: confirmedOrderId,
          name: orderNumber,
          financialStatus: "PAID",
          orderId,
          paymentId,
          processedAt: Date.now(),
        },
        orderId,
        paymentId
      );

      // Save customer address & order fallback safely
      if (email) {
        try {
          saveServerCustomerAddress(email, {
            id: `addr_${Date.now()}`,
            firstName: formattedShipping.first_name,
            lastName: formattedShipping.last_name,
            address: [formattedShipping.address1, formattedShipping.address2].filter(Boolean).join(", "),
            city: formattedShipping.city,
            state: formattedShipping.province,
            pinCode: formattedShipping.zip,
            phone: formattedShipping.phone,
            isDefault: true,
          });

          saveServerCustomerOrder({
            id: confirmedOrderId,
            email,
            orderNumber,
            processedAt: new Date().toISOString(),
            totalPrice: finalTotal.toFixed(2),
            fulfillmentStatus: "UNFULFILLED",
            financialStatus: "PAID",
            items: lineItems.map((i: any) => ({
              title: i.title,
              quantity: i.quantity || 1,
              price: Number(i.price).toFixed(2),
              image: i.image || "",
              size: i.size || "",
              color: i.color || "",
            })),
            shippingAddress: formattedShipping,
            paymentId: paymentId,
          });
        } catch (storeErr) {
          console.warn("[ShopifyOrder] Store fallback error:", storeErr);
        }
      }

      // Cleanup pending checkout
      removePendingCheckout(orderId);

      // Asynchronously send order email receipt
      sendOrderConfirmationEmails({
        orderNumber,
        email,
        contact,
        amount: finalTotal,
        paymentId,
        items: lineItems,
        shippingAddress: formattedShipping,
      }).catch((e) => console.error("[ShopifyOrder] Email send error:", e));

      // Asynchronously send Meta Conversions API event
      sendMetaPurchaseEvent({
        orderId: eventId,
        orderNumber,
        amount: finalTotal,
        currency: "INR",
        items: lineItems,
        customer: {
          email,
          phone,
          firstName: formattedShipping.first_name,
          lastName: formattedShipping.last_name,
          city: formattedShipping.city,
          state: formattedShipping.province,
          zip: formattedShipping.zip,
          country: "in",
        },
        reqContext: {
          ip: reqContext?.ip || null,
          userAgent: reqContext?.userAgent || null,
          fbp: reqContext?.fbp || null,
          fbc: reqContext?.fbc || null,
          url: reqContext?.referer || "https://shopgodsown.com/checkout",
        },
      }).catch((e) => console.error("[ShopifyOrder] Meta CAPI send error:", e));

      return {
        success: true,
        orderId: confirmedOrderId,
        orderNumber,
        eventId,
        alreadyProcessed: false,
      };
    } finally {
      clearInFlightOrderPromise(orderId, paymentId);
      releaseOrderLock(orderId);
      inFlightOrders.delete(orderId);
    }
  })();

  if (orderId) setInFlightOrderPromise(orderId, executionPromise);
  if (paymentId) setInFlightOrderPromise(paymentId, executionPromise);
  inFlightOrders.set(orderId, executionPromise);
  return executionPromise;
}

/**
 * Sends order confirmation emails using Nodemailer.
 */
async function sendOrderConfirmationEmails({
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
  amount: number;
  paymentId: string;
  items: any[];
  shippingAddress: any;
}) {
  const adminEmail = process.env.CONTACT_RECEIVER_EMAIL || "hello@shopgodsown.com";
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  const targetEmail = email || (contact?.includes("@") ? contact.trim() : null);
  if (!smtpUser || !smtpPass || !smtpPass.trim()) {
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

  const formattedAmount = Number(amount || 0).toLocaleString("en-IN");
  const itemsHtml = items.map((i: any) => `
    <tr style="border-bottom: 1px solid #1f1f1f;">
      <td style="padding: 12px 0; color: #ffffff; font-weight: 600;">
        ${escapeHtml(i.title)} ${i.size ? `<span style="color: #888888;">(${escapeHtml(i.size)})</span>` : ""}
      </td>
      <td style="padding: 12px 0; text-align: center; color: #aaaaaa;">${i.quantity || 1}</td>
      <td style="padding: 12px 0; text-align: right; color: #ffffff;">₹${Number(i.price).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="background-color: #000000; color: #ffffff; font-family: -apple-system, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #222222; border-radius: 12px; padding: 32px;">
        <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; text-align: center; margin: 0 0 20px 0;">
          <span style="color: #C81E1E;">GOD'S</span> OWN CULTURE
        </h1>
        <h2 style="font-size: 16px; font-weight: 600; text-align: center; margin: 0 0 16px 0;">Order Confirmed: ${orderNumber}</h2>
        <p style="font-size: 13px; color: #aaaaaa; text-align: center; margin-bottom: 24px;">Thank you for your order. We are preparing it for shipment.</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 1px solid #333333; text-transform: uppercase; font-size: 11px; color: #777777;">
              <th style="padding: 8px 0; text-align: left;">Item</th>
              <th style="padding: 8px 0; text-align: center;">Qty</th>
              <th style="padding: 8px 0; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; font-size: 15px; font-weight: 700; padding-top: 12px; border-top: 1px solid #222222;">
          Total Paid: ₹${formattedAmount}
        </div>
      </div>
    </body>
    </html>
  `;

  if (targetEmail) {
    await transporter.sendMail({
      from: `"GOD'S OWN CULTURE" <${smtpUser}>`,
      to: targetEmail,
      subject: `Order Confirmed: ${orderNumber} — GOD'S OWN CULTURE`,
      html: emailHtml,
    }).catch((err) => console.error("[ShopifyOrder] Customer receipt send failed:", err));
  }

  if (adminEmail) {
    await transporter.sendMail({
      from: `"Store Notification" <${smtpUser}>`,
      to: adminEmail,
      subject: `New Paid Order: ${orderNumber} (₹${formattedAmount})`,
      html: emailHtml,
    }).catch((err) => console.error("[ShopifyOrder] Admin alert send failed:", err));
  }
}
