import { NextRequest, NextResponse } from "next/server";

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
    const returnPathCookie = req.cookies.get("goc_auth_return_url")?.value || searchParams.get("returnPath") || "/dev-preview";
    const authError = searchParams.get("auth_error");
    
    // Determine public origin
    const cookieOrigin = req.cookies.get("goc_auth_origin")?.value;
    const headerHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const headerProto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
    const fallbackOrigin = headerHost ? `${headerProto}://${headerHost}` : req.nextUrl.origin;
    const savedOrigin = (cookieOrigin && !cookieOrigin.includes("b2591201c62c")) ? cookieOrigin : fallbackOrigin;

    const targetUrl = new URL(returnPathCookie, savedOrigin);
    if (authError) {
      targetUrl.searchParams.set("auth_error", authError);
    }

    const response = NextResponse.redirect(targetUrl);

    // Delete all auth session cookies
    response.cookies.delete("goc_auth_session");
    response.cookies.delete("goc_pkce_verifier");
    response.cookies.delete("goc_pkce_state");
    response.cookies.delete("goc_auth_return_url");
    response.cookies.delete("goc_auth_origin");
    response.cookies.delete("goc_auth_intended_email");

    return response;
  } catch (error: any) {
    console.error("Logout callback error:", error);
    return NextResponse.redirect(new URL("/dev-preview", req.url));
  }
}
