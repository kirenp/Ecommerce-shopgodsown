import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = (params?.code || "").trim().toUpperCase();
  const searchParams = req.nextUrl.searchParams;
  const redirectParam = searchParams.get("redirect");

  // Determine redirect target (default to /checkout)
  const targetPath = redirectParam
    ? (redirectParam.startsWith("/") ? redirectParam : `/${redirectParam}`)
    : "/checkout";

  // Resolve public domain (handles reverse proxies, Docker containers, Cloudflare, etc.)
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || "shopgodsown.com";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

  const redirectUrl = new URL(targetPath, `${proto}://${host}`);
  if (code) {
    redirectUrl.searchParams.set("discount", code);
  }

  const response = NextResponse.redirect(redirectUrl.toString(), { status: 307 });

  if (code) {
    // Persist coupon code in cookie for 30 days
    response.cookies.set("godsown_discount_code", code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
  }

  return response;
}
