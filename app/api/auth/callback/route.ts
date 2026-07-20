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
    // Retrieve return path from cookie (defaulting to /dev-preview)
    const returnPathCookie = req.cookies.get("goc_auth_return_url")?.value || "/dev-preview";
    const returnUrl = new URL(returnPathCookie, req.url);

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
    const origin = req.headers.get("x-forwarded-proto") 
      ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get("host")}`
      : `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const redirectUri = `${origin}/api/auth/callback`;

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

    // Build customer session data
    const sessionData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      customer: customerData ? {
        id: customerData.id,
        firstName: customerData.firstName || "",
        lastName: customerData.lastName || "",
        email: customerData.emailAddress?.emailAddress || "",
        phone: customerData.phoneNumber?.phoneNumber || "",
        acceptsMarketing: true,
        tier: "Club Member",
        points: 100,
      } : null,
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

    return response;
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    const returnPathCookie = req.cookies.get("goc_auth_return_url")?.value || "/dev-preview";
    const redirectUrl = new URL(returnPathCookie, req.url);
    redirectUrl.searchParams.set("auth_error", error.message || "Authentication failed.");
    return NextResponse.redirect(redirectUrl);
  }
}
