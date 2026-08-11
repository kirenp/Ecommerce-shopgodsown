/**
 * Lightweight in-memory sliding window rate limiter.
 * Uses IP-based tracking. Suitable for single-instance deployments.
 * For multi-instance (e.g. Kubernetes), replace with Redis-backed solution.
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  const keys = Array.from(store.keys());
  for (const key of keys) {
    const entry = store.get(key);
    if (!entry) continue;
    entry.timestamps = entry.timestamps.filter((t: number) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Get the client IP from a NextRequest.
 * Checks x-forwarded-for (reverse proxies), x-real-ip, then falls back to "unknown".
 */
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Route identifier for key namespacing */
  routeKey: string;
}

/**
 * Check if a request is rate limited.
 * Returns null if allowed, or a NextResponse (429) if rate limited.
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${config.routeKey}:${ip}`;
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t: number) => t > cutoff);

  if (entry.timestamps.length >= config.maxRequests) {
    const retryAfter = Math.ceil(
      (entry.timestamps[0] + config.windowMs - now) / 1000
    );
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  entry.timestamps.push(now);
  return null; // Allowed
}

/** Pre-configured rate limit configs for common routes */
export const RATE_LIMITS = {
  checkout: { maxRequests: 10, windowMs: 60_000, routeKey: "checkout" },
  contact: { maxRequests: 5, windowMs: 60_000, routeKey: "contact" },
  auth: { maxRequests: 15, windowMs: 60_000, routeKey: "auth" },
  earlyAccess: { maxRequests: 10, windowMs: 60_000, routeKey: "early-access" },
  trackOrder: { maxRequests: 15, windowMs: 60_000, routeKey: "track-order" },
  instagram: { maxRequests: 30, windowMs: 60_000, routeKey: "instagram" },
} as const;
