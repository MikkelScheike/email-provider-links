/**
 * Email Alias Detection Module
 * 
 * Clean, focused implementation with only essential functions.
 * Detects and normalizes email aliases across different providers.
 */

export interface AliasDetectionResult {
  /** The normalized/canonical email address */
  canonical: string;
  /** The original email address */
  original: string;
  /** Whether an alias was detected */
  isAlias: boolean;
  /** Type of alias detected */
  aliasType: 'plus' | 'dot' | 'none';
  /** The alias part (if any) */
  aliasPart?: string;
  /** The provider that supports this alias type */
  provider?: string;
}

import { loadProviders } from './loader';

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


/**
 * Detects and analyzes email aliases
 * 
 * @param email - Email address to analyze
 * @returns Detailed analysis of the email alias
 */
export function detectEmailAlias(email: string): AliasDetectionResult {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  const originalEmail = email.trim();
  const emailParts = originalEmail.toLowerCase().split('@');
  const username = emailParts[0];
  const domain = emailParts[1];
  
  if (!username || !domain) {
    throw new Error('Invalid email format - missing username or domain');
  }
  
  const { domainMap } = loadProviders();
  const provider = domainMap.get(domain);

  const result: AliasDetectionResult = {
    canonical: originalEmail.toLowerCase(),
    original: originalEmail,
    isAlias: false,
    aliasType: 'none'
  };

  if (!provider?.alias) {
    return result;
  }

  result.provider = domain;

  let normalizedUsername = username;
  let isAlias = false;
  let aliasType: 'plus' | 'dot' | 'none' = 'none';
  let aliasPart: string | undefined;

  // Handle case sensitivity (all modern providers are case-insensitive)
  if (provider.alias?.case?.ignore) {
    if (provider.alias.case?.strip) {
      normalizedUsername = normalizedUsername.toLowerCase();
    }
  }

  // Handle plus addressing (common for Gmail, Outlook, Yahoo, etc.)
  if (provider.alias?.plus?.ignore) {
    const plusIndex = username.indexOf('+');
    if (plusIndex !== -1) {
      aliasPart = username.substring(plusIndex + 1);
      isAlias = true;
      aliasType = 'plus';
      if (provider.alias.plus?.strip) {
        normalizedUsername = username.slice(0, plusIndex);
      }
    }
  }

  // Handle dots (primarily for Gmail)
  if (provider.alias?.dots?.ignore) {
    const hasDots = username.includes('.');
    if (hasDots) {
      if (!isAlias) {
        aliasPart = username;
        isAlias = true;
        aliasType = 'dot';
      }
      if (provider.alias.dots?.strip) {
        normalizedUsername = normalizedUsername.replace(/\./g, '');
      }
    }
  }

  // Build the canonical form
  result.canonical = `${normalizedUsername}@${domain}`;
  result.isAlias = isAlias;
  result.aliasType = aliasType;
  if (aliasPart !== undefined) {
    result.aliasPart = aliasPart;
  }

  return result;
}

/**
 * Normalizes an email address to its canonical form.
 * 
 * This is the primary function for preventing duplicate accounts.
 * 
 * @param email - Email address to normalize
 * @returns Canonical email address
 * 
 * @example
 * ```typescript
 * const canonical = normalizeEmail('U.S.E.R+work@GMAIL.COM');
 * console.log(canonical); // 'user@gmail.com'
 * ```
 */
export function normalizeEmail(email: string): string {
  const result = detectEmailAlias(email);
  return result.canonical;
}

/**
 * Checks if two email addresses are the same when normalized.
 * 
 * This is the primary function for matching aliases during login.
 * 
 * @param email1 - First email address
 * @param email2 - Second email address
 * @returns true if the emails represent the same person
 * 
 * @example
 * ```typescript
 * const match = emailsMatch('user@gmail.com', 'u.s.e.r+work@gmail.com');
 * console.log(match); // true
 * ```
 */
export function emailsMatch(email1: string, email2: string): boolean {
  try {
    return normalizeEmail(email1) === normalizeEmail(email2);
  } catch {
    return false;
  }
}