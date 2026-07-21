import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchCustomerProfile } from "@/lib/shopifyAuth";

export const dynamic = 'force-dynamic';

const shopId = process.env.SHOPIFY_SHOP_ID || "";
const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "";

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

    // Retrieve return path from cookie (defaulting to /dev-preview)
    const returnPathCookie = req.cookies.get("goc_auth_return_url")?.value || "/dev-preview";
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
    const redirectUri = `${savedOrigin}/api/auth/callback`;

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens({
      shopId,
      clientId,
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
          const jsonStr = Buffer.from(parts[1], "base64").toString("utf-8");
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

    const fallbackEmail = idTokenPayload?.email || idTokenPayload?.email_address || "";
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

    // Store session in a secure cookie
    response.cookies.set("goc_auth_session", JSON.stringify(sessionData), {
      httpOnly: false, // Need JS access for client-side context
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in || 7200, // 2 hours default
      path: "/",
    });

    // Clear PKCE cookies
    response.cookies.delete("goc_pkce_verifier");
    response.cookies.delete("goc_pkce_state");
    response.cookies.delete("goc_auth_return_url");
    response.cookies.delete("goc_auth_origin");

    return response;
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    const returnPathCookie = req.cookies.get("goc_auth_return_url")?.value || "/dev-preview";
    const redirectUrl = new URL(returnPathCookie, req.url);
    redirectUrl.searchParams.set("auth_error", error.message || "Authentication failed.");
    return NextResponse.redirect(redirectUrl);
  }
}
