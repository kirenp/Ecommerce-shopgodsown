import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =========================================================================
  // CSRF PROTECTION — Validate Origin/Referer for POST requests to API routes
  // =========================================================================
  if (request.method === "POST" && pathname.startsWith("/api")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || "";

    // Determine if the request is from the same origin
    let isSameOrigin = false;
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        isSameOrigin = originHost === host;
      } catch {}
    } else if (referer) {
      try {
        const refererHost = new URL(referer).host;
        isSameOrigin = refererHost === host;
      } catch {}
    }

    // Allow requests without Origin header (e.g., server-to-server, same-origin form posts in some browsers)
    // Block requests with a known cross-origin Origin header
    if (origin && !isSameOrigin) {
      return NextResponse.json(
        { error: "Cross-origin request blocked." },
        { status: 403 }
      );
    }
  }

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
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/static');

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
