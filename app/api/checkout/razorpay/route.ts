import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-01";

/**
 * Look up variant prices from Shopify Storefront API (server-side, trusted).
 * Returns a Map of variantId -> price (as number).
 */
async function getVariantPrices(variantIds: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (!domain || !storefrontToken || variantIds.length === 0) return prices;

  // Build a GraphQL query that fetches each variant node by ID
  const nodeIds = variantIds.map((id) => `"${id}"`).join(", ");
  const query = `
    query getVariantPrices {
      nodes(ids: [${nodeIds}]) {
        ... on ProductVariant {
          id
          price {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  try {
    const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const nodes = json?.data?.nodes || [];
      for (const node of nodes) {
        if (node?.id && node?.price?.amount) {
          prices.set(node.id, parseFloat(node.price.amount));
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch variant prices from Shopify:", err);
  }

  return prices;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.checkout);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { items } = body;

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Graceful check: if keys are not defined, return a mock response so checkouts run simulation mode
    if (!keyId || !keySecret) {
      console.warn("Razorpay API credentials not set. Returning simulation response.");
      return NextResponse.json({
        mock: true,
        message: "Credentials missing in .env.local. Simulating transaction."
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { error: "Invalid cart items." },
        { status: 400 }
      );
    }

    // Extract variant IDs from items for server-side price lookup
    const variantIds: string[] = items
      .map((item: any) => item.variantId)
      .filter((id: any) => typeof id === "string" && id.length > 0);

    // Look up trusted prices from Shopify
    const variantPrices = await getVariantPrices(variantIds);

    // Calculate total server-side
    let serverTotal = 0;
    for (const item of items) {
      const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, 100));
      const trustedPrice = variantPrices.get(item.variantId);

      if (trustedPrice !== undefined) {
        // Use server-verified price
        serverTotal += trustedPrice * quantity;
      } else {
        // Fallback: if variant not found in Shopify (rare), reject
        console.warn(`Variant ${item.variantId} not found in Shopify. Rejecting order.`);
        return NextResponse.json(
          { error: "One or more items could not be verified. Please refresh and try again." },
          { status: 400 }
        );
      }
    }

    if (serverTotal <= 0) {
      return NextResponse.json(
        { error: "Order total must be greater than ₹0." },
        { status: 400 }
      );
    }

    // Razorpay expects amount in paise (Rupees * 100)
    const amountInPaise = Math.round(serverTotal * 100);

    // Basic Auth header for Razorpay API
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Razorpay API error:", errText);
      return NextResponse.json(
        { error: "Payment gateway error. Please try again." },
        { status: 502 }
      );
    }

    const orderData = await response.json();

    // Return order details along with the public key ID for front-end SDK configuration
    return NextResponse.json({
      id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: keyId,
      serverTotal: serverTotal, // Return so client can verify display matches
    });

  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
