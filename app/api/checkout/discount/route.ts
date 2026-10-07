import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { validateCouponCode } from "@/lib/checkoutSecurity";
import { getVerifiedSessionEmail } from "@/lib/authSession";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Rate limit protection
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.discount);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { code, items, email, phone } = body;

    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode) {
      return NextResponse.json(
        { valid: false, error: "Please enter a coupon code." },
        { status: 400 }
      );
    }

    // Resolve authenticated customer email if signed in, or use client-provided email
    const sessionEmail = getVerifiedSessionEmail(req);
    const customerEmail = sessionEmail || (typeof email === "string" && email.includes("@") ? email.trim().toLowerCase() : undefined);
    const customerPhone = typeof phone === "string" ? phone.trim() : undefined;

    // SEC-04 Remediation: Validate discount code and enforce first-order restrictions
    const result = await validateCouponCode({
      code: cleanCode,
      items: Array.isArray(items) ? items : undefined,
      customerEmail,
      customerPhone,
    });

    if (result.valid) {
      return NextResponse.json({
        valid: true,
        code: result.code,
        type: result.type || "percentage",
        percentage: result.percentage,
        fixedAmount: result.fixedAmount,
        discountAmount: result.fixedAmount,
        message: result.message || "Coupon applied successfully",
      });
    }

    return NextResponse.json(
      {
        valid: false,
        error: result.error || "Invalid discount code.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Discount API] Unexpected error:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to validate discount code. Please try again.",
      },
      { status: 500 }
    );
  }
}
