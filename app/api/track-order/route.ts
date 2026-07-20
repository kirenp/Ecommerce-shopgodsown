import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, emailOrPhone } = await req.json();

    if (!orderNumber || !emailOrPhone) {
      return NextResponse.json(
        { error: "Please provide both Order Number and Email or Phone." },
        { status: 400 }
      );
    }

    const cleanOrderNumber = orderNumber.trim().replace(/^#/, "");
    const cleanContact = emailOrPhone.trim().toLowerCase();

    const domain = process.env.SHOPIFY_STORE_DOMAIN || "godsown-9751.myshopify.com";
    const adminToken = process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN;

    // If private token is set, query Shopify GraphQL Admin API server-side securely
    if (adminToken && domain) {
      try {
        const query = `
          query findOrder($queryStr: String!) {
            orders(first: 5, query: $queryStr) {
              edges {
                node {
                  id
                  name
                  processedAt
                  displayFulfillmentStatus
                  displayFinancialStatus
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
                    city
                    province
                    zip
                    country
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

        const shopifyRes = await fetch(`https://${domain}/admin/api/2026-01/graphql.json`, {
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
          const orderNode = shopifyData.data?.orders?.edges?.[0]?.node;

          if (orderNode) {
            const fulfillment = orderNode.fulfillments?.[0];
            const tracking = fulfillment?.trackingInfo?.[0];

            let step = 2; // Default: Order Processed
            if (orderNode.displayFulfillmentStatus === "DELIVERED") {
              step = 5;
            } else if (orderNode.displayFulfillmentStatus === "IN_TRANSIT" || tracking?.number) {
              step = 3;
            } else if (orderNode.displayFulfillmentStatus === "FULFILLED") {
              step = 4;
            }

            return NextResponse.json({
              success: true,
              order: {
                id: orderNode.id,
                orderNumber: orderNode.name,
                processedAt: orderNode.processedAt,
                totalPrice: orderNode.totalPriceSet?.shopMoney?.amount || "0.00",
                fulfillmentStatus: orderNode.displayFulfillmentStatus || "PROCESSING",
                financialStatus: orderNode.displayFinancialStatus || "PAID",
                trackingCompany: tracking?.company || "Express Logistics",
                trackingNumber: tracking?.number || `TRK${cleanOrderNumber}IN`,
                trackingUrl: tracking?.url || "https://www.bluedart.com",
                currentStep: step,
                estimatedDelivery: "5 - 7 Business Days",
                shippingAddress: orderNode.shippingAddress
                  ? `${orderNode.shippingAddress.address1}, ${orderNode.shippingAddress.city}, ${orderNode.shippingAddress.province} ${orderNode.shippingAddress.zip}`
                  : "Address on file",
                lineItems: orderNode.lineItems.edges.map((e: any) => ({
                  title: e.node.title,
                  quantity: e.node.quantity,
                  price: e.node.originalUnitPriceSet?.shopMoney?.amount || "0.00",
                  image: e.node.image?.url || null,
                })),
              },
            });
          }
        }
      } catch (err) {
        console.warn("Shopify Admin API lookup error:", err);
      }
    }

    return NextResponse.json(
      { error: `No matching order found for #${cleanOrderNumber}. Please check your order number and contact details.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Track order API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process tracking request." },
      { status: 500 }
    );
  }
}
