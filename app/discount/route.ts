import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = (
    searchParams.get("code") ||
    searchParams.get("discount") ||
    searchParams.get("coupon") ||
    ""
  ).trim().toUpperCase();
  const redirectParam = searchParams.get("redirect");

  const targetPath = redirectParam
    ? (redirectParam.startsWith("/") ? redirectParam : `/${redirectParam}`)
    : "/checkout";

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || "shopgodsown.com";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

  const redirectUrl = new URL(targetPath, `${proto}://${host}`);
  if (code) {
    redirectUrl.searchParams.set("discount", code);
  }

  const response = NextResponse.redirect(redirectUrl.toString(), { status: 307 });

  if (code) {
    response.cookies.set("godsown_discount_code", code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
  }

  return response;
}
