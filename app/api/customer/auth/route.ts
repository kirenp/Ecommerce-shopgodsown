import { NextRequest, NextResponse } from "next/server";
import {
  generateCodeVerifier,
  generateState,
  generateNonce,
  generateCodeChallenge,
  buildAuthorizationUrl,
  buildLogoutUrl,
} from "@/lib/shopifyAuth";
import {
  getServerCustomerAddresses,
  saveServerCustomerAddress,
  removeServerCustomerAddress,
} from "@/lib/serverCustomerStore";

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
          defaultAddress {
            id
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            phone
          }
          addresses {
            id
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            phone
          }
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

const ADMIN_CUSTOMER_UPDATE_MUTATION = `
  mutation adminCustomerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
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
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            phone
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
      const postLogoutRedirectUri = `${origin}/api/auth/logout`;
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

      let rawOrderEdges: any[] = [];
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
            rawOrderEdges = ordersRes?.data?.orders?.edges || [];
            orders = rawOrderEdges.map((e: any) => {
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

      let formattedAddresses: any[] = [];
      if (customer) {
        const rawAddrs = customer.addresses || (customer.defaultAddress ? [customer.defaultAddress] : []);
        formattedAddresses = rawAddrs.map((a: any) => ({
          id: a.id || `addr_${Date.now()}`,
          firstName: a.firstName || customer.firstName || "",
          lastName: a.lastName || customer.lastName || "",
          address: [a.address1, a.address2].filter(Boolean).join(", ") || "",
          city: a.city || "",
          state: a.province || "Kerala",
          pinCode: a.zip || "",
          phone: a.phone || customer.phone || "",
          isDefault: customer.defaultAddress?.id ? customer.defaultAddress.id === a.id : true,
        }));
      }

      // Fallback: Also extract shipping address from customer orders if customer profile has no saved addresses
      if (rawOrderEdges.length > 0) {
        for (const edge of rawOrderEdges) {
          const shipAddr = edge.node?.shippingAddress;
          if (shipAddr && shipAddr.address1) {
            const fullAddrStr = [shipAddr.address1, shipAddr.address2].filter(Boolean).join(", ");
            const exists = formattedAddresses.some(a => a.address === fullAddrStr || (a.pinCode && a.pinCode === shipAddr.zip));
            if (!exists) {
              formattedAddresses.push({
                id: `addr_order_${edge.node.id}`,
                firstName: shipAddr.firstName || customer?.firstName || "",
                lastName: shipAddr.lastName || customer?.lastName || "",
                address: fullAddrStr,
                city: shipAddr.city || "",
                state: shipAddr.province || "Kerala",
                pinCode: shipAddr.zip || "",
                phone: shipAddr.phone || customer?.phone || "",
                isDefault: formattedAddresses.length === 0,
              });
            }
          }
        }
      }

      // Combine Admin/Order addresses with server store addresses
      const serverAddrs = getServerCustomerAddresses(cleanEmail);
      for (const sa of serverAddrs) {
        if (!formattedAddresses.some(a => a.id === sa.id || (a.address.toLowerCase() === sa.address.toLowerCase() && a.pinCode === sa.pinCode))) {
          formattedAddresses.push(sa);
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
        addresses: formattedAddresses,
        orders,
      });
    }

    // ─── ACTION: SAVE-ADDRESS ────────────────────────────────────────
    // Save customer address to server database & sync to Shopify Admin DB
    if (action === "save-address") {
      const { email, address } = body;
      if (!email?.trim() || !address) {
        return NextResponse.json({ error: "Email and address are required." }, { status: 400 });
      }
      const cleanEmail = email.trim().toLowerCase();

      // Save persistently to server customer store
      const updatedAddrs = saveServerCustomerAddress(cleanEmail, address);

      if (adminToken) {
        try {
          const searchRes = await adminFetch(ADMIN_SEARCH_CUSTOMER_QUERY, { queryStr: `email:${cleanEmail}` });
          const custNode = searchRes?.data?.customers?.edges?.[0]?.node;
          if (custNode?.id) {
            await adminFetch(ADMIN_CUSTOMER_UPDATE_MUTATION, {
              input: {
                id: custNode.id,
                firstName: address.firstName || custNode.firstName,
                lastName: address.lastName || custNode.lastName,
                phone: address.phone || custNode.phone,
                addresses: [
                  {
                    address1: address.address,
                    city: address.city,
                    province: address.state || "Kerala",
                    zip: address.pinCode,
                    phone: address.phone,
                    firstName: address.firstName,
                    lastName: address.lastName,
                  }
                ]
              }
            });
          }
        } catch (err) {
          console.warn("Failed to sync customer address to Shopify Admin:", err);
        }
      }

      return NextResponse.json({ success: true, addresses: updatedAddrs });
    }

    // ─── ACTION: REMOVE-ADDRESS ──────────────────────────────────────
    if (action === "remove-address") {
      const { email, addressId } = body;
      if (!email?.trim() || !addressId) {
        return NextResponse.json({ error: "Email and addressId are required." }, { status: 400 });
      }
      const cleanEmail = email.trim().toLowerCase();
      const updatedAddrs = removeServerCustomerAddress(cleanEmail, addressId);
      return NextResponse.json({ success: true, addresses: updatedAddrs });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Customer Auth API error:", error);
    return NextResponse.json({ error: error.message || "Authentication failed." }, { status: 500 });
  }
}
