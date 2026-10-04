import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN?.startsWith("shpat_") ? process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN : undefined);
const apiVersion = process.env.SHOPIFY_API_VERSION || "2024-01";

export async function POST(req: NextRequest) {
  // Rate limit protection
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { code, items } = body;

    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode) {
      return NextResponse.json(
        { valid: false, error: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    // 1. Validate against Shopify Storefront API cart if items are provided
    if (storefrontToken && domain && Array.isArray(items) && items.length > 0) {
      const lines = items
        .filter((i: any) => i.variantId)
        .map((i: any) => ({
          merchandiseId: String(i.variantId).startsWith("gid://")
            ? String(i.variantId)
            : `gid://shopify/ProductVariant/${String(i.variantId).includes("/") ? String(i.variantId).split("/").pop() : i.variantId}`,
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
                      discountCodes {
                        code
                        applicable
                      }
                      discountAllocations {
                        discountedAmount {
                          amount
                          currencyCode
                        }
                      }
                      cost {
                        subtotalAmount { amount }
                        totalAmount { amount }
                      }
                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `,
              variables: {
                input: {
                  lines,
                  discountCodes: [cleanCode],
                },
              },
            }),
          });

          if (storefrontRes.ok) {
            const sfData = await storefrontRes.json();
            const cart = sfData?.data?.cartCreate?.cart;
            const matchedCode = cart?.discountCodes?.find(
              (dc: any) => dc.code?.toUpperCase() === cleanCode
            );

            if (matchedCode && matchedCode.applicable) {
              const subtotal = parseFloat(cart.cost?.subtotalAmount?.amount || "0");
              const total = parseFloat(cart.cost?.totalAmount?.amount || "0");
              const discountVal = Math.max(0, subtotal - total);
              const percentage = subtotal > 0 ? Math.round((discountVal / subtotal) * 100) : 0;

              return NextResponse.json({
                valid: true,
                code: cleanCode,
                type: percentage > 0 ? "percentage" : "fixed_amount",
                percentage: percentage,
                discountAmount: discountVal,
                message: "Coupon applied successfully",
              });
            }
          }
        } catch (sfErr) {
          console.warn("[Discount API] Storefront cart check error:", sfErr);
        }
      }
    }

    // 2. Query Shopify Admin GraphQL API to verify code definition
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
                  id
                  codeDiscount {
                    ... on DiscountCodeBasic {
                      title
                      status
                      summary
                      customerGets {
                        value {
                          ... on DiscountPercentage {
                            percentage
                          }
                          ... on DiscountAmount {
                            amount {
                              amount
                              currencyCode
                            }
                          }
                        }
                      }
                    }
                    ... on DiscountCodeBxgy {
                      title
                      status
                    }
                    ... on DiscountCodeFreeShipping {
                      title
                      status
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
          const node = adminData?.data?.codeDiscountNodeByCode;

          if (node && node.codeDiscount) {
            const discount = node.codeDiscount;

            if (discount.status === "ACTIVE") {
              const value = discount.customerGets?.value;
              let percentage = 0;
              let fixedAmount = 0;

              if (value?.percentage !== undefined) {
                percentage = Math.round(Number(value.percentage) * 100);
              } else if (value?.amount?.amount !== undefined) {
                fixedAmount = parseFloat(value.amount.amount);
              }

              return NextResponse.json({
                valid: true,
                code: cleanCode,
                title: discount.title,
                type: percentage > 0 ? "percentage" : "fixed_amount",
                percentage: percentage,
                fixedAmount: fixedAmount,
                message: `${discount.title || cleanCode} applied`,
              });
            }
          }
        }
      } catch (adminErr) {
        console.warn("[Discount API] Admin discount lookup error:", adminErr);
      }
    }

    // If code is not found or not active in Shopify
    return NextResponse.json(
      {
        valid: false,
        error: "Invalid discount code.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Discount API] Unexpected error:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to validate discount code. Please try again.",
      },
      { status: 500 }
    );
  }
}
