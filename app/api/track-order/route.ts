import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { trackByAWB, isShiprocketConfigured } from "@/lib/shiprocket";
import { getServerCustomerOrders } from "@/lib/serverOrderStore";

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.trackOrder);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { orderNumber, emailOrPhone } = await req.json();

    if (!orderNumber || !emailOrPhone) {
      return NextResponse.json(
        { error: "Please provide both Order Number and Email or Phone." },
        { status: 400 }
      );
    }

    // Input length validation
    if (String(orderNumber).length > 50 || String(emailOrPhone).length > 320) {
      return NextResponse.json(
        { error: "Invalid input length." },
        { status: 400 }
      );
    }

    const cleanOrderNumber = String(orderNumber).trim().replace(/^#/, "");
    const cleanContact = String(emailOrPhone).trim().toLowerCase();

    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN?.startsWith("shpat_") ? process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN : undefined);

    // If private token is set, query Shopify GraphQL Admin API server-side securely
    if (adminToken && domain) {
      try {
        const query = `
          query findOrder($queryStr: String!) {
            orders(first: 10, query: $queryStr) {
              edges {
                node {
                  id
                  name
                  processedAt
                  displayFulfillmentStatus
                  displayFinancialStatus
                  email
                  phone
                  totalPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                  shippingAddress {
                    firstName
                    lastName
                    address1
                    address2
                    city
                    province
                    zip
                    country
                    phone
                  }
                  fulfillments {
                    status
                    trackingInfo {
                      company
                      number
                      url
                    }
                  }
                  lineItems(first: 10) {
                    edges {
                      node {
                        title
                        quantity
                        originalUnitPriceSet {
                          shopMoney {
                            amount
                          }
                        }
                        image {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const shopifyRes = await fetch(`https://${domain}/admin/api/${process.env.SHOPIFY_API_VERSION || "2026-01"}/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": adminToken,
          },
          body: JSON.stringify({
            query,
            variables: { queryStr: `name:#${cleanOrderNumber} OR name:${cleanOrderNumber}` },
          }),
        });

        if (shopifyRes.ok) {
          const shopifyData = await shopifyRes.json();
          const orderEdges = shopifyData.data?.orders?.edges || [];

          // Find the matching order that also matches the customer's email or phone
          const matchingEdge = orderEdges.find((e: any) => {
            const node = e.node;
            const nodeNameClean = (node.name || "").replace(/^#/, "");
            if (nodeNameClean !== cleanOrderNumber) return false;

            const orderEmail = (node.email || "").toLowerCase();
            const orderPhone = (node.phone || "").replace(/\D/g, "");
            const shippingPhone = (node.shippingAddress?.phone || "").replace(/\D/g, "");
            const inputPhone = cleanContact.replace(/\D/g, "");

            const isEmailMatch = orderEmail && orderEmail === cleanContact;
            const isPhoneMatch =
              inputPhone.length >= 7 &&
              ((orderPhone && orderPhone.endsWith(inputPhone.slice(-10))) ||
               (shippingPhone && shippingPhone.endsWith(inputPhone.slice(-10))));

            return isEmailMatch || isPhoneMatch;
          });

          const orderNode = matchingEdge?.node;

          if (orderNode) {
            const fulfillments = orderNode.fulfillments || [];
            const activeFulfillment = fulfillments.find((f: any) => f.trackingInfo && f.trackingInfo.length > 0) || fulfillments[0];
            const tracking = activeFulfillment?.trackingInfo?.[0];

            const realTrackingNumber = tracking?.number?.trim() || null;
            const realTrackingCompany = tracking?.company?.trim() || null;
            const realTrackingUrl = tracking?.url?.trim() || null;

            const fulfillmentStatus = (orderNode.displayFulfillmentStatus || "").toUpperCase();

            // ── ACCURATE LOGISTICS STEP ──
            // 1: Order Placed (confirmed, awaiting dispatch)
            // 2: Dispatched (assigned to courier / picked up)
            // 3: In Transit (on the way)
            // 4: Out for Delivery (nearby hub)
            // 5: Delivered
            let step = 1;

            if (fulfillmentStatus === "DELIVERED") {
              step = 5;
            } else if (fulfillmentStatus === "OUT_FOR_DELIVERY") {
              step = 4;
            } else if (fulfillmentStatus === "IN_TRANSIT") {
              step = 3;
            } else if (fulfillmentStatus === "FULFILLED") {
              step = realTrackingNumber ? 2 : 2;
            } else if (realTrackingNumber) {
              step = 2;
            } else {
              // Unfulfilled order -> only Step 1 is active
              step = 1;
            }

            // ── SHIPROCKET TRACKING INTEGRATION ──
            let shiprocketTracking = null;

            if (realTrackingNumber && isShiprocketConfigured()) {
              try {
                const srData = await trackByAWB(realTrackingNumber);
                if (srData) {
                  shiprocketTracking = srData;

                  switch (srData.currentStatusCode) {
                    case "OP":
                      step = 1;
                      break;
                    case "PU":
                    case "PPF":
                    case "OFP":
                      step = 2;
                      break;
                    case "IT":
                      step = 3;
                      break;
                    case "OFD":
                      step = 4;
                      break;
                    case "DL":
                      step = 5;
                      break;
                    case "RTO":
                    case "CANCELED":
                    case "NDR":
                      break;
                  }
                }
              } catch (srErr) {
                console.warn("Shiprocket tracking lookup failed (falling back to Shopify):", srErr);
              }
            }

            const finalTrackingCompany = realTrackingCompany || shiprocketTracking?.courierName || null;
            const finalTrackingNumber = realTrackingNumber || shiprocketTracking?.awbNumber || null;
            let finalTrackingUrl = realTrackingUrl;
            if (!finalTrackingUrl && shiprocketTracking?.awbNumber) {
              finalTrackingUrl = `https://shiprocket.co/tracking/${shiprocketTracking.awbNumber}`;
            }

            const isDispatched = step >= 2 || Boolean(finalTrackingNumber);

            return NextResponse.json({
              success: true,
              order: {
                id: orderNode.id,
                orderNumber: orderNode.name,
                processedAt: orderNode.processedAt,
                totalPrice: orderNode.totalPriceSet?.shopMoney?.amount || "0.00",
                fulfillmentStatus: orderNode.displayFulfillmentStatus || "UNFULFILLED",
                financialStatus: orderNode.displayFinancialStatus || "PAID",
                isDispatched,
                trackingCompany: finalTrackingCompany,
                trackingNumber: finalTrackingNumber,
                trackingUrl: finalTrackingUrl,
                currentStep: step,
                estimatedDelivery: shiprocketTracking?.estimatedDelivery || null,
                shippingAddress: orderNode.shippingAddress
                  ? [
                      orderNode.shippingAddress.address1,
                      orderNode.shippingAddress.address2,
                      orderNode.shippingAddress.city,
                      [orderNode.shippingAddress.province, orderNode.shippingAddress.zip].filter(Boolean).join(" ")
                    ].filter(Boolean).join(", ")
                  : "Address on file",
                lineItems: orderNode.lineItems.edges.map((e: any) => ({
                  title: e.node.title,
                  quantity: e.node.quantity,
                  price: e.node.originalUnitPriceSet?.shopMoney?.amount || "0.00",
                  image: e.node.image?.url || null,
                })),
              },
              shiprocketTracking,
            });
          }
        }
      } catch (err) {
        console.warn("Shopify Admin API lookup error:", err);
      }
    }

    // ── FALLBACK TO LOCAL SERVER STORE ──
    try {
      const serverOrders = getServerCustomerOrders(cleanContact);
      const match = serverOrders.find(
        (o) =>
          o.orderNumber.replace(/^#/, "") === cleanOrderNumber ||
          o.orderNumber === cleanOrderNumber
      );
      if (match) {
        return NextResponse.json({
          success: true,
          order: {
            id: match.id,
            orderNumber: match.orderNumber,
            processedAt: match.processedAt,
            totalPrice: match.totalPrice,
            fulfillmentStatus: match.fulfillmentStatus || "UNFULFILLED",
            financialStatus: match.financialStatus || "PAID",
            isDispatched: false,
            trackingCompany: null,
            trackingNumber: null,
            trackingUrl: null,
            currentStep: 1,
            estimatedDelivery: null,
            shippingAddress: match.shippingAddress
              ? `${match.shippingAddress.address || match.shippingAddress.address1 || ""}, ${match.shippingAddress.city || ""}, ${match.shippingAddress.state || ""} ${match.shippingAddress.pinCode || ""}`
              : "Address on file",
            lineItems: match.items.map((i: any) => ({
              title: i.title,
              quantity: i.quantity,
              price: i.price,
              image: i.image || null,
            })),
          },
          shiprocketTracking: null,
        });
      }
    } catch (storeErr) {
      console.warn("Server order store fallback error:", storeErr);
    }

    return NextResponse.json(
      { error: `No matching order found for #${cleanOrderNumber}. Please check your order number and contact details.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Track order API error:", error);
    return NextResponse.json(
      { error: "Failed to process tracking request. Please try again." },
      { status: 500 }
    );
  }
}
