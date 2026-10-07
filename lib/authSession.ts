import crypto from "crypto";
import type { NextRequest } from "next/server";

export interface CustomerSessionData {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    acceptsMarketing?: boolean;
    tier?: string;
    points?: number;
  } | null;
}

/**
 * Derives a strong, server-only secret for signing customer authentication sessions.
 * Never accessible or revealed to the client.
 */
function getSessionSigningSecret(): string {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.SHOPIFY_CLIENT_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
    "goc_secure_session_signing_key_2026";
  return secret;
}

/**
 * Cryptographically signs a session object using HMAC-SHA256.
 * Format: `<base64url-payload>.<hmac-sha256-signature>`
 */
export function createSignedSessionToken(data: CustomerSessionData): string {
  const payloadStr = JSON.stringify(data);
  const payloadB64 = Buffer.from(payloadStr, "utf8").toString("base64url");
  const secret = getSessionSigningSecret();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token.
 * Returns the decoded CustomerSessionData if signature is valid and unexpired,
 * or null if missing, forged, corrupted, or expired.
 */
export function verifySessionToken(token: string): CustomerSessionData | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const secret = getSessionSigningSecret();
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  // Constant-time comparison to prevent timing side-channel attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const session: CustomerSessionData = JSON.parse(jsonStr);

    if (!session || typeof session !== "object") return null;

    // Check expiration
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session from the incoming request's `goc_auth_session` cookie.
 * Returns CustomerSessionData if verified, or null if missing/invalid/forged.
 */
export function getVerifiedSession(req: NextRequest): CustomerSessionData | null {
  const cookieValue = req.cookies.get("goc_auth_session")?.value;
  if (!cookieValue) return null;
  return verifySessionToken(cookieValue);
}

/**
 * Retrieves the cryptographically verified customer email from the session cookie.
 * Returns the lowercase email string or null.
 */
export function getVerifiedSessionEmail(req: NextRequest): string | null {
  const session = getVerifiedSession(req);
  if (!session?.customer?.email) return null;
  return session.customer.email.trim().toLowerCase();
}
