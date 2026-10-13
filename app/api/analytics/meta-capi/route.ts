import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/metaConversionsApi";

export const dynamic = "force-dynamic";

/**
 * Meta Conversions API (CAPI) Server Proxy Route
 *
 * Receives client funnel events (PageView, ViewContent, AddToCart, InitiateCheckout)
 * and dispatches them server-to-server to Meta Graph API with matching eventId
 * for seamless deduplication and high Event Match Quality (EMQ).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { eventName, eventId, eventSourceUrl, customData, userData } = body;

    if (!eventName || !eventId) {
      return NextResponse.json({ error: "Missing eventName or eventId" }, { status: 400 });
    }

    // Extract real client IP address (supporting Cloudflare & reverse proxies)
    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const userAgent = req.headers.get("user-agent") || null;

    // Read Meta click and browser cookies from HTTP headers or payload fallback
    const fbp = req.cookies.get("_fbp")?.value || userData?.fbp || null;
    const fbc = req.cookies.get("_fbc")?.value || userData?.fbc || null;

    // Forward event server-side to Meta Conversions API
    const result = await sendMetaCapiEvent({
      eventName,
      eventId: String(eventId),
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: eventSourceUrl || req.headers.get("referer") || "https://shopgodsown.com/",
      actionSource: "website",
      userData: {
        email: userData?.email || null,
        phone: userData?.phone || null,
        firstName: userData?.firstName || null,
        lastName: userData?.lastName || null,
        city: userData?.city || null,
        state: userData?.state || null,
        zip: userData?.zip || null,
        country: userData?.country || "in",
        clientIpAddress: clientIp,
        clientUserAgent: userAgent,
        fbp,
        fbc,
      },
      customData: customData || {},
    });

    return NextResponse.json({
      success: result.success,
      eventsReceived: result.eventsReceived,
      fbtraceId: result.fbtraceId,
      skippedDuplicate: result.skippedDuplicate,
    });
  } catch (error: any) {
    console.error("[Meta CAPI Route] Error processing event:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to dispatch CAPI event" },
      { status: 500 }
    );
  }
}
