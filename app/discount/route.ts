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

  const url = new URL(targetPath, req.url);
  if (code) {
    url.searchParams.set("discount", code);
  }

  const response = NextResponse.redirect(url, { status: 307 });

  if (code) {
    response.cookies.set("godsown_discount_code", code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
  }

  return response;
}
