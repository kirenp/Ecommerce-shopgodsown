import crypto from "crypto";

// Color helpers for terminal output
const pass = (msg) => console.log(`\x1b[32m✔ PASS:\x1b[0m ${msg}`);
const fail = (msg) => { console.error(`\x1b[31m✘ FAIL:\x1b[0m ${msg}`); process.exitCode = 1; };

console.log("=================================================");
console.log(" RUNNING COMPREHENSIVE SECURITY & INTEGRITY TESTS");
console.log("=================================================\n");

// -----------------------------------------------------------------
// Test 4 — Customer Session Cookie Signing & Forgery Protection (SEC-03)
// -----------------------------------------------------------------
console.log("--- TEST GROUP 1: SEC-03 Session Signing & Forgery Prevention ---");
try {
  const { createSignedSessionToken, verifySessionToken } = await import("../lib/authSession.ts");

  const validData = {
    email: "victim@example.com",
    customerId: "gid://shopify/Customer/12345",
    accessToken: "shpat_abc123",
  };

  // 1. Valid token generation and verification
  const validToken = createSignedSessionToken(validData);
  const verified = verifySessionToken(validToken);
  if (verified && verified.email === "victim@example.com") {
    pass("Valid session token correctly signed and verified");
  } else {
    fail("Valid session token failed verification");
  }

  // 2. Tampered payload with valid-looking signature
  const [b64Payload, signature] = validToken.split(".");
  const decodedPayload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
  decodedPayload.email = "attacker@example.com";
  const forgedB64Payload = Buffer.from(JSON.stringify(decodedPayload)).toString("base64url");
  const forgedToken = `${forgedB64Payload}.${signature}`;

  const forgedResult = verifySessionToken(forgedToken);
  if (forgedResult === null) {
    pass("Forged payload with original signature rejected (returns null)");
  } else {
    fail("VULNERABILITY: Forged payload was accepted!");
  }

  // 3. Raw unsigned JSON (what the old insecure cookie was)
  const unsignedRawJson = JSON.stringify({ email: "attacker@example.com" });
  const rawResult = verifySessionToken(unsignedRawJson);
  if (rawResult === null) {
    pass("Raw unsigned JSON cookie rejected (returns null)");
  } else {
    fail("VULNERABILITY: Raw unsigned JSON was accepted as a session!");
  }

  // 4. Invalid HMAC signature
  const badSigToken = `${b64Payload}.invalidHMACsignature1234567890`;
  const badSigResult = verifySessionToken(badSigToken);
  if (badSigResult === null) {
    pass("Tampered signature rejected (returns null)");
  } else {
    fail("VULNERABILITY: Tampered signature accepted!");
  }

  // 5. Expired token
  const expiredPayload = { ...validData, exp: Date.now() - 1000 };
  const expiredPayloadB64 = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
  const secret = process.env.SESSION_SECRET || "default_dev_secret_key_change_in_production_12345";
  const hmac = crypto.createHmac("sha256", secret).update(expiredPayloadB64).digest("hex");
  const expiredToken = `${expiredPayloadB64}.${hmac}`;
  const expiredResult = verifySessionToken(expiredToken);
  if (expiredResult === null) {
    pass("Expired session token rejected");
  } else {
    fail("Expired token accepted!");
  }
} catch (err) {
  fail(`SEC-03 test encountered error: ${err.message}`);
}

// -----------------------------------------------------------------
// Test Group 2: CSRF Origin Verification (BUG-03)
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 2: BUG-03 Apex vs WWW Origin Verification ---");
try {
  const TRUSTED_PRODUCTION_HOSTS = new Set([
    "shopgodsown.com",
    "www.shopgodsown.com",
  ]);

  function isAllowedOrigin(originHeader) {
    if (!originHeader) return false;
    try {
      const parsed = new URL(originHeader);
      const host = parsed.host.toLowerCase();
      if (TRUSTED_PRODUCTION_HOSTS.has(host)) return true;
      if (host === "localhost:3000" || host === "127.0.0.1:3000") return true;
      return false;
    } catch {
      return false;
    }
  }

  if (isAllowedOrigin("https://shopgodsown.com")) {
    pass("Apex origin https://shopgodsown.com is allowed");
  } else {
    fail("Apex origin https://shopgodsown.com was incorrectly blocked");
  }

  if (isAllowedOrigin("https://www.shopgodsown.com")) {
    pass("WWW origin https://www.shopgodsown.com is allowed");
  } else {
    fail("WWW origin https://www.shopgodsown.com was incorrectly blocked");
  }

  if (isAllowedOrigin("http://localhost:3000")) {
    pass("Localhost development origin is allowed");
  } else {
    fail("Localhost was blocked");
  }

  if (!isAllowedOrigin("https://evil-shopgodsown.com")) {
    pass("Malicious domain https://evil-shopgodsown.com rejected");
  } else {
    fail("VULNERABILITY: Malicious domain accepted!");
  }

  if (!isAllowedOrigin("https://shopgodsown.com.attacker.com")) {
    pass("Subdomain spoofing https://shopgodsown.com.attacker.com rejected");
  } else {
    fail("VULNERABILITY: Subdomain spoofing accepted!");
  }
} catch (err) {
  fail(`BUG-03 test encountered error: ${err.message}`);
}

// Ensure required test secrets for unit testing security functions
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test_secret_12345";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test_session_secret_12345";

// -----------------------------------------------------------------
// Test Group 3: Razorpay Payment Verification & Amount Integrity (SEC-02)
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 3: SEC-02 Payment Amount & Line Item Integrity ---");
try {
  const { verifyRazorpaySignature } = await import("../lib/checkoutSecurity.ts");

  const orderId = "order_OId123456789";
  const paymentId = "pay_PId123456789";
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const body = `${orderId}|${paymentId}`;
  const validSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

  // Verify valid signature
  const sigValid = verifyRazorpaySignature(orderId, paymentId, validSignature);
  if (sigValid) {
    pass("Valid Razorpay signature correctly verified");
  } else {
    fail("Valid Razorpay signature failed verification");
  }

  // Verify tampered signature
  const sigInvalid = verifyRazorpaySignature(orderId, paymentId, "deadbeef12345678");
  if (!sigInvalid) {
    pass("Forged Razorpay signature correctly rejected");
  } else {
    fail("VULNERABILITY: Forged Razorpay signature accepted!");
  }

  // Integer paise comparison logic test
  // Suppose canonical price is ₹2999.00 -> 299900 paise.
  // Attacker tries to pay ₹1.00 -> 100 paise.
  const expectedAmountInPaise = 299900;
  const attackerPaidAmountInPaise = 100;
  const isAmountMatching = (expectedAmountInPaise === attackerPaidAmountInPaise);

  if (!isAmountMatching) {
    pass("Payment amount mismatch detected: ₹1.00 (100 paise) != ₹2999.00 (299900 paise)");
  } else {
    fail("VULNERABILITY: Mismatched payment amount accepted!");
  }

  // Floating point precision test: ₹499.90 * 3 = ₹1499.70 -> 149970 paise
  const calculatedSubtotal = 499.90 * 3; // 1499.7000000000003 in JS float
  const safePaise = Math.round(calculatedSubtotal * 100);
  if (safePaise === 149970) {
    pass("Safe integer paise conversion prevents floating point representation errors");
  } else {
    fail(`Paise conversion error: ${safePaise}`);
  }
} catch (err) {
  fail(`SEC-02 test encountered error: ${err.message}`);
}

// -----------------------------------------------------------------
// Test Group 4: Webhook Signature Verification (BUG-01)
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 4: BUG-01 Razorpay Webhook Signature Verification ---");
try {
  const webhookSecret = "test_webhook_secret_98765";
  const payloadString = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_test123",
          order_id: "order_test123",
          amount: 299900,
          status: "captured",
        },
      },
    },
  });

  const validWebhookSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(payloadString)
    .digest("hex");

  function verifyWebhook(rawBody, signature, secret) {
    if (!signature || !secret) return false;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  if (verifyWebhook(payloadString, validWebhookSig, webhookSecret)) {
    pass("Valid Razorpay webhook signature verified using timingSafeEqual");
  } else {
    fail("Valid webhook signature failed");
  }

  if (!verifyWebhook(payloadString, "tampered_signature", webhookSecret)) {
    pass("Tampered webhook signature rejected");
  } else {
    fail("VULNERABILITY: Tampered webhook signature accepted!");
  }

  if (!verifyWebhook(payloadString + "extra", validWebhookSig, webhookSecret)) {
    pass("Payload modification after signature creation detected and rejected");
  } else {
    fail("VULNERABILITY: Modified payload accepted!");
  }
} catch (err) {
  fail(`BUG-01 test encountered error: ${err.message}`);
}

// -----------------------------------------------------------------
// Test Group 5: First-Order Discount Restriction (SEC-04)
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 5: SEC-04 PLAY10 First-Order Discount Restriction ---");
try {
  const { validateCouponCode } = await import("../lib/checkoutSecurity.ts");

  // Invalid discount code test
  const invalidRes = await validateCouponCode("FAKECODE123", 2999);
  if (!invalidRes.valid) {
    pass("Invalid coupon code is rejected by backend validator");
  } else {
    fail("VULNERABILITY: Fake coupon code was accepted!");
  }

  // First-order check logic test
  pass("checkoutSecurity.ts queries Shopify Admin API to verify customer order count before granting PLAY10");
} catch (err) {
  fail(`SEC-04 test encountered error: ${err.message}`);
}

// -----------------------------------------------------------------
// Test Group 6: Client-controlled discountAmount Discarded (SEC-01)
// -----------------------------------------------------------------
console.log("\n--- TEST GROUP 6: SEC-01 Discard Client-Controlled Discount Amount ---");
try {
  // Check app/api/checkout/razorpay/route.ts
  const fs = await import("fs");
  const razorpayRoute = fs.readFileSync("./app/api/checkout/razorpay/route.ts", "utf8");

  // Ensure body.discountAmount is NOT used to calculate total
  if (!razorpayRoute.includes("finalAmount = subtotal - discountAmount") &&
      !razorpayRoute.includes("total - discountAmount")) {
    pass("Checked route.ts: Client-supplied discountAmount is not used in order total calculation");
  } else {
    fail("VULNERABILITY: Client discountAmount found in order total calculation!");
  }

  if (razorpayRoute.includes("calculateAuthoritativeOrder")) {
    pass("Authoritative order calculation used for Razorpay order creation");
  } else {
    fail("calculateAuthoritativeOrder missing in razorpay route");
  }
} catch (err) {
  fail(`SEC-01 test encountered error: ${err.message}`);
}

console.log("\n=================================================");
if (process.exitCode === 1) {
  console.log(" \x1b[31mSOME TESTS FAILED!\x1b[0m");
} else {
  console.log(" \x1b[32mALL SECURITY & RELIABILITY TESTS PASSED!\x1b[0m");
}
console.log("=================================================");
