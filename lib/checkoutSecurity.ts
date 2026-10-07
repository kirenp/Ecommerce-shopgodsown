import { createHmac, timingSafeEqual } from "crypto";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN?.startsWith("shpat_") ? process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN : undefined);
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-01";
const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

export interface AuthoritativeLineItem {
  variantId: string;
  numericVariantId: number | null;
  title: string;
  price: number; // In INR Rupees
  quantity: number;
  color?: string;
  size?: string;
  image?: string;
  availableForSale?: boolean;
}

export interface AuthoritativeOrderCalculation {
  isValid: boolean;
  error?: string;
  lineItems: AuthoritativeLineItem[];
  subtotal: number; // In INR Rupees
  discountAmount: number; // In INR Rupees
  finalTotal: number; // In INR Rupees
  finalTotalInPaise: number; // In integer paise
  appliedDiscount?: {
    code: string;
    type: "percentage" | "fixed_amount";
    percentage?: number;
    amount?: number;
  };
}

/**
 * Normalizes a variant ID to a valid Shopify Global ID (GID).
 * e.g. "44728562385150" -> "gid://shopify/ProductVariant/44728562385150"
 */
export function normalizeVariantGid(rawId: string | number): string {
  const strId = String(rawId || "").trim();
  if (strId.startsWith("gid://shopify/ProductVariant/")) {
    return strId;
  }
  const numericOnly = strId.includes("/") ? strId.split("/").pop()! : strId;
  return `gid://shopify/ProductVariant/${numericOnly}`;
}

/**
 * Normalizes a variant ID to a numeric ID for the Shopify REST Admin API.
 */
export function extractNumericVariantId(rawId: string | number): number | null {
  const strId = String(rawId || "").trim();
  const numericOnly = strId.includes("/") ? strId.split("/").pop()! : strId;
  const num = Number(numericOnly);
  return !isNaN(num) && num > 0 ? num : null;
}

/**
 * Queries Shopify Storefront API GraphQL for canonical variant prices and availability.
 * Server-authoritative lookup.
 */
export async function getAuthoritativeVariantDetails(variantIds: string[]): Promise<Map<string, { price: number; title: string; availableForSale: boolean }>> {
  const details = new Map<string, { price: number; title: string; availableForSale: boolean }>();
  if (!domain || !storefrontToken || variantIds.length === 0) return details;

  const gids = Array.from(new Set(variantIds.map(normalizeVariantGid)));
  const nodeIdsStr = gids.map((id) => `"${id}"`).join(", ");

  const query = `
    query getVariantDetails {
      nodes(ids: [${nodeIdsStr}]) {
        ... on ProductVariant {
          id
          title
          availableForSale
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
          const parsedPrice = parseFloat(node.price.amount);
          const itemDetail = {
            price: isNaN(parsedPrice) ? 0 : parsedPrice,
            title: node.title || "",
            availableForSale: Boolean(node.availableForSale),
          };
          details.set(node.id, itemDetail);

          // Also set by numeric ID for easy lookup
          const numeric = extractNumericVariantId(node.id);
          if (numeric) {
            details.set(String(numeric), itemDetail);
          }
        }
      }
    }
  } catch (err) {
    console.error("[CheckoutSecurity] Failed to fetch variant details from Shopify:", err);
  }

  return details;
}

/**
 * Checks whether a customer (by email or phone) has already placed orders in Shopify.
 * Queries Shopify Admin GraphQL API authoritatively.
 */
export async function hasCustomerPlacedOrders(email?: string, phone?: string): Promise<boolean> {
  if (!adminToken || !domain) return false;

  const cleanEmail = email ? email.trim().toLowerCase() : "";
  const cleanPhone = phone ? phone.replace(/\D/g, "") : "";

  const queries: string[] = [];
  if (cleanEmail && cleanEmail.includes("@")) {
    queries.push(`email:${cleanEmail}`);
  }
  if (cleanPhone && cleanPhone.length >= 7) {
    queries.push(`phone:${cleanPhone.slice(-10)}`);
  }

  if (queries.length === 0) return false;

  const queryStr = queries.join(" OR ");

  const query = `
    query checkCustomerOrders($queryStr: String!) {
      orders(first: 1, query: $queryStr) {
        edges {
          node {
            id
            name
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
      const orderEdges = data?.data?.orders?.edges || [];
      return orderEdges.length > 0;
    }
  } catch (err) {
    console.warn("[CheckoutSecurity] Customer order history check error:", err);
  }

  return false;
}

/**
 * Validates a discount code server-side against Shopify and internal business logic.
 * Enforces first-order restrictions for PLAY10.
 */
export async function validateCouponCode(
  paramsOrCode: string | {
    code: string;
    items?: Array<{ variantId: string; quantity: number }>;
    customerEmail?: string;
    customerPhone?: string;
  },
  maybeSubtotal?: number
): Promise<{
  valid: boolean;
  code?: string;
  type?: "percentage" | "fixed_amount";
  percentage?: number;
  fixedAmount?: number;
  message?: string;
  error?: string;
}> {
  const code = typeof paramsOrCode === "string" ? paramsOrCode : paramsOrCode?.code;
  const items = typeof paramsOrCode === "object" ? paramsOrCode?.items : undefined;
  const customerEmail = typeof paramsOrCode === "object" ? paramsOrCode?.customerEmail : undefined;
  const customerPhone = typeof paramsOrCode === "object" ? paramsOrCode?.customerPhone : undefined;

  const cleanCode = String(code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, error: "Please enter a coupon code." };
  }

  // 1. Check Storefront API Cart for standard coupon codes if items are provided
  if (storefrontToken && domain && Array.isArray(items) && items.length > 0) {
    const lines = items
      .filter((i) => i.variantId)
      .map((i) => ({
        merchandiseId: normalizeVariantGid(i.variantId),
        quantity: Math.max(1, Number(i.quantity) || 1),
      }));

    if (lines.length > 0) {
      try {
        const storefrontRes = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": storefrontToken,
          },
          body: JSON.stringify({
            query: `
              mutation cartCreate($input: CartInput) {
                cartCreate(input: $input) {
                  cart {
                    discountCodes { code applicable }
                    lines(first: 50) {
                      edges {
                        node {
                          cost {
                            subtotalAmount { amount }
                            totalAmount { amount }
                          }
                          discountAllocations {
                            discountedAmount { amount }
                          }
                        }
                      }
                    }
                    cost {
                      subtotalAmount { amount }
                      totalAmount { amount }
                    }
                  }
                }
              }
            `,
            variables: { input: { lines, discountCodes: [cleanCode] } },
          }),
        });

        if (storefrontRes.ok) {
          const sfData = await storefrontRes.json();
          const cart = sfData?.data?.cartCreate?.cart;
          const matchedCode = cart?.discountCodes?.find(
            (dc: any) => dc.code?.toUpperCase() === cleanCode
          );

          if (matchedCode && matchedCode.applicable) {
            const linesEdges = cart?.lines?.edges || [];
            let originalSubtotal = 0;
            let discountedTotal = 0;
            let discountAllocationsTotal = 0;

            for (const edge of linesEdges) {
              const lineCost = edge?.node?.cost;
              const lineSubtotal = parseFloat(lineCost?.subtotalAmount?.amount || "0");
              const lineTotal = parseFloat(lineCost?.totalAmount?.amount || "0");
              originalSubtotal += lineSubtotal;
              discountedTotal += lineTotal;

              for (const alloc of edge?.node?.discountAllocations || []) {
                discountAllocationsTotal += parseFloat(alloc?.discountedAmount?.amount || "0");
              }
            }

            const discountVal = Math.max(
              discountAllocationsTotal,
              Math.max(0, originalSubtotal - discountedTotal)
            );
            const percentage = originalSubtotal > 0 ? Math.round((discountVal / originalSubtotal) * 100) : 0;

            if (discountVal > 0) {
              return {
                valid: true,
                code: cleanCode,
                type: percentage > 0 ? "percentage" : "fixed_amount",
                percentage: percentage > 0 ? percentage : undefined,
                fixedAmount: percentage === 0 ? discountVal : undefined,
                message: "Coupon applied successfully",
              };
            }
          }
        }
      } catch (sfErr) {
        console.warn("[CheckoutSecurity] Storefront cart discount check error:", sfErr);
      }
    }
  }

  // 2. Query Shopify Admin GraphQL API to check code definition
  if (adminToken && domain) {
    try {
      const adminRes = await fetch(`https://${domain}/admin/api/${apiVersion}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": adminToken,
        },
        body: JSON.stringify({
          query: `
            query getDiscount($code: String!) {
              codeDiscountNodeByCode(code: $code) {
                codeDiscount {
                  ... on DiscountCodeBasic {
                    title
                    status
                    customerGets {
                      value {
                        ... on DiscountPercentage { percentage }
                        ... on DiscountAmount { amount { amount } }
                      }
                    }
                  }
                }
              }
            }
          `,
          variables: { code: cleanCode },
        }),
      });

      if (adminRes.ok) {
        const adminData = await adminRes.json();
        const discount = adminData?.data?.codeDiscountNodeByCode?.codeDiscount;
        if (discount && discount.status === "ACTIVE") {
          const value = discount.customerGets?.value;
          if (value?.percentage !== undefined) {
            return {
              valid: true,
              code: cleanCode,
              type: "percentage",
              percentage: Math.round(Number(value.percentage) * 100),
              message: `${discount.title || cleanCode} applied`,
            };
          }
          if (value?.amount?.amount !== undefined) {
            return {
              valid: true,
              code: cleanCode,
              type: "fixed_amount",
              fixedAmount: parseFloat(value.amount.amount),
              message: `${discount.title || cleanCode} applied`,
            };
          }
        }
      }
    } catch (adminErr) {
      console.warn("[CheckoutSecurity] Admin discount lookup error:", adminErr);
    }
  }

  // 3. SEC-04 Remediation: First-purchase promotion code PLAY10 (10% OFF)
  if (cleanCode === "PLAY10") {
    // If customer contact is provided, authoritatively verify if customer has prior orders
    if (customerEmail || customerPhone) {
      const hasPriorOrders = await hasCustomerPlacedOrders(customerEmail, customerPhone);
      if (hasPriorOrders) {
        return {
          valid: false,
          error: "The PLAY10 discount code is only valid for your first order.",
        };
      }
    }

    return {
      valid: true,
      code: "PLAY10",
      type: "percentage",
      percentage: 10,
      message: "PLAY10 applied (10% OFF first order)",
    };
  }

  return {
    valid: false,
    error: "Invalid discount code.",
  };
}

/**
 * Authoritatively calculates order subtotal, discount, and final amount in Rupees and Paise.
 * Never trusts client-supplied prices or client-supplied discount amounts.
 */
export async function calculateAuthoritativeOrder({
  items,
  discountCode,
  customerEmail,
  customerPhone,
}: {
  items: any[];
  discountCode?: string;
  customerEmail?: string;
  customerPhone?: string;
}): Promise<AuthoritativeOrderCalculation> {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return {
      isValid: false,
      error: "Invalid cart items.",
      lineItems: [],
      subtotal: 0,
      discountAmount: 0,
      finalTotal: 0,
      finalTotalInPaise: 0,
    };
  }

  // 1. Gather all variant IDs
  const rawVariantIds = items
    .map((item) => String(item.variantId || "").trim())
    .filter(Boolean);

  if (rawVariantIds.length === 0) {
    return {
      isValid: false,
      error: "Missing product variant information.",
      lineItems: [],
      subtotal: 0,
      discountAmount: 0,
      finalTotal: 0,
      finalTotalInPaise: 0,
    };
  }

  // 2. Query canonical prices from Shopify
  const variantDetailsMap = await getAuthoritativeVariantDetails(rawVariantIds);

  const authoritativeItems: AuthoritativeLineItem[] = [];
  let subtotal = 0;

  for (const item of items) {
    const rawId = String(item.variantId || "").trim();
    const gid = normalizeVariantGid(rawId);
    const numericId = extractNumericVariantId(rawId);

    const detail = variantDetailsMap.get(gid) || (numericId ? variantDetailsMap.get(String(numericId)) : undefined);

    if (!detail) {
      console.warn(`[CheckoutSecurity] Variant ${rawId} not found in authoritative Shopify catalog.`);
      return {
        isValid: false,
        error: "One or more items in your cart could not be verified. Please refresh and try again.",
        lineItems: [],
        subtotal: 0,
        discountAmount: 0,
        finalTotal: 0,
        finalTotalInPaise: 0,
      };
    }

    const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, 100));
    const canonicalPrice = detail.price;

    subtotal += canonicalPrice * quantity;

    authoritativeItems.push({
      variantId: gid,
      numericVariantId: numericId,
      title: String(item.title || detail.title || "").slice(0, 256),
      price: canonicalPrice,
      quantity,
      color: item.color ? String(item.color).slice(0, 100) : undefined,
      size: item.size ? String(item.size).slice(0, 100) : undefined,
      image: item.image ? String(item.image) : undefined,
      availableForSale: detail.availableForSale,
    });
  }

  // Round subtotal to 2 decimal places
  subtotal = Math.round(subtotal * 100) / 100;

  // 3. Calculate authoritative discount
  let discountAmount = 0;
  let appliedDiscount: AuthoritativeOrderCalculation["appliedDiscount"] = undefined;

  if (discountCode && discountCode.trim()) {
    const discountRes = await validateCouponCode({
      code: discountCode,
      items: authoritativeItems,
      customerEmail,
      customerPhone,
    });

    if (discountRes.valid) {
      if (discountRes.type === "percentage" && discountRes.percentage && discountRes.percentage > 0) {
        discountAmount = Math.round((subtotal * (discountRes.percentage / 100)) * 100) / 100;
        appliedDiscount = {
          code: discountRes.code || discountCode.toUpperCase(),
          type: "percentage",
          percentage: discountRes.percentage,
          amount: discountAmount,
        };
      } else if (discountRes.type === "fixed_amount" && discountRes.fixedAmount && discountRes.fixedAmount > 0) {
        discountAmount = Math.min(discountRes.fixedAmount, subtotal);
        appliedDiscount = {
          code: discountRes.code || discountCode.toUpperCase(),
          type: "fixed_amount",
          amount: discountAmount,
        };
      }
    } else {
      console.warn(`[CheckoutSecurity] Invalid discount code '${discountCode}':`, discountRes.error);
    }
  }

  const finalTotal = Math.max(1, Math.round((subtotal - discountAmount) * 100) / 100);
  const finalTotalInPaise = Math.round(finalTotal * 100);

  return {
    isValid: true,
    lineItems: authoritativeItems,
    subtotal,
    discountAmount,
    finalTotal,
    finalTotalInPaise,
    appliedDiscount,
  };
}

/**
 * Authoritatively queries Razorpay Payments API to verify payment capture and exact amount.
 */
export async function verifyRazorpayPaymentCapture({
  paymentId,
  orderId,
  expectedAmountInPaise,
}: {
  paymentId: string;
  orderId: string;
  expectedAmountInPaise: number;
}): Promise<{
  verified: boolean;
  payment?: any;
  error?: string;
}> {
  if (!razorpayKeyId || !razorpayKeySecret) {
    return { verified: false, error: "Razorpay credentials not configured on server." };
  }

  if (!paymentId || !orderId) {
    return { verified: false, error: "Payment ID and Order ID are required." };
  }

  const authHeader = `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64")}`;

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Razorpay API] Payment fetch error:", res.status, errText);
      return { verified: false, error: "Failed to verify transaction with payment gateway." };
    }

    const payment = await res.json();

    // 1. Verify associated Razorpay order ID matches
    if (payment.order_id !== orderId) {
      console.error("[Razorpay API] Order ID mismatch:", { expected: orderId, actual: payment.order_id });
      return { verified: false, error: "Payment does not match the expected checkout order." };
    }

    // 2. Verify payment status is captured or authorized
    if (payment.status !== "captured" && payment.status !== "authorized") {
      console.error("[Razorpay API] Payment not captured:", { status: payment.status });
      return { verified: false, error: `Payment is not captured (status: ${payment.status}).` };
    }

    // 3. Verify currency
    if (payment.currency !== "INR") {
      return { verified: false, error: `Invalid currency: ${payment.currency}` };
    }

    // 4. Verify exact amount in integer paise
    if (payment.amount !== expectedAmountInPaise) {
      console.error("[Razorpay API] Financial mismatch:", {
        expectedPaise: expectedAmountInPaise,
        paidPaise: payment.amount,
      });
      return {
        verified: false,
        error: `Payment amount (${payment.amount} paise) does not match the order total (${expectedAmountInPaise} paise).`,
      };
    }

    return { verified: true, payment };
  } catch (err: any) {
    console.error("[Razorpay API] Verification exception:", err);
    return { verified: false, error: "Network error verifying payment with payment gateway." };
  }
}

/**
 * Cryptographically verifies Razorpay payment signature (orderId + "|" + paymentId).
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!razorpayKeySecret || !orderId || !paymentId || !signature) return false;
  const expectedSignature = createHmac("sha256", razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
}
