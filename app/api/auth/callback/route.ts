import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  fetchCustomerProfile,
  getCanonicalAuthOrigin,
  getAuthCookieDomain,
} from "@/lib/shopifyAuth";
import { createSignedSessionToken } from "@/lib/authSession";

export const dynamic = 'force-dynamic';

const shopId = process.env.SHOPIFY_SHOP_ID || "";
const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "";
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    // Determine public origin (from cookie or headers, avoiding internal container hostnames)
    const cookieOrigin = req.cookies.get("goc_auth_origin")?.value;
    const headerHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const headerProto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
    const fallbackOrigin = headerHost ? `${headerProto}://${headerHost}` : req.nextUrl.origin;
    
    // Use cookieOrigin if available and valid, otherwise fallback
    const savedOrigin = (cookieOrigin && !cookieOrigin.includes("b2591201c62c")) ? cookieOrigin : fallbackOrigin;

    // Retrieve return path from cookie (defaulting to /)
    const returnPathCookie = req.cookies.get("goc_auth_return_url")?.value || "/";
    const returnUrl = new URL(returnPathCookie, savedOrigin);

    // Handle errors from Shopify
    if (error) {
      console.error("Shopify OAuth error:", error, errorDescription);
      returnUrl.searchParams.set("auth_error", errorDescription || error);
      return NextResponse.redirect(returnUrl);
    }

    if (!code) {
      returnUrl.searchParams.set("auth_error", "No authorization code received.");
      return NextResponse.redirect(returnUrl);
    }

    // Get code_verifier and saved state from the query params (passed via cookie)
    const savedVerifier = req.cookies.get("goc_pkce_verifier")?.value;
    const savedState = req.cookies.get("goc_pkce_state")?.value;

    if (!savedVerifier) {
      returnUrl.searchParams.set("auth_error", "Session expired. Please try signing in again.");
      return NextResponse.redirect(returnUrl);
    }

    // Validate state parameter (CSRF protection)
    if (savedState && state !== savedState) {
      returnUrl.searchParams.set("auth_error", "Invalid state parameter. Please try again.");
      return NextResponse.redirect(returnUrl);
    }

    // Determine redirect URI (must match what was used in authorize)
    // Priority: 1) Cookie stored during initiation, 2) env config, 3) computed from canonical origin
    const storedRedirectUri = req.cookies.get("goc_auth_redirect_uri")?.value;
    const configuredRedirect = process.env.SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI;
    const canonicalSavedOrigin = getCanonicalAuthOrigin(savedOrigin);
    const redirectUri = storedRedirectUri || configuredRedirect || `${canonicalSavedOrigin}/api/auth/callback`;

    console.log('[Auth Callback] Token exchange params:', {
      hasCode: !!code,
      hasVerifier: !!savedVerifier,
      redirectUri,
      storedRedirectUri: !!storedRedirectUri,
      savedOrigin,
    });

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens({
      shopId,
      clientId,
      clientSecret,
      redirectUri,
      code,
      codeVerifier: savedVerifier,
    });

    if (!tokens?.access_token) {
      returnUrl.searchParams.set("auth_error", "Failed to exchange authorization code. Please try again.");
      return NextResponse.redirect(returnUrl);
    }

    // Parse id_token JWT claims for verified customer details fallback
    let idTokenPayload: any = null;
    if (tokens.id_token) {
      try {
        const parts = tokens.id_token.split(".");
        if (parts.length >= 2) {
          const jsonStr = Buffer.from(parts[1], "base64url").toString("utf-8");
          idTokenPayload = JSON.parse(jsonStr);
        }
      } catch (e) {
        console.warn("Failed to parse id_token payload:", e);
      }
    }

    // Fetch customer profile from Customer Account API
    let customerData: any = null;
    try {
      const profileRes = await fetchCustomerProfile({
        shopId,
        accessToken: tokens.access_token,
      });
      customerData = profileRes?.data?.customer;
    } catch (err) {
      console.warn("Failed to fetch customer profile from Customer Account API:", err);
    }

    const intendedEmail = req.cookies.get("goc_auth_intended_email")?.value?.trim().toLowerCase();
    const fallbackEmail = idTokenPayload?.email || idTokenPayload?.email_address || intendedEmail || "";
    const fallbackFirstName = idTokenPayload?.given_name || (fallbackEmail ? fallbackEmail.split("@")[0] : "Customer");
    const fallbackLastName = idTokenPayload?.family_name || "";
    const fallbackPhone = idTokenPayload?.phone_number || "";
    const fallbackId = idTokenPayload?.sub || `cust_${Date.now()}`;

    const customerObj = {
      id: customerData?.id || fallbackId,
      firstName: customerData?.firstName || fallbackFirstName,
      lastName: customerData?.lastName || fallbackLastName,
      email: customerData?.emailAddress?.emailAddress || fallbackEmail,
      phone: customerData?.phoneNumber?.phoneNumber || fallbackPhone,
      acceptsMarketing: true,
      tier: "Club Member",
      points: 100,
    };

    // Ensure customer email is populated
    if (!customerObj.email && intendedEmail) {
      customerObj.email = intendedEmail;
    }

    // Enrich customer profile from Shopify Admin API if available
    const resolvedEmail = customerObj.email || intendedEmail;
    if (resolvedEmail) {
      try {
        const domain = process.env.SHOPIFY_STORE_DOMAIN;
        const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN?.startsWith("shpat_") ? process.env.SHOPIFY_PRIVATE_ACCESS_TOKEN : undefined);
        const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";
        if (domain && adminToken) {
          const adminEndpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;
          const adminRes = await fetch(adminEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": adminToken,
            },
            body: JSON.stringify({
              query: `
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
              `,
              variables: { queryStr: `email:${resolvedEmail}` },
            }),
            cache: "no-store",
          });
          const adminData = await adminRes.json();
          const adminCust = adminData?.data?.customers?.edges?.[0]?.node;
          if (adminCust) {
            customerObj.id = adminCust.id || customerObj.id;
            if (adminCust.firstName) customerObj.firstName = adminCust.firstName;
            if (adminCust.lastName) customerObj.lastName = adminCust.lastName;
            if (adminCust.phone) customerObj.phone = adminCust.phone;
            if (adminCust.email) customerObj.email = adminCust.email;
          }
        }
      } catch (err) {
        console.warn("Admin customer profile enrichment notice:", err);
      }
    }

    console.log('[Auth Callback] Successfully authenticated customer:', {
      id: customerObj.id,
      email: customerObj.email,
      firstName: customerObj.firstName,
      lastName: customerObj.lastName,
      intendedEmail,
    });

    // Build customer session data
    const sessionData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      customer: customerObj.email ? customerObj : null,
    };

    // Redirect back to target page with session data in a cookie
    returnUrl.searchParams.set("auth_success", "true");

    const response = NextResponse.redirect(returnUrl);
    const cookieDomain = getAuthCookieDomain(savedOrigin || headerHost || "");

    // Store sensitive tokens in cryptographically signed httpOnly cookie (tamper-proof & inaccessible to JS/XSS)
    response.cookies.set("goc_auth_session", createSignedSessionToken(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in || 7200,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    // Store non-sensitive display data in a JS-accessible cookie for client UI
    const displayData = {
      customer: sessionData.customer,
      expiresAt: sessionData.expiresAt,
    };
    response.cookies.set("goc_auth_customer", JSON.stringify(displayData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in || 7200,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    // Clear PKCE cookies
    const clearTempCookies = [
      "goc_pkce_verifier",
      "goc_pkce_state",
      "goc_auth_return_url",
      "goc_auth_origin",
      "goc_auth_intended_email",
      "goc_auth_redirect_uri",
      "goc_auth_mismatch_notice",
    ];
    for (const name of clearTempCookies) {
      response.cookies.delete(name);
      if (cookieDomain) {
        response.cookies.set(name, "", { maxAge: 0, path: "/", domain: cookieDomain });
      }
    }

    return response;
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    const returnPathCookie = req.cookies.get("goc_auth_return_url")?.value || "/";
    const redirectUrl = new URL(returnPathCookie, req.url);
    redirectUrl.searchParams.set("auth_error", error.message || "Authentication failed.");
    return NextResponse.redirect(redirectUrl);
  }
}
