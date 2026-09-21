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
  // RETIRE /dev-preview — Redirect all preview routes to canonical paths
  // =========================================================================
  if (pathname === '/dev-preview' || pathname === '/dev-preview/') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith('/dev-preview/')) {
    const targetSubpath = pathname.replace(/^\/dev-preview/, '');
    const url = request.nextUrl.clone();
    // Route /dev-preview/products to /catalog, and others to direct subpath
    if (targetSubpath === '/products') {
      url.pathname = '/catalog';
    } else {
      url.pathname = targetSubpath;
    }
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
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
