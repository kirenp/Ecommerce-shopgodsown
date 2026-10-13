'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

/**
 * Shopify Headless Analytics & Visitor Attribution Tracker
 *
 * Implements standard Shopify headless tracking tokens:
 * - `_shopify_y`: Long-lived unique visitor identifier (1-year cookie)
 * - `_shopify_s`: 30-minute rolling session identifier (session cookie)
 * - `goc_landing`: Captures initial landing URL and UTM parameters for order attribution
 * - `goc_referrer`: Captures external referring site (Meta, Instagram, Google)
 *
 * Also initializes Shopify Customer Privacy API for cross-domain compliance.
 */

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

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

function TrackerLogic() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      // 1. Maintain _shopify_y (Unique Visitor ID, 1 year = 31,536,000s)
      let visitorId = getCookie('_shopify_y');
      if (!visitorId) {
        visitorId = generateUUID();
        setCookie('_shopify_y', visitorId, 31536000);
      }

      // 2. Maintain _shopify_s (Session ID, 30 minutes = 1,800s inactivity timeout)
      let sessionId = getCookie('_shopify_s');
      if (!sessionId) {
        sessionId = generateUUID();
      }
      // Refresh 30-minute session expiry on every page interaction
      setCookie('_shopify_s', sessionId, 1800);

      // 3. Capture initial landing URL and UTM parameters for order attribution
      const existingLanding = getCookie('goc_landing');
      if (!existingLanding && typeof window !== 'undefined') {
        const fullUrl = window.location.href;
        setCookie('goc_landing', fullUrl, 30 * 24 * 3600); // 30 days
      }

      // 4. Capture external referrer if present
      const existingReferrer = getCookie('goc_referrer');
      if (!existingReferrer && typeof document !== 'undefined' && document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          if (referrerUrl.host !== window.location.host) {
            setCookie('goc_referrer', document.referrer, 30 * 24 * 3600);
          }
        } catch {
          // Ignore invalid URL parse
        }
      }
    } catch (err) {
      // Non-blocking fail-safe
    }
  }, [pathname, searchParams]);

  return null;
}

export default function ShopifyAnalyticsTracker() {
  return (
    <>
      {/* Shopify Customer Privacy & Consent Tracking API */}
      <Script
        id="shopify-customer-privacy"
        strategy="afterInteractive"
        src="https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js"
        onLoad={() => {
          try {
            if (typeof window !== 'undefined' && (window as any).Shopify?.customerPrivacy) {
              (window as any).Shopify.customerPrivacy.setTrackingConsent?.(
                {
                  marketing: true,
                  analytics: true,
                  preferences: true,
                  sale_of_data: false,
                  headlessStorefront: true,
                },
                () => {}
              );
            }
          } catch {
            // Non-blocking
          }
        }}
      />

      <Suspense fallback={null}>
        <TrackerLogic />
      </Suspense>
    </>
  );
}
