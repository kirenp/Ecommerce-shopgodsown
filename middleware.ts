import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =========================================================================
  // PRE-LAUNCH WEBSITE ROUTING MIDDLEWARE
  // =========================================================================
  //
  // 1. PUBLIC ROUTES ARE LOCKED BEHIND EARLY ACCESS.
  //    All public traffic requesting standard pages (e.g. "/", "/catalog", "/about",
  //    "/contact") will be redirected to the "/early-access" landing page.
  //
  // 2. DEVELOPER PREVIEW ROUTES ARE ACCESSIBLE ONLY THROUGH "/dev-preview/*".
  //    Routes starting with "/dev-preview" (e.g. "/dev-preview/products", 
  //    "/dev-preview/about", "/dev-preview/contact") will bypass the early-access redirect.
  //
  // 3. LAUNCH DAY ONLY REQUIRES DISABLING THE MIDDLEWARE REDIRECT.
  //    On launch day, to open the site to the public, disable the redirect logic below
  //    or delete this middleware file.
  //
  // =========================================================================

  // Define allowed paths that should bypass the early-access redirect
  const isAllowedPath =
    pathname === '/early-access' ||
    pathname === '/dev-preview' ||
    pathname.startsWith('/dev-preview/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/static') ||
    pathname === '/api/early-access'; // Securely whitelist only this specific signup API, NOT all /api routes.

  if (isAllowedPath) {
    return NextResponse.next();
  }

  // Pre-launch mode: redirect all public visitors to early-access landing page
  const earlyAccessUrl = new URL('/early-access', request.url);
  return NextResponse.redirect(earlyAccessUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
