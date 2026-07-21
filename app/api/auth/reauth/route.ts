import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/reauth
 * 
 * This route is the post_logout_redirect_uri for Shopify's logout endpoint.
 * After Shopify clears its cached browser session, it redirects here.
 * We then redirect the user to the Shopify OAuth authorization URL
 * (stored in a cookie) so they get a fresh login screen for the correct email.
 */
export async function GET(req: NextRequest) {
  try {
    const authUrl = req.cookies.get("goc_pending_auth_url")?.value;

    if (!authUrl) {
      // No pending auth URL — redirect to home
      const origin = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || "http";
      return NextResponse.redirect(new URL("/dev-preview", `${proto}://${origin}`));
    }

    // Redirect to Shopify OAuth authorization URL (fresh session, correct email)
    const response = NextResponse.redirect(authUrl);
    // Clean up the pending auth URL cookie
    response.cookies.delete("goc_pending_auth_url");
    return response;
  } catch (error: any) {
    console.error("Reauth redirect error:", error);
    return NextResponse.json({ error: "Failed to redirect to authentication." }, { status: 500 });
  }
}
