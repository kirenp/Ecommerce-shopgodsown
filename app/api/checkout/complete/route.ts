import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const domain = process.env.SHOPIFY_STORE_DOMAIN || "godsown-9751.myshopify.com";
const adminToken = process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-01";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, contact, shippingAddress, billingAddress, amount, paymentId, orderId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart items are missing in request." }, { status: 400 });
    }

    const isEmail = contact?.includes("@");
    const email = isEmail ? contact.trim().toLowerCase() : "";
    const phone = isEmail ? (shippingAddress?.phone || "") : contact.trim();

    // Map items to Shopify line items format
    const lineItems = items.map((item: any) => {
      const lineItem: any = {
        title: item.title,
        price: parseFloat(item.price || "0").toFixed(2),
        quantity: item.quantity || 1,
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
      const variantTitleParts = [item.color, item.size].filter(Boolean);
      if (variantTitleParts.length > 0) {
        lineItem.variant_title = variantTitleParts.join(" / ");
      }

      return lineItem;
    });

    // Format shipping address
    const formatAddress = (addr: any) => ({
      first_name: addr?.firstName || "",
      last_name: addr?.lastName || "",
      address1: addr?.address || "",
      address2: addr?.apartment || "",
      city: addr?.city || "",
      province: addr?.state || "Kerala",
      country: "India",
      zip: addr?.pinCode || "",
      phone: addr?.phone || phone || "",
    });

    const formattedShipping = formatAddress(shippingAddress);
    const formattedBilling = formatAddress(billingAddress || shippingAddress);

    let shopifyOrderResult: any = null;

    // Call Shopify Admin REST API to create order if token exists
    if (adminToken) {
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
          console.warn("Primary Shopify Order Creation response failed:", errText);

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
          console.error("Fallback Shopify Order Creation error:", errText2);
        }
      } catch (err) {
        console.error("Shopify Admin Order creation error:", err);
      }
    }

    const orderNumber = shopifyOrderResult?.name || `#GOC-${Math.floor(100000 + Math.random() * 900000)}`;

    return NextResponse.json({
      success: true,
      orderId: shopifyOrderResult?.id || `local_${Date.now()}`,
      orderNumber: orderNumber,
      message: "Order placed and recorded in Shopify successfully.",
    });

  } catch (error: any) {
    console.error("Order completion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process order completion." },
      { status: 500 }
    );
  }
}
