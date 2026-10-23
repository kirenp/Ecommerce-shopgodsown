import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SHOPIFY_MONORAIL_URL = 'https://monorail-edge.shopifysvc.com/unstable/produce_batch';

/**
 * Server-side fallback proxy for Shopify Monorail batch events.
 * Used when strict client-side ad-blockers block direct network requests to *.shopifysvc.com.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: 'Missing body' }, { status: 400 });
    }

    const res = await fetch(SHOPIFY_MONORAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: rawBody,
      cache: 'no-store',
    });

    return new NextResponse(null, { status: res.status });
  } catch (err: any) {
    console.debug('[ShopifyAnalytics Proxy] Error forwarding to Monorail:', err?.message);
    return NextResponse.json({ error: 'Proxy dispatch failed' }, { status: 500 });
  }
}
