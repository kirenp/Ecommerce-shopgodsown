import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =========================================================================
  // CSRF PROTECTION — Validate Origin/Referer for POST requests to API routes
  // (Exempt server-to-server webhook endpoints like /api/webhooks which use HMAC)
  // =========================================================================
  if (request.method === "POST" && pathname.startsWith("/api") && !pathname.startsWith("/api/webhooks")) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";

    const TRUSTED_PRODUCTION_HOSTS = new Set(["shopgodsown.com", "www.shopgodsown.com"]);
    const TRUSTED_DEV_HOSTS = new Set(["localhost", "127.0.0.1"]);

    const isHostAllowed = (candidateHost: string, targetHost: string): boolean => {
      const cleanCandidate = candidateHost.split(":")[0].toLowerCase();
      const cleanTarget = targetHost.split(":")[0].toLowerCase();

      if (cleanCandidate === cleanTarget) return true;

      // Allow cross-communication between explicitly authorized production aliases
      if (TRUSTED_PRODUCTION_HOSTS.has(cleanCandidate) && TRUSTED_PRODUCTION_HOSTS.has(cleanTarget)) {
        return true;
      }

      // Allow local development port variations
      if (TRUSTED_DEV_HOSTS.has(cleanCandidate) && TRUSTED_DEV_HOSTS.has(cleanTarget)) {
        return true;
      }

      return false;
    };

    let isAllowed = false;
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        isAllowed = isHostAllowed(originHost, host);
      } catch {}
    } else if (referer) {
      try {
        const refererHost = new URL(referer).host;
        isAllowed = isHostAllowed(refererHost, host);
      } catch {}
    } else {
      // Allow requests without Origin/Referer (e.g. server-to-server, curl, non-browser)
      isAllowed = true;
    }

    if (origin && !isAllowed) {
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

  // =========================================================================
  // SHOPIFY HOSTED URLS (Order Status, Authenticate, Checkout, etc.)
  // When Shopify sends transactional emails (Order delivered, confirmed, etc.)
  // it uses the store's primary domain (shopgodsown.com) with Shopify paths like
  // /65346109534/orders/... or /orders/.../authenticate
  // Forward these requests directly to the Shopify store domain so customers can
  // view their official order tracking, authentication, and status page.
  // =========================================================================
  const shopifyStoreDomain = process.env.SHOPIFY_STORE_DOMAIN || 'godsown-9751.myshopify.com';

  const isShopifyPath =
    /^\/\d+(\/.*)?$/.test(pathname) || // e.g. /65346109534/orders/..., /65346109534/...
    /^\/orders\/[^\/]+\/authenticate\b/.test(pathname) ||
    /^\/checkouts(\/.*)?$/.test(pathname);

  if (isShopifyPath) {
    const targetUrl = new URL(`https://${shopifyStoreDomain}${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(targetUrl, 307);
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
