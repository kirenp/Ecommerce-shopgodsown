import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieDomain } from "@/lib/shopifyAuth";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/logout
 * 
 * This route is the post_logout_redirect_uri for Shopify's Customer Account API.
 * After Shopify invalidates its domain session on shopify.com, Shopify redirects here.
 * This route clears all local session cookies and redirects back to the storefront.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const returnPathCookie = req.cookies.get("goc_auth_return_url")?.value || searchParams.get("returnPath") || "/";
    const authError = searchParams.get("auth_error");
    const rawMismatchNotice = req.cookies.get("goc_auth_mismatch_notice")?.value;
    const mismatchNotice = rawMismatchNotice ? decodeURIComponent(rawMismatchNotice) : null;
    
    // Determine public origin
    const cookieOrigin = req.cookies.get("goc_auth_origin")?.value;
    const headerHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const headerProto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
    const fallbackOrigin = headerHost ? `${headerProto}://${headerHost}` : req.nextUrl.origin;
    const savedOrigin = (cookieOrigin && !cookieOrigin.includes("b2591201c62c")) ? cookieOrigin : fallbackOrigin;

    const targetUrl = new URL(returnPathCookie, savedOrigin);
    if (mismatchNotice) {
      targetUrl.searchParams.set("auth_error", mismatchNotice);
    } else if (authError) {
      targetUrl.searchParams.set("auth_error", authError);
    }

    const response = NextResponse.redirect(targetUrl);
    const cookieDomain = getAuthCookieDomain(savedOrigin || headerHost || "");

    // Delete all auth session cookies (both host-only and domain-scoped)
    const authCookies = [
      "goc_auth_session",
      "goc_auth_customer",
      "goc_pkce_verifier",
      "goc_pkce_state",
      "goc_auth_return_url",
      "goc_auth_origin",
      "goc_auth_intended_email",
      "goc_auth_redirect_uri",
      "goc_auth_mismatch_notice",
    ];

    for (const name of authCookies) {
      response.cookies.delete(name);
      if (cookieDomain) {
        response.cookies.set(name, "", { maxAge: 0, path: "/", domain: cookieDomain });
      }
    }

    return response;
  } catch (error: any) {
    console.error("Logout callback error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
