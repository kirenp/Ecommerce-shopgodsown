'use client';

/**
 * Shopify Headless Analytics & Monorail Telemetry Client
 *
 * Implements Shopify's official custom storefront analytics schema (`custom_storefront_customer_tracking/1.2`)
 * and dispatches event batches directly to Shopify Monorail (`monorail-edge.shopifysvc.com/unstable/produce_batch`).
 *
 * This populates:
 * 1. Shopify Live View ("Site visitors right now")
 * 2. Shopify Online Store Sessions & Referrals
 * 3. Conversion Funnel (Page View -> Product View -> Add to Cart -> Purchase)
 */

export const SHOPIFY_SHOP_ID =
  process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID || '65346109534';
export const SHOPIFY_MONORAIL_URL =
  'https://monorail-edge.shopifysvc.com/unstable/produce_batch';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

/**
 * Retrieve or generate Shopify tracking tokens (_shopify_y and _shopify_s)
 */
export function getOrCreateShopifyTokens(): { visitorId: string; sessionId: string } {
  if (typeof window === 'undefined') {
    return { visitorId: '', sessionId: '' };
  }

  // 1. Visitor ID (_shopify_y, 1 year)
  let visitorId = getCookie('_shopify_y');
  if (!visitorId) {
    try {
      visitorId = localStorage.getItem('goc_shopify_y') || '';
    } catch {}
  }
  if (!visitorId) {
    visitorId = generateUUID();
  }
  setCookie('_shopify_y', visitorId, 31536000); // 1 year
  try {
    localStorage.setItem('goc_shopify_y', visitorId);
  } catch {}

  // 2. Session ID (_shopify_s, 30 min rolling expiry)
  let sessionId = getCookie('_shopify_s');
  if (!sessionId) {
    sessionId = generateUUID();
  }
  // Refresh 30-minute inactivity timeout
  setCookie('_shopify_s', sessionId, 1800);

  return { visitorId, sessionId };
}

/**
 * Core event dispatcher to Shopify Monorail ingestion pipeline
 */
export async function sendShopifyMonorailEvent(
  eventName: string,
  extraPayload: Record<string, any> = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const { visitorId, sessionId } = getOrCreateShopifyTokens();
    if (!visitorId || !sessionId) return;

    const eventTime = Date.now();
    const eventId = generateUUID();
    const currentUrl = window.location.href;
    const referrer = document.referrer || '';
    const userAgent = navigator.userAgent || '';

    const payload = {
      source: 'headless',
      shop_id: Number(SHOPIFY_SHOP_ID),
      hydrogenSubchannelId: '0',
      is_persistent_cookie: true,
      unique_token: visitorId,
      deprecated_visit_token: sessionId,
      event_time: eventTime,
      event_id: eventId,
      event_source_url: currentUrl,
      referrer,
      user_agent: userAgent,
      currency: 'INR',
      event_name: eventName,
      ccpa_enforced: false,
      gdpr_enforced: false,
      hasUserConsent: true,
      analytics_allowed: true,
      marketing_allowed: true,
      ...extraPayload,
    };

    const batchBody = JSON.stringify({
      events: [
        {
          schema_id: 'custom_storefront_customer_tracking/1.2',
          payload,
          metadata: {
            event_created_at_ms: eventTime,
          },
        },
      ],
      metadata: {
        event_sent_at_ms: eventTime,
      },
    });

    // Strategy 1: Attempt native navigator.sendBeacon with text/plain blob (fastest, unblocks navigation)
    let beaconSent = false;
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([batchBody], { type: 'text/plain' });
        beaconSent = navigator.sendBeacon(SHOPIFY_MONORAIL_URL, blob);
      } catch (e) {
        beaconSent = false;
      }
    }

    // Strategy 2: If sendBeacon failed or was not supported, use fetch with keepalive: true
    if (!beaconSent) {
      fetch(SHOPIFY_MONORAIL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: batchBody,
        keepalive: true,
        mode: 'cors',
      }).catch(() => {
        // Fallback: If client is blocked by strict adblocker, send through Next.js proxy
        try {
          fetch('/api/analytics/shopify', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: batchBody,
            keepalive: true,
          }).catch(() => {});
        } catch {}
      });
    }
  } catch (err) {
    // Fail-safe: Never block UI for analytics
    console.debug('[ShopifyAnalytics] Event dispatch exception:', err);
  }
}

/**
 * Track Page View event for Shopify Analytics & Live View
 */
export function trackShopifyPageView(customUrl?: string) {
  sendShopifyMonorailEvent('page_view', {
    ...(customUrl ? { event_source_url: customUrl } : {}),
  });
}

/**
 * Track Product View event for Shopify Analytics
 */
export function trackShopifyProductView(product: {
  id: string | number;
  title: string;
  price: string | number;
  variantId?: string | number;
}) {
  const numericPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const rawId = String(product.id || '');
  const productGid = rawId.startsWith('gid://') ? rawId : `gid://shopify/Product/${rawId}`;

  const productObj = {
    product_gid: productGid,
    name: product.title,
    price: isNaN(numericPrice) ? '0' : String(numericPrice),
    quantity: 1,
    ...(product.variantId ? { variant_gid: String(product.variantId) } : {}),
  };

  sendShopifyMonorailEvent('product_view', {
    products: [JSON.stringify(productObj)],
  });
}

/**
 * Track Add to Cart event for Shopify Analytics
 */
export function trackShopifyAddToCart(item: {
  id: string | number;
  title: string;
  price: string | number;
  variantId?: string | number;
  quantity?: number;
}) {
  const numericPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
  const rawId = String(item.id || '');
  const productGid = rawId.startsWith('gid://') ? rawId : `gid://shopify/Product/${rawId}`;

  const productObj = {
    product_gid: productGid,
    name: item.title,
    price: isNaN(numericPrice) ? '0' : String(numericPrice),
    quantity: item.quantity || 1,
    ...(item.variantId ? { variant_gid: String(item.variantId) } : {}),
  };

  sendShopifyMonorailEvent('product_added_to_cart', {
    products: [JSON.stringify(productObj)],
  });
}

/**
 * Track Collection / Catalog View event for Shopify Analytics
 */
export function trackShopifyCollectionView(collectionId: string | number) {
  const rawId = String(collectionId);
  const collectionGid = rawId.startsWith('gid://') ? rawId : `gid://shopify/Collection/${rawId}`;

  sendShopifyMonorailEvent('collection_view', {
    collection_id: collectionGid,
  });
}

/**
 * Track Search Submitted event for Shopify Analytics
 */
export function trackShopifySearch(searchTerm: string) {
  if (!searchTerm || !searchTerm.trim()) return;

  sendShopifyMonorailEvent('search_submitted', {
    search_term: searchTerm.trim(),
  });
}
