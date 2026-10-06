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

  const url = new URL(targetPath, req.url);
  if (code) {
    url.searchParams.set("discount", code);
  }

  const response = NextResponse.redirect(url, { status: 307 });

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
