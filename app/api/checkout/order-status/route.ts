import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { findExistingShopifyOrderByRazorpayId } from "@/lib/shopifyOrder";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.checkout);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  if (!orderId && !paymentId) {
    return NextResponse.json({ error: "Missing orderId or paymentId parameter." }, { status: 400 });
  }

  try {
    const existingOrder = await findExistingShopifyOrderByRazorpayId(orderId || "", paymentId || undefined);

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        processed: true,
        orderId: existingOrder.id,
        orderNumber: existingOrder.name,
        financialStatus: existingOrder.financialStatus || "PAID",
      });
    }

    return NextResponse.json({
      success: true,
      processed: false,
    });
  } catch (err: any) {
    console.error("[Order Status] Lookup error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
