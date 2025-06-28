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

interface AliasConfig {
  dots?: boolean;
  plus?: boolean;
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

  if (!provider) {
    result.canonical = originalEmail.toLowerCase();
    return result;
  }

  result.provider = domain;

  // Start with the username as the base for our canonical form
  let canonicalPart = username;
  let plusPart = '';
  let plusIndex = -1;
  let originalBeforePlus = username;

  const aliasConfig = provider.alias as AliasConfig | undefined;
  
  if (aliasConfig) {
    const hasPlus = aliasConfig.plus;
    const hasDots = aliasConfig.dots;

    // First locate any plus addressing
    if (hasPlus) {
      plusIndex = canonicalPart.indexOf('+');
      if (plusIndex !== -1) {
        result.isAlias = true;
        result.aliasType = 'plus';
        plusPart = canonicalPart.slice(plusIndex + 1);
        originalBeforePlus = canonicalPart.slice(0, plusIndex);
        canonicalPart = originalBeforePlus;
        result.aliasPart = plusPart;
      }
    }

    // Then handle dots if supported
    if (hasDots) {
      const noDots = canonicalPart.replace(/\./g, '');
      if (noDots !== canonicalPart) {
        result.isAlias = true;
        if (!result.aliasType || result.aliasType === 'none') {
          result.aliasType = 'dot';
          result.aliasPart = canonicalPart;
        }
        canonicalPart = noDots;
      }
    }
  }

  // Set the final canonical form
  result.canonical = `${canonicalPart}@${domain.toLowerCase()}`;

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