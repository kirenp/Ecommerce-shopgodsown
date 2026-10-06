import { NextRequest, NextResponse } from "next/server";

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

  // Delete httpOnly session cookie
  response.cookies.delete("goc_auth_session");
  // Also delete the client-accessible display cookie as backup
  response.cookies.delete("goc_auth_customer");
  // Clear any leftover PKCE/auth cookies
  response.cookies.delete("goc_pkce_verifier");
  response.cookies.delete("goc_pkce_state");
  response.cookies.delete("goc_auth_origin");
  response.cookies.delete("goc_auth_return_url");
  response.cookies.delete("goc_auth_intended_email");
  response.cookies.delete("goc_auth_redirect_uri");

  return response;
}
