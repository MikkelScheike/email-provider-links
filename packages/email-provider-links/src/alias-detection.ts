/**
 * Email Alias Detection Module
 *
 * Detects and normalizes email aliases using provider-specific rules for
 * case, plus-addressing, and dots. Domain part is always lowercased (RFC 5321).
 */

import { loadProviders } from './provider-loader';
import { validateInternationalEmail, domainToPunycode } from './idn';
import type { EmailProvider } from './api';

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

export interface NormalizeEmailOptions {
  /**
   * Skip structural/IDN re-validation when the caller already validated the email.
   * Used by the detection hot path to avoid duplicate work.
   */
  alreadyValidated?: boolean;
  /**
   * Optional pre-computed punycode domain (avoids re-encoding).
   */
  punycodeDomain?: string;
}

function assertValidEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email format');
  }

  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error('Invalid email format');
  }

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    throw new Error('Invalid email format');
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  // Local part: allow consecutive dots (Gmail accepts/strips them). Reject whitespace/@.
  if (!local || /\s|@/.test(local) || local.length > 64) {
    throw new Error('Invalid email format');
  }

  const domainError = validateInternationalEmail(`a@${domain}`);
  if (domainError) {
    throw new Error('Invalid email format');
  }
}

function getProviderDomainMap(): Map<string, EmailProvider> {
  const result = loadProviders();
  if (result.domainMap) {
    return result.domainMap;
  }

  const domainMap = new Map<string, EmailProvider>();
  for (const provider of result.providers) {
    for (const domain of provider.domains) {
      domainMap.set(domain.toLowerCase(), provider);
    }
  }
  return domainMap;
}

/**
 * Detects and analyzes email aliases according to provider-specific rules.
 */
export function detectEmailAlias(
  email: string,
  options: NormalizeEmailOptions = {}
): AliasDetectionResult {
  if (!options.alreadyValidated) {
    assertValidEmail(email);
  }

  const originalEmail = email.trim();
  const atIndex = originalEmail.lastIndexOf('@');
  const username = originalEmail.slice(0, atIndex).toLowerCase();
  const domain =
    options.punycodeDomain ||
    domainToPunycode(originalEmail.slice(atIndex + 1).toLowerCase());

  if (!username || !domain) {
    throw new Error('Invalid email format - missing username or domain');
  }

  const domainMap = getProviderDomainMap();
  const provider = domainMap.get(domain);

  const result: AliasDetectionResult = {
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

  if (provider.alias?.case?.ignore) {
    if (provider.alias.case?.strip) {
      normalizedUsername = normalizedUsername.toLowerCase();
    }
  }

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
 */
export function normalizeEmail(email: string, options: NormalizeEmailOptions = {}): string {
  if (email == null || typeof email !== 'string') {
    // Preserve null/undefined for edge-case compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return email as any;
  }

  const trimmed = email.trim();

  if (trimmed === '') {
    return '';
  }

  try {
    return detectEmailAlias(trimmed, options).canonical;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid email format')) {
      return trimmed;
    }
    return trimmed.toLowerCase();
  }
}

/**
 * Checks if two email addresses are the same when normalized.
 */
export function emailsMatch(email1: string, email2: string): boolean {
  if (email1 == null || email2 == null) {
    return false;
  }

  if (typeof email1 !== 'string' || typeof email2 !== 'string') {
    return false;
  }

  if (email1.trim() === '' || email2.trim() === '') {
    return false;
  }

  try {
    return normalizeEmail(email1) === normalizeEmail(email2);
  } catch {
    return false;
  }
}
