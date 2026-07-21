import { NextRequest, NextResponse } from "next/server";
import {
  generateCodeVerifier,
  generateState,
  generateNonce,
  generateCodeChallenge,
  buildAuthorizationUrl,
  buildLogoutUrl,
} from "@/lib/shopifyAuth";

export const dynamic = 'force-dynamic';

const domain = process.env.SHOPIFY_STORE_DOMAIN || "godsown-9751.myshopify.com";
const adminToken = process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-01";
const shopId = process.env.SHOPIFY_SHOP_ID || "";
const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "";

// Admin API helper
async function adminFetch(query: string, variables = {}) {
  if (!adminToken) return null;
  const endpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json();
}

// Admin API Queries & Mutations
const ADMIN_SEARCH_CUSTOMER_QUERY = `
  query searchCustomer($queryStr: String!) {
    customers(first: 1, query: $queryStr) {
      edges {
        node {
          id
          firstName
          lastName
          email
          phone
        }
      }
    }
  }
`;

const ADMIN_CUSTOMER_CREATE_MUTATION = `
  mutation adminCustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        firstName
        lastName
        email
        phone
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ADMIN_GET_CUSTOMER_ORDERS = `
  query getCustomerOrders($queryStr: String!) {
    orders(first: 20, query: $queryStr) {
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";

// Storefront API helper for customer existence check
async function storefrontFetch(query: string, variables = {}) {
  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // ─── ACTION: CHECK-EMAIL ──────────────────────────────────────────
    // Check if a customer with this email exists in Shopify Admin (non-mutating)
    if (action === "check-email") {
      if (!email?.trim()) {
        return NextResponse.json({ error: "Email address is required." }, { status: 400 });
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      let exists = false;
      let checked = false;

      if (adminToken) {
        try {
          const searchRes = await adminFetch(ADMIN_SEARCH_CUSTOMER_QUERY, { queryStr: `email:${cleanEmail}` });
          if (!searchRes?.errors) {
            checked = true;
            if (searchRes?.data?.customers?.edges?.[0]?.node) {
              exists = true;
            }
          }
        } catch (e) {}
      }

      return NextResponse.json({
        exists,
        checked,
        email: cleanEmail,
      });
    }

    // ─── ACTION: CREATE-CUSTOMER ──────────────────────────────────────
    // Create a new customer in Shopify Admin DB (email only)
    if (action === "create-customer") {
      if (!email?.trim()) {
        return NextResponse.json({ error: "Email address is required." }, { status: 400 });
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      if (adminToken) {
        try {
          const createInput = {
            email: cleanEmail,
            firstName: cleanEmail.split("@")[0],
            acceptsMarketing: true,
          };
          const createRes = await adminFetch(ADMIN_CUSTOMER_CREATE_MUTATION, { input: createInput });
          if (createRes?.data?.customerCreate?.customer) {
            const newCustomer = createRes.data.customerCreate.customer;
            return NextResponse.json({
              success: true,
              customer: {
                id: newCustomer.id,
                firstName: newCustomer.firstName,
                lastName: newCustomer.lastName,
                email: newCustomer.email,
              },
            });
          }
        } catch (e) {
          console.warn("Admin customerCreate notice:", e);
        }
      }

      return NextResponse.json({
        success: true,
        customer: {
          email: cleanEmail,
          firstName: cleanEmail.split("@")[0],
        },
      });
    }

    // ─── ACTION: INITIATE-AUTH ────────────────────────────────────────
    // Generate PKCE challenge + Shopify OAuth URL for OTP verification
    if (action === "initiate-auth") {
      if (!shopId || !clientId) {
        return NextResponse.json(
          { error: "Shopify Customer Account API not configured. Please set SHOPIFY_SHOP_ID and SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID." },
          { status: 500 }
        );
      }

      // Determine the base URL for the callback
      const referer = req.headers.get("referer") || "";
      const origin = body.origin || req.headers.get("origin") || (referer ? new URL(referer).origin : "http://localhost:3000");
      const redirectUri = `${origin}/api/auth/callback`;

      // Extract return path from referer if on dev-preview
      let returnPath = body.returnPath || "/dev-preview";
      if (!body.returnPath && referer) {
        try {
          const refUrl = new URL(referer);
          returnPath = refUrl.pathname + refUrl.search;
        } catch (e) {}
      }

      // Generate PKCE values
      const codeVerifier = generateCodeVerifier();
      const state = generateState();
      const nonce = generateNonce();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Build authorization URL with login_hint if email provided
      const authorizationUrl = buildAuthorizationUrl({
        shopId,
        clientId,
        redirectUri,
        state,
        nonce,
        codeChallenge,
        loginHint: email?.trim(),
      });

      return NextResponse.json({
        authorizationUrl,
        codeVerifier,
        state,
        nonce,
        returnPath,
        origin,
      });
    }

    // ─── ACTION: GET-LOGOUT-URL ────────────────────────────────────────
    // Generate Shopify Customer Account logout URL to clear domain session
    if (action === "get-logout-url") {
      const referer = req.headers.get("referer") || "";
      const origin = body.origin || req.headers.get("origin") || (referer ? new URL(referer).origin : "http://localhost:3000");
      const postLogoutRedirectUri = body.returnPath ? `${origin}${body.returnPath}` : `${origin}/dev-preview`;
      const idTokenHint = body.idToken;

      const logoutUrl = buildLogoutUrl({
        shopId,
        idTokenHint,
        postLogoutRedirectUri,
      });

      return NextResponse.json({ logoutUrl });
    }

    // ─── ACTION: GET-CUSTOMER-DATA ───────────────────────────────────
    // Fetch customer orders/profile from Admin API by email (post-auth)
    if (action === "get-customer-data") {
      if (!email?.trim()) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
      }
      const cleanEmail = email.trim().toLowerCase();

      let customer: any = null;
      let orders: any[] = [];

      if (adminToken) {
        try {
          const searchRes = await adminFetch(ADMIN_SEARCH_CUSTOMER_QUERY, { queryStr: `email:${cleanEmail}` });
          if (!searchRes?.errors) {
            customer = searchRes?.data?.customers?.edges?.[0]?.node || null;
          }
        } catch (err) {
          console.warn("get-customer-data search error:", err);
        }

        try {
          const ordersRes = await adminFetch(ADMIN_GET_CUSTOMER_ORDERS, { queryStr: `email:${cleanEmail}` });
          if (!ordersRes?.errors) {
            const orderEdges = ordersRes?.data?.orders?.edges || [];
            orders = orderEdges.map((e: any) => {
              const ord = e.node;
              return {
                id: ord.id,
                orderNumber: ord.name,
                processedAt: ord.processedAt,
                totalPrice: ord.totalPriceSet?.shopMoney?.amount || "0.00",
                fulfillmentStatus: ord.displayFulfillmentStatus || "UNFULFILLED",
                financialStatus: ord.displayFinancialStatus || "PAID",
                items: ord.lineItems.edges.map((itemEdge: any) => ({
                  title: itemEdge.node.title,
                  quantity: itemEdge.node.quantity,
                  price: itemEdge.node.originalUnitPriceSet?.shopMoney?.amount || "0.00",
                  image: itemEdge.node.image?.url || null,
                })),
              };
            });
          }
        } catch (err) {
          console.warn("Failed to fetch orders:", err);
        }
      }

      return NextResponse.json({
        success: true,
        customer: customer ? {
          id: customer.id,
          firstName: customer.firstName || "",
          lastName: customer.lastName || "",
          email: customer.email || cleanEmail,
          phone: customer.phone || "",
          acceptsMarketing: true,
          tier: "Club Member",
          points: 100,
        } : {
          email: cleanEmail,
          firstName: cleanEmail.split("@")[0],
          lastName: "",
          phone: "",
          acceptsMarketing: true,
          tier: "Club Member",
          points: 100,
        },
        orders,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Customer Auth API error:", error);
    return NextResponse.json({ error: error.message || "Authentication failed." }, { status: 500 });
  }
}
