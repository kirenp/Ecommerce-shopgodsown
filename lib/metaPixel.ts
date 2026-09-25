'use client';

/**
 * Meta Pixel Client-Side Tracking Utilities
 *
 * Provides typed, standardized methods for firing client Meta Pixel events,
 * and passing matching `eventID` for server-side deduplication.
 */

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "948349608317961";

/**
 * Read cookie by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Get Meta click and browser IDs for enhanced server matching
 */
export function getMetaCookies(): { fbp: string | null; fbc: string | null } {
  return {
    fbp: getCookie("_fbp"),
    fbc: getCookie("_fbc"),
  };
}

/**
 * Generic safe runner for window.fbq
 */
export function trackCustomEvent(eventName: string, params?: Record<string, any>, options?: { eventID?: string }) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    if (options?.eventID) {
      window.fbq("trackCustom", eventName, params, { eventID: options.eventID });
    } else {
      window.fbq("trackCustom", eventName, params);
    }
  } catch (e) {
    console.warn(`[Meta Pixel] Error tracking custom event ${eventName}:`, e);
  }
}

/**
 * Track standard PageView event
 */
export function trackPageView() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("track", "PageView");
  } catch (e) {
    console.warn("[Meta Pixel] Error tracking PageView:", e);
  }
}

/**
 * Track ViewContent when a customer views a product detail page
 */
export function trackViewContent(product: {
  id: string | number;
  title: string;
  price: string | number;
  currency?: string;
  category?: string;
}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    const numericPrice = typeof product.price === "string" ? parseFloat(product.price) : product.price;
    window.fbq("track", "ViewContent", {
      content_name: product.title,
      content_ids: [String(product.id)],
      content_type: "product",
      content_category: product.category || "Apparel & Accessories > Clothing",
      value: isNaN(numericPrice) ? 0 : numericPrice,
      currency: product.currency || "INR",
    });
  } catch (e) {
    console.warn("[Meta Pixel] Error tracking ViewContent:", e);
  }
}

/**
 * Track AddToCart when a customer adds an item to cart
 */
export function trackAddToCart(item: {
  id: string | number;
  variantId?: string | number;
  title: string;
  price: string | number;
  currency?: string;
  quantity?: number;
}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    const numericPrice = typeof item.price === "string" ? parseFloat(item.price) : item.price;
    const qty = item.quantity || 1;
    const value = (isNaN(numericPrice) ? 0 : numericPrice) * qty;

    window.fbq("track", "AddToCart", {
      content_name: item.title,
      content_ids: [String(item.variantId || item.id)],
      content_type: "product",
      value,
      currency: item.currency || "INR",
    });
  } catch (e) {
    console.warn("[Meta Pixel] Error tracking AddToCart:", e);
  }
}

/**
 * Track InitiateCheckout when a customer proceeds to checkout
 */
export function trackInitiateCheckout(data: {
  items: Array<{
    id?: string | number;
    variantId?: string | number;
    title?: string;
    price?: string | number;
    quantity?: number;
  }>;
  totalAmount: string | number;
  currency?: string;
}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    const numericTotal = typeof data.totalAmount === "string" ? parseFloat(data.totalAmount) : data.totalAmount;
    const contentIds = data.items.map((i) => String(i.variantId || i.id || "")).filter(Boolean);
    const contents = data.items.map((i) => ({
      id: String(i.variantId || i.id || "item"),
      quantity: i.quantity || 1,
      item_price: parseFloat(String(i.price || "0")),
    }));

    window.fbq("track", "InitiateCheckout", {
      content_ids: contentIds,
      contents,
      content_type: "product",
      num_items: data.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
      value: isNaN(numericTotal) ? 0 : numericTotal,
      currency: data.currency || "INR",
    });
  } catch (e) {
    console.warn("[Meta Pixel] Error tracking InitiateCheckout:", e);
  }
}

/**
 * Track Purchase event on payment success
 * CRITICAL: eventID MUST match the server CAPI event_id for deduplication!
 */
export function trackPurchase(order: {
  orderId: string;
  orderNumber?: string;
  amount: string | number;
  currency?: string;
  items?: Array<{
    id?: string | number;
    variantId?: string | number;
    title?: string;
    price?: string | number;
    quantity?: number;
  }>;
}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    const numericTotal = typeof order.amount === "string" ? parseFloat(order.amount) : order.amount;
    const items = order.items || [];
    const contentIds = items.map((i) => String(i.variantId || i.id || "")).filter(Boolean);
    const contents = items.map((i) => ({
      id: String(i.variantId || i.id || "item"),
      quantity: i.quantity || 1,
      item_price: parseFloat(String(i.price || "0")),
    }));

    const eventParams: Record<string, any> = {
      value: isNaN(numericTotal) ? 0 : numericTotal,
      currency: order.currency || "INR",
      content_type: "product",
      num_items: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
    };

    if (contentIds.length > 0) {
      eventParams.content_ids = contentIds;
      eventParams.contents = contents;
    }

    if (order.orderNumber) {
      eventParams.order_id = order.orderNumber;
    }

    // Deduplication key: pass eventID as 4th parameter to fbq
    window.fbq("track", "Purchase", eventParams, {
      eventID: String(order.orderId),
    });

    console.log(`[Meta Pixel] Fired browser Purchase event with eventID: ${order.orderId}`);
  } catch (e) {
    console.warn("[Meta Pixel] Error tracking Purchase:", e);
  }
}
