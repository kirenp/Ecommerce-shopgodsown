import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  fetchCustomerProfile,
  buildLogoutUrl,
  getCanonicalAuthOrigin,
  getAuthCookieDomain,
} from "@/lib/shopifyAuth";

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

    // Validate that the authenticated email matches what the user typed
    const intendedEmail = req.cookies.get("goc_auth_intended_email")?.value?.trim().toLowerCase();
    const authenticatedEmail = customerObj.email?.trim().toLowerCase();
    
    if (intendedEmail && authenticatedEmail && intendedEmail !== authenticatedEmail) {
      // Shopify auto-authenticated a different account due to a cached domain cookie on shopify.com.
      // Automatically redirect to Shopify's logout endpoint using the newly issued id_token so that
      // Shopify's domain session is cleanly invalidated without any "Invalid id_token" errors.
      const mismatchNotice = `Shopify session for ${authenticatedEmail} was cleared. Please re-enter ${intendedEmail} to receive your OTP.`;
      
      const canonicalSavedOrigin = getCanonicalAuthOrigin(savedOrigin);
      const postLogoutRedirectUri = `${canonicalSavedOrigin}/api/auth/logout`;

      const logoutUrl = buildLogoutUrl({
        shopId,
        idTokenHint: tokens.id_token,
        postLogoutRedirectUri,
      });

      const mismatchResponse = NextResponse.redirect(logoutUrl);
      const cookieDomain = getAuthCookieDomain(savedOrigin || headerHost || "");

      // Store notice in a short-lived cookie so /api/auth/logout can display it upon return
      mismatchResponse.cookies.set("goc_auth_mismatch_notice", encodeURIComponent(mismatchNotice), {
        path: "/",
        maxAge: 300,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });

      // Clear PKCE and auth session cookies, but preserve goc_auth_return_url and goc_auth_origin
      // so /api/auth/logout knows where to return the user
      const clearAuthCookies = [
        "goc_pkce_verifier",
        "goc_pkce_state",
        "goc_auth_intended_email",
        "goc_auth_redirect_uri",
        "goc_auth_session",
        "goc_auth_customer",
      ];
      for (const name of clearAuthCookies) {
        mismatchResponse.cookies.delete(name);
        if (cookieDomain) {
          mismatchResponse.cookies.set(name, "", { maxAge: 0, path: "/", domain: cookieDomain });
        }
      }
      return mismatchResponse;
    }

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

    // Store sensitive tokens in httpOnly cookie (inaccessible to JavaScript / XSS)
    response.cookies.set("goc_auth_session", JSON.stringify(sessionData), {
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
