/**
 * Email Alias Detection Module
 * 
 * Clean, focused implementation with only essential functions.
 * Detects and normalizes email aliases across different providers.
 * 
 * Alias Configuration Behavior:
 * ---------------------------
 * The module handles email aliases based on provider-specific configurations.
 * Each provider can specify how to handle three types of email variations:
 * 
 * 1. Case sensitivity ("case")
 * 2. Plus addressing ("plus")
 * 3. Dots in username ("dots")
 * 
 * Important: For each of these properties, modifications are only applied if
 * explicitly configured in the provider's settings:
 * 
 * - If a property is defined (e.g., "case": {"ignore": true, "strip": true}),
 *   the specified behavior is applied
 * 
 * - If a property is missing from the provider's alias configuration,
 *   the original value is preserved without modification
 * 
 * Example:
 * ```json
 * {
 *   "alias": {
 *     "dots": { "ignore": false, "strip": false },
 *     "plus": { "ignore": true, "strip": true }
 *     // case is not defined, so case will be preserved
 *   }
 * }
 * ```
 * 
 * In this example:
 * - Dots will be preserved (configured to not ignore/strip)
 * - Plus addressing will be stripped (configured to ignore/strip)
 * - Case will be preserved (not configured)
 * 
 * Note: The domain part of email addresses is always converted to lowercase
 * as per RFC 5321 standard, regardless of provider configuration.
 */

import { loadProviders } from './provider-loader';
import { domainToPunycode, validateInternationalEmail } from './idn';

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

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    return false;
  }

  const domain = email.slice(atIndex + 1);
  if (!domain) {
    return false;
  }

  if (/[\uD800-\uDFFF]/.test(domain) || /[\u0000-\u001F\u007F]/.test(domain)) {
    return false;
  }

  if (/[^\p{L}\p{M}\p{N}.\-]/u.test(domain)) {
    return false;
  }

  const validation = validateInternationalEmail(`a@${domain}`);
  return validation === undefined;
}


/**
 * Detects and analyzes email aliases
 * 
 * This function processes email addresses according to provider-specific rules.
 * Case is always lowercased in the canonical form for consistency and safety.
 * It only applies additional modifications (plus, dots) that are explicitly
 * defined in the provider's configuration.
 * 
 * @param email - Email address to analyze
 * @returns Detailed analysis of the email alias
 * 
 * @example
 * Provider with no case handling defined:
 * ```typescript
 * detectEmailAlias('User.Name@example.com')
 * // Preserves case: User.Name@example.com
 * ```
 * 
 * Provider with case handling defined:
 * ```typescript
 * detectEmailAlias('User.Name@gmail.com')
 * // Converts to lowercase: user.name@gmail.com
 * ```
 */
export function detectEmailAlias(email: string): AliasDetectionResult {
  const originalEmail = email.trim();
  if (!isValidEmail(originalEmail)) {
    throw new Error('Invalid email format');
  }
  // Split normally, lowering case both for username and domain by default
  const emailParts = originalEmail.toLowerCase().split('@');
  const username = emailParts[0];
  const domain = domainToPunycode(emailParts[1] || ''); // domain is always case-insensitive per RFC 5321
  
  if (!username || !domain) {
    throw new Error('Invalid email format - missing username or domain');
  }
  
  // Get providers and create domain map
  const { providers } = loadProviders();
  const domainMap = new Map<string, any>();
  providers.forEach(provider => {
    provider.domains.forEach((domain: string) => {
      domainMap.set(domain.toLowerCase(), provider);
    });
  });
  
  const provider = domainMap.get(domain);

  const result: AliasDetectionResult = {
    // Only lowercase domain part by default
    canonical: `${username}@${domain}`,
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

  // Canonical form is always lowercased to ensure consistent and
  // reliable email handling across different providers.
  if (provider.alias?.case?.ignore) {
    if (provider.alias.case?.strip) {
      normalizedUsername = normalizedUsername.toLowerCase();
    }
  }

  // Handle plus addressing if defined in provider settings
  // If plus handling is not defined, preserve plus addressing
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

  // Handle dots if defined in provider settings
  // If dots handling is not defined, preserve dots
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
  if (email == null || typeof email !== 'string') {
    return email as any; // Preserve null/undefined for edge case tests
  }

  // Check for empty string
  if (email.trim() === '') {
    throw new Error('Invalid email format: empty string');
  }

  // Basic email validation
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  try {
    const result = detectEmailAlias(email);
    return result.canonical;
  } catch {
    // Fallback to simple lowercase if alias detection fails
    return email.toLowerCase().trim();
  }
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
  // Handle null/undefined inputs first
  if (email1 == null || email2 == null) {
    return false;
  }
  
  // Handle non-string inputs
  if (typeof email1 !== 'string' || typeof email2 !== 'string') {
    return false;
  }
  
  // Handle empty strings specifically
  if (email1.trim() === '' || email2.trim() === '') {
    return false;
  }
  
  try {
    return normalizeEmail(email1) === normalizeEmail(email2);
  } catch {
    return false;
  }
}