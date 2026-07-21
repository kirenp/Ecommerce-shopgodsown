/**
 * Shopify Customer Account API — OAuth 2.0 + PKCE Utilities
 * 
 * Handles authorization URL generation, PKCE code challenge/verifier,
 * token exchange, and session management for Shopify's native OTP email flow.
 */

// Generate a cryptographically random string for PKCE code_verifier
export function generateCodeVerifier(length = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

// Generate a random state parameter for CSRF protection
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Generate a random nonce for OpenID Connect
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Generate PKCE code_challenge from code_verifier (SHA-256 + base64url)
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url (no padding)
  const base64 = btoa(Array.from(new Uint8Array(digest), (byte) => String.fromCharCode(byte)).join(''));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Build Shopify Customer Account API authorization URL
export function buildAuthorizationUrl({
  shopId,
  clientId,
  redirectUri,
  state,
  nonce,
  codeChallenge,
  loginHint,
}: {
  shopId: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  loginHint?: string;
}): string {
  const authUrl = new URL(`https://shopify.com/${shopId}/auth/oauth/authorize`);
  
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', 'openid email https://api.customers.com/auth/customer.graphql');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('nonce', nonce);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  // Force fresh login — prevents Shopify from auto-authenticating with a
  // previously cached session (which causes wrong-email dashboard issues)
  authUrl.searchParams.set('prompt', 'login');
  if (loginHint) {
    authUrl.searchParams.set('login_hint', loginHint);
  }
  
  return authUrl.toString();
}

// Exchange authorization code for access/refresh tokens
export async function exchangeCodeForTokens({
  shopId,
  clientId,
  redirectUri,
  code,
  codeVerifier,
}: {
  shopId: string;
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
} | null> {
  const tokenUrl = `https://shopify.com/${shopId}/auth/oauth/token`;
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Token exchange failed:', res.status, errText);
    return null;
  }

  return res.json();
}

// Refresh the access token using refresh_token
export async function refreshAccessToken({
  shopId,
  clientId,
  refreshToken,
}: {
  shopId: string;
  clientId: string;
  refreshToken: string;
}): Promise<{
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
} | null> {
  const tokenUrl = `https://shopify.com/${shopId}/auth/oauth/token`;
  
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    console.error('Token refresh failed:', res.status);
    return null;
  }

  return res.json();
}

// Fetch customer profile from Customer Account API
export async function fetchCustomerProfile({
  shopId,
  accessToken,
  apiVersion = '2024-10',
}: {
  shopId: string;
  accessToken: string;
  apiVersion?: string;
}): Promise<any> {
  const endpoint = `https://shopify.com/${shopId}/account/customer/api/${apiVersion}/graphql`;
  
  const query = `
    query {
      customer {
        id
        firstName
        lastName
        emailAddress {
          emailAddress
        }
        phoneNumber {
          phoneNumber
        }
        defaultAddress {
          id
          firstName
          lastName
          address1
          address2
          city
          provinceCode
          zip
          phoneNumber
        }
      }
    }
  `;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    console.error('Customer Account API request failed:', res.status);
    return null;
  }

  return res.json();
}
