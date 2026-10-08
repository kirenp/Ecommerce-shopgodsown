import { IANA_TLDS } from "./ianaTlds";

/**
 * Production-grade email and contact validation utility.
 * Features:
 * 1. Strict RFC syntax and structure validation.
 * 2. Official IANA Top-Level Domain (TLD) whitelist verification.
 * 3. Levenshtein fuzzy-matching for all major email providers (Gmail, Yahoo, Outlook, etc.).
 * 4. Automatic typo detection and 1-click suggestion generation.
 */

export interface ContactValidationResult {
  isValid: boolean;
  isEmail: boolean;
  isPhone: boolean;
  error?: string;
  suggestion?: string;
  normalizedValue: string;
}

/**
 * Compute Levenshtein edit distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const row = new Array(bLen + 1);
  for (let j = 0; j <= bLen; j++) row[j] = j;

  for (let i = 1; i <= aLen; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= bLen; j++) {
      const temp = row[j];
      if (a[i - 1] === b[j - 1]) {
        row[j] = prev;
      } else {
        row[j] = Math.min(prev + 1, row[j] + 1, row[j - 1] + 1);
      }
      prev = temp;
    }
  }

  return row[bLen];
}

// Major email providers to fuzzy match
const POPULAR_PROVIDERS: Array<{
  name: string;
  canonicalDomain: string;
  maxDistance: number;
  aliases?: string[];
}> = [
  {
    name: "gmail",
    canonicalDomain: "gmail.com",
    maxDistance: 2,
    aliases: ["googlemail", "g-mail", "ggail", "gmmail", "gmaiil", "gmaill"],
  },
  {
    name: "yahoo",
    canonicalDomain: "yahoo.com",
    maxDistance: 2,
    aliases: ["yahoocom", "ymail"],
  },
  {
    name: "hotmail",
    canonicalDomain: "hotmail.com",
    maxDistance: 2,
    aliases: ["hotmial", "hotmaill"],
  },
  {
    name: "outlook",
    canonicalDomain: "outlook.com",
    maxDistance: 2,
    aliases: ["outlok", "outllok"],
  },
  {
    name: "icloud",
    canonicalDomain: "icloud.com",
    maxDistance: 2,
    aliases: ["icloude", "iclould"],
  },
  {
    name: "rediffmail",
    canonicalDomain: "rediffmail.com",
    maxDistance: 2,
    aliases: ["redifmail", "rediff"],
  },
  {
    name: "zoho",
    canonicalDomain: "zoho.com",
    maxDistance: 2,
    aliases: ["zohomail"],
  },
];

// Common TLD typos mapped to their intended TLD
const KNOWN_TLD_TYPOS: Record<string, string> = {
  // .com typos
  con: "com",
  cof: "com",
  cyv: "com",
  cmo: "com",
  cpm: "com",
  coom: "com",
  comm: "com",
  col: "com",
  cok: "com",
  coj: "com",
  cob: "com",
  comn: "com",
  comk: "com",
  xom: "com",
  vom: "com",
  fom: "com",
  dom: "com",
  clm: "com",
  ckm: "com",
  cim: "com",
  coi: "com",
  cop: "com",
  cpn: "com",
  kom: "com",
  conm: "com",
  som: "com",
  oom: "com",
  c0m: "com",
  cm: "com",

  // .in typos
  im: "in",
  on: "in",
  ik: "in",
  ij: "in",
  ihn: "in",

  // .org typos
  orf: "org",
  ogr: "org",
  orgg: "org",
  otg: "org",
  orh: "org",

  // .net typos
  ner: "net",
  ne: "net",
  mnet: "net",
  nett: "net",
  nte: "net",
  met: "net",
  neg: "net",
};

/**
 * Validates an email address and checks for syntax, invalid TLD, or domain typos.
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
  suggestion?: string;
} {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: "Email address is required." };
  }

  // Must contain exactly one '@' symbol
  const atParts = trimmed.split("@");
  if (atParts.length !== 2) {
    return { isValid: false, error: "Please enter a valid email address with an '@' symbol." };
  }

  const [localPart, domainPart] = atParts;
  const local = localPart.trim();
  const domain = domainPart.trim().toLowerCase();

  if (!local || !domain) {
    return { isValid: false, error: "Please enter a complete email address." };
  }

  // 1. Local part validation
  if (local.length > 64) {
    return { isValid: false, error: "Email username is too long." };
  }
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { isValid: false, error: "Email address cannot start, end, or contain consecutive dots." };
  }
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) {
    return { isValid: false, error: "Email address contains invalid characters." };
  }

  // 2. Domain structure validation
  if (domain.length > 255) {
    return { isValid: false, error: "Email domain name is too long." };
  }
  if (!domain.includes(".")) {
    return { isValid: false, error: "Email domain is missing an extension (e.g. .com)." };
  }
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return { isValid: false, error: "Email domain cannot start, end, or contain consecutive dots." };
  }

  const domainLabels = domain.split(".");
  const tld = domainLabels[domainLabels.length - 1];
  const secondLevel = domainLabels.slice(0, -1).join(".");
  const providerName = domainLabels[0];

  // Validate characters of each label
  for (const label of domainLabels) {
    if (!label || label.startsWith("-") || label.endsWith("-") || !/^[a-zA-Z0-9-]+$/.test(label)) {
      return { isValid: false, error: "Email domain contains invalid characters." };
    }
  }

  // 3. Match against major email providers using fuzzy distance & aliases
  let matchedProvider: (typeof POPULAR_PROVIDERS)[0] | null = null;

  for (const provider of POPULAR_PROVIDERS) {
    if (providerName === provider.name) {
      matchedProvider = provider;
      break;
    }
    if (provider.aliases?.includes(providerName)) {
      matchedProvider = provider;
      break;
    }
    // Fuzzy match provider name
    const dist = levenshteinDistance(providerName, provider.name);
    if (dist > 0 && dist <= provider.maxDistance) {
      matchedProvider = provider;
      break;
    }
  }

  // If a major provider was matched
  if (matchedProvider) {
    // If provider is Gmail, Gmail addresses MUST end in gmail.com (or googlemail.com)
    if (matchedProvider.name === "gmail") {
      if (domain !== "gmail.com" && domain !== "googlemail.com") {
        const suggestedEmail = `${local}@gmail.com`;
        return {
          isValid: false,
          error: `Typo detected in email address. Did you mean ${suggestedEmail}?`,
          suggestion: suggestedEmail,
        };
      }
    } else {
      // For Yahoo, Hotmail, Outlook, iCloud, etc.
      // If the domain is not exactly the canonical domain (e.g. yaho.com, hotmial.cyv)
      if (domain !== matchedProvider.canonicalDomain) {
        // Special case for Yahoo India: allow yahoo.co.in and yahoo.in
        if (matchedProvider.name === "yahoo" && (domain === "yahoo.co.in" || domain === "yahoo.in")) {
          return { isValid: true };
        }
        const suggestedEmail = `${local}@${matchedProvider.canonicalDomain}`;
        return {
          isValid: false,
          error: `Typo detected in email address. Did you mean ${suggestedEmail}?`,
          suggestion: suggestedEmail,
        };
      }
    }
  }

  // 4. Validate Top-Level Domain (TLD)
  // Check known TLD typos first (e.g. .con, .cof, .cyv, .cpm, .cmo -> .com)
  if (KNOWN_TLD_TYPOS[tld]) {
    const correctedTld = KNOWN_TLD_TYPOS[tld];
    const suggestedEmail = `${local}@${secondLevel}.${correctedTld}`;
    return {
      isValid: false,
      error: `Typo detected in email extension '.${tld}'. Did you mean '.${correctedTld}'?`,
      suggestion: suggestedEmail,
    };
  }

  // Check if TLD is within the official IANA root zone database
  if (!IANA_TLDS.has(tld)) {
    // Check if the invalid TLD is very close to "com" (edit distance <= 2)
    const distToCom = levenshteinDistance(tld, "com");
    if (distToCom <= 2 && tld.length >= 2 && tld.length <= 4) {
      const suggestedEmail = `${local}@${secondLevel}.com`;
      return {
        isValid: false,
        error: `Typo detected in email extension '.${tld}'. Did you mean '.com'?`,
        suggestion: suggestedEmail,
      };
    }

    return {
      isValid: false,
      error: `Invalid email domain extension '.${tld}'. Please enter a valid email address.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates the contact field which can be either an email or a mobile phone number.
 */
export function validateContact(contact: string): ContactValidationResult {
  const trimmed = contact.trim();
  if (!trimmed) {
    return {
      isValid: false,
      isEmail: false,
      isPhone: false,
      error: "Email or mobile phone number is required.",
      normalizedValue: "",
    };
  }

  // If it contains '@' or alphabetic characters, validate as an email
  const hasLettersOrAt = /[a-zA-Z@]/.test(trimmed);

  if (hasLettersOrAt || trimmed.includes("@")) {
    const emailResult = validateEmail(trimmed);
    return {
      isValid: emailResult.isValid,
      isEmail: true,
      isPhone: false,
      error: emailResult.error,
      suggestion: emailResult.suggestion,
      normalizedValue: trimmed.toLowerCase(),
    };
  }

  // Otherwise, validate as a mobile phone number
  const cleanPhone = trimmed.replace(/[\s\-\+\(\)]/g, "");
  // Support 10-digit Indian numbers, optional 0 prefix (11 digits), or +91 prefix (12 digits)
  const is10Digit = /^[6-9]\d{9}$/.test(cleanPhone);
  const is11DigitWithZero = /^0[6-9]\d{9}$/.test(cleanPhone);
  const is12DigitWith91 = /^91[6-9]\d{9}$/.test(cleanPhone);

  if (is10Digit || is11DigitWithZero || is12DigitWith91) {
    // Standardize to 10 digits
    const normalized = cleanPhone.slice(-10);
    return {
      isValid: true,
      isEmail: false,
      isPhone: true,
      normalizedValue: normalized,
    };
  }

  if (/^\d+$/.test(cleanPhone)) {
    return {
      isValid: false,
      isEmail: false,
      isPhone: true,
      error: "Please enter a valid 10-digit mobile number.",
      normalizedValue: cleanPhone,
    };
  }

  return {
    isValid: false,
    isEmail: false,
    isPhone: false,
    error: "Please enter a valid email address or 10-digit mobile number.",
    normalizedValue: trimmed,
  };
}
