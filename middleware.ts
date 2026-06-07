import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for these paths
  const skipPaths = [
    '/early-access',
    '/api',
    '/_next',
    '/favicon.ico',
    '/images',
    '/static',
  ];

  if (skipPaths.some((path) => pathname.startsWith(path))) {
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
