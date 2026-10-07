import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieDomain } from "@/lib/shopifyAuth";

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/clear-session
 * 
 * Server-side endpoint to clear httpOnly auth cookies that cannot be
 * deleted from client-side JavaScript. Called during logout and before
 * re-initiating a new OAuth flow.
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const cookieDomain = getAuthCookieDomain(host);

  const authCookies = [
    "goc_auth_session",
    "goc_auth_customer",
    "goc_pkce_verifier",
    "goc_pkce_state",
    "goc_auth_origin",
    "goc_auth_return_url",
    "goc_auth_intended_email",
    "goc_auth_redirect_uri",
    "goc_auth_mismatch_notice",
  ];

  for (const name of authCookies) {
    response.cookies.delete(name);
    response.cookies.set(name, "", { maxAge: 0, path: "/", expires: new Date(0) });
    if (cookieDomain) {
      response.cookies.set(name, "", { maxAge: 0, path: "/", domain: cookieDomain, expires: new Date(0) });
    }
  }

  return response;
}
