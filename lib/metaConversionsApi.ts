import { createHash } from "crypto";

/**
 * Meta Conversions API (CAPI) Server Utility
 *
 * Implements Meta Conversions API standard for server-side event tracking,
 * complete with SHA-256 PII hashing, Event Match Quality (EMQ) optimization,
 * and event_id deduplication matching client-side Meta Pixel events.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "948349608317961";
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
const API_VERSION = process.env.META_API_VERSION || "v20.0";
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

// In-memory cache to prevent duplicate server event transmissions (e.g. from checkout/complete AND webhook)
const sentEventsCache = new Map<string, number>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function cleanCache() {
  const now = Date.now();
  sentEventsCache.forEach((timestamp, key) => {
    if (now - timestamp > CACHE_TTL_MS) {
      sentEventsCache.delete(key);
    }
  });
}

/**
 * Compute SHA-256 hash of a normalized string
 */
export function hashSha256(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
}

/**
 * Normalize and hash email address according to Meta specification:
 * Trim leading/trailing whitespace, convert to lowercase, SHA-256 hash.
 */
export function normalizeEmail(email?: string | null): string[] | undefined {
  if (!email || typeof email !== "string") return undefined;
  const cleaned = email.trim().toLowerCase();
  if (!cleaned.includes("@")) return undefined;
  return [hashSha256(cleaned)];
}

/**
 * Normalize and hash phone number according to Meta specification:
 * Remove symbols, spaces, dashes. Ensure country code (default 91 for India).
 */
export function normalizePhone(phone?: string | null): string[] | undefined {
  if (!phone || typeof phone !== "string") return undefined;
  // Remove non-digit characters
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  // Handle Indian phone formats
  if (digits.length === 10) {
    digits = "91" + digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = "91" + digits.substring(1);
  }

  return [hashSha256(digits)];
}

/**
 * Normalize and hash name (first name or last name)
 */
export function normalizeName(name?: string | null): string[] | undefined {
  if (!name || typeof name !== "string") return undefined;
  const cleaned = name.trim().toLowerCase().replace(/[^a-z\s]/g, "");
  if (!cleaned) return undefined;
  return [hashSha256(cleaned)];
}

/**
 * Normalize city: lowercase, remove punctuation and spaces
 */
export function normalizeCity(city?: string | null): string[] | undefined {
  if (!city || typeof city !== "string") return undefined;
  const cleaned = city.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return undefined;
  return [hashSha256(cleaned)];
}

/**
 * Normalize state: lowercase, remove spaces/punctuation
 */
export function normalizeState(state?: string | null): string[] | undefined {
  if (!state || typeof state !== "string") return undefined;
  const cleaned = state.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return undefined;
  return [hashSha256(cleaned)];
}

/**
 * Normalize zip / pincode: lowercase, alphanumeric
 */
export function normalizeZip(zip?: string | null): string[] | undefined {
  if (!zip || typeof zip !== "string") return undefined;
  const cleaned = zip.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return undefined;
  return [hashSha256(cleaned)];
}

/**
 * Normalize country code: lowercase 2-letter ISO code (e.g. "in")
 */
export function normalizeCountry(country?: string | null): string[] | undefined {
  if (!country || typeof country !== "string") return [hashSha256("in")];
  const cleaned = country.trim().toLowerCase();
  if (cleaned === "india" || cleaned === "ind" || cleaned === "in") {
    return [hashSha256("in")];
  }
  return [hashSha256(cleaned.slice(0, 2))];
}

export interface MetaCapiUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface MetaCapiItem {
  id: string | number;
  quantity?: number;
  item_price?: number;
  title?: string;
}

export interface MetaCapiEventInput {
  eventName: "Purchase" | "InitiateCheckout" | "AddToCart" | "ViewContent" | string;
  eventId: string; // Required for deduplication with browser pixel
  eventTime?: number; // Unix timestamp in seconds
  eventSourceUrl?: string;
  actionSource?: "website" | "app" | "physical_store" | "system_generated" | "other";
  userData: MetaCapiUserData;
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
    contentType?: string;
    numItems?: number;
    orderId?: string;
    [key: string]: any;
  };
}

/**
 * Core function to send an event payload to Meta Conversions API
 */
export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<{
  success: boolean;
  eventsReceived?: number;
  fbtraceId?: string;
  skippedDuplicate?: boolean;
  error?: string;
}> {
  if (!ACCESS_TOKEN) {
    console.warn("[Meta CAPI] META_CONVERSIONS_API_ACCESS_TOKEN is not configured. Skipping server event dispatch.");
    return { success: false, error: "Access token not configured." };
  }

  // Deduplication check
  cleanCache();
  const dedupKey = `${input.eventName}_${input.eventId}`;
  if (sentEventsCache.has(dedupKey)) {
    console.log(`[Meta CAPI] Event ${dedupKey} was already sent within the past hour. Skipping duplicate server dispatch.`);
    return { success: true, skippedDuplicate: true };
  }

  try {
    const eventTime = input.eventTime || Math.floor(Date.now() / 1000);

    // Build user_data object adhering to Meta specifications
    const userDataPayload: Record<string, any> = {};

    const em = normalizeEmail(input.userData.email);
    if (em) userDataPayload.em = em;

    const ph = normalizePhone(input.userData.phone);
    if (ph) userDataPayload.ph = ph;

    const fn = normalizeName(input.userData.firstName);
    if (fn) userDataPayload.fn = fn;

    const ln = normalizeName(input.userData.lastName);
    if (ln) userDataPayload.ln = ln;

    const ct = normalizeCity(input.userData.city);
    if (ct) userDataPayload.ct = ct;

    const st = normalizeState(input.userData.state);
    if (st) userDataPayload.st = st;

    const zp = normalizeZip(input.userData.zip);
    if (zp) userDataPayload.zp = zp;

    const country = normalizeCountry(input.userData.country);
    if (country) userDataPayload.country = country;

    if (input.userData.externalId) {
      userDataPayload.external_id = [hashSha256(String(input.userData.externalId))];
    }

    // Non-hashed parameters for browser/session matching
    if (input.userData.clientIpAddress) {
      userDataPayload.client_ip_address = input.userData.clientIpAddress;
    }
    if (input.userData.clientUserAgent) {
      userDataPayload.client_user_agent = input.userData.clientUserAgent;
    }
    if (input.userData.fbp) {
      userDataPayload.fbp = input.userData.fbp;
    }
    if (input.userData.fbc) {
      userDataPayload.fbc = input.userData.fbc;
    }

    // Build custom_data
    const customDataPayload: Record<string, any> = {};
    if (input.customData) {
      if (input.customData.value !== undefined) {
        customDataPayload.value = Number(input.customData.value);
      }
      if (input.customData.currency) {
        customDataPayload.currency = input.customData.currency;
      }
      if (input.customData.contentName) {
        customDataPayload.content_name = input.customData.contentName;
      }
      if (input.customData.contentCategory) {
        customDataPayload.content_category = input.customData.contentCategory;
      }
      if (input.customData.contentType) {
        customDataPayload.content_type = input.customData.contentType;
      }
      if (input.customData.contentIds && input.customData.contentIds.length > 0) {
        customDataPayload.content_ids = input.customData.contentIds;
      }
      if (input.customData.contents && input.customData.contents.length > 0) {
        customDataPayload.contents = input.customData.contents;
      }
      if (input.customData.numItems !== undefined) {
        customDataPayload.num_items = input.customData.numItems;
      }
      if (input.customData.orderId) {
        customDataPayload.order_id = input.customData.orderId;
      }
    }

    const eventPayload: Record<string, any> = {
      event_name: input.eventName,
      event_time: eventTime,
      event_id: input.eventId,
      action_source: input.actionSource || "website",
      user_data: userDataPayload,
      opt_out: false,
    };

    if (input.eventSourceUrl) {
      eventPayload.event_source_url = input.eventSourceUrl;
    }

    if (Object.keys(customDataPayload).length > 0) {
      eventPayload.custom_data = customDataPayload;
    }

    const requestBody: Record<string, any> = {
      data: [eventPayload],
    };

    if (TEST_EVENT_CODE) {
      requestBody.test_event_code = TEST_EVENT_CODE;
    }

    const endpoint = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("[Meta CAPI] Error response from Meta API:", {
        status: res.status,
        error: responseData.error,
      });
      return {
        success: false,
        error: responseData.error?.message || "Failed to send Meta CAPI event.",
        fbtraceId: responseData.error?.fbtrace_id,
      };
    }

    // Mark as sent in memory cache
    sentEventsCache.set(dedupKey, Date.now());

    console.log(`[Meta CAPI] Successfully sent ${input.eventName} event (ID: ${input.eventId}). Received: ${responseData.events_received}, Trace: ${responseData.fbtrace_id}`);

    return {
      success: true,
      eventsReceived: responseData.events_received,
      fbtraceId: responseData.fbtrace_id,
    };
  } catch (error: any) {
    console.error("[Meta CAPI] Unexpected error sending event:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Internal network error sending CAPI event.",
    };
  }
}

/**
 * Dedicated helper to format and send a Purchase event from server
 */
export async function sendMetaPurchaseEvent({
  orderId,
  orderNumber,
  amount,
  currency = "INR",
  items,
  customer,
  reqContext,
}: {
  orderId: string;
  orderNumber?: string;
  amount: number | string;
  currency?: string;
  items: Array<{
    id?: string | number;
    variantId?: string | number;
    title?: string;
    price?: number | string;
    quantity?: number;
  }>;
  customer: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  };
  reqContext?: {
    ip?: string | null;
    userAgent?: string | null;
    fbp?: string | null;
    fbc?: string | null;
    url?: string | null;
  };
}) {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  const contentIds = items.map((item) =>
    String(item.variantId || item.id || "")
  ).filter(Boolean);

  const contents = items.map((item) => ({
    id: String(item.variantId || item.id || "item"),
    quantity: Math.max(1, Number(item.quantity) || 1),
    item_price: parseFloat(String(item.price || "0")),
  }));

  const totalItems = contents.reduce((acc, curr) => acc + curr.quantity, 0);

  return sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: String(orderId),
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: reqContext?.url || "https://shopgodsown.com/checkout",
    actionSource: "website",
    userData: {
      email: customer.email,
      phone: customer.phone,
      firstName: customer.firstName,
      lastName: customer.lastName,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      country: customer.country,
      clientIpAddress: reqContext?.ip,
      clientUserAgent: reqContext?.userAgent,
      fbp: reqContext?.fbp,
      fbc: reqContext?.fbc,
      externalId: customer.email || orderId,
    },
    customData: {
      value: isNaN(numericAmount) ? 0 : numericAmount,
      currency: currency.toUpperCase(),
      contentType: "product",
      contentIds,
      contents,
      numItems: totalItems,
      orderId: orderNumber || String(orderId),
    },
  });
}
