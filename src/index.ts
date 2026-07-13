/**
 * Email Provider Links
 *
 * Maps email addresses to provider login URLs with:
 * - Known-domain lookup across 140+ providers
 * - Concurrent DNS detection for business/custom domains
 * - Provider-specific alias normalization
 * - Zero runtime dependencies
 *
 * @license MIT
 */

import {
  getEmailProvider,
  getEmailProviderSync,
  getEmailProviderFast,
  normalizeEmail,
  emailsMatch,
  Config
} from './api';
import { detectEmailAlias } from './alias-detection';
import { loadProviders } from './provider-loader';
import { validateInternationalEmail } from './idn';

// ===== PRIMARY API =====

export {
  getEmailProvider,
  getEmailProviderSync,
  getEmailProviderFast,
  normalizeEmail,
  emailsMatch,
  detectEmailAlias,
  Config
};

// ===== TYPES =====

export type {
  EmailProvider,
  EmailProviderResult,
  SimplifiedProvider,
  SimplifiedEmailProviderResult
} from './api';

export type {
  AliasDetectionResult
} from './alias-detection';

// ===== EMAIL VALIDATION =====

/**
 * Enhanced email validation with comprehensive error reporting.
 */
export function validateEmailAddress(email: string): {
  isValid: boolean;
  normalizedEmail?: string;
  error?: {
    type: string;
    code: string;
    message: string;
  };
} {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: {
        type: 'INVALID_INPUT',
        code: 'MISSING_EMAIL',
        message: 'Email address is required and must be a string'
      }
    };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      error: {
        type: 'INVALID_INPUT',
        code: 'EMPTY_EMAIL',
        message: 'Email address cannot be empty'
      }
    };
  }

  const idnError = validateInternationalEmail(trimmedEmail);

  if (idnError) {
    return {
      isValid: false,
      error: {
        type: idnError.type,
        code: idnError.code,
        message: idnError.message
      }
    };
  }

  return {
    isValid: true,
    normalizedEmail: trimmedEmail.toLowerCase()
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get a defensive copy of all supported email providers.
 */
export function getSupportedProviders() {
  try {
    const { providers } = loadProviders();
    return [...providers];
  } catch {
    return [];
  }
}

/**
 * Check if an email's domain maps to a known provider (sync, no DNS).
 */
export function isEmailProviderSupported(email: string): boolean {
  try {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const result = getEmailProviderSync(email);
    return result.provider !== null;
  } catch {
    return false;
  }
}

/**
 * Extract and normalize the domain from an email address.
 */
export function extractDomain(email: string): string | null {
  try {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const validation = validateEmailAddress(email);
    if (!validation.isValid || !validation.normalizedEmail) {
      return null;
    }

    const parts = validation.normalizedEmail.split('@');
    return parts[1] || null;
  } catch {
    return null;
  }
}

/**
 * Validate email format (boolean convenience wrapper).
 */
export function isValidEmail(email: string): boolean {
  return validateEmailAddress(email).isValid;
}

/**
 * Library metadata and statistics.
 */
export function getLibraryStats() {
  try {
    const providers = getSupportedProviders();
    const domainCount = providers.reduce((total, provider) =>
      total + (provider.domains?.length || 0), 0
    );

    return {
      providerCount: providers.length,
      domainCount,
      version: VERSION,
      supportsAsync: true,
      supportsIDN: true,
      supportsAliasDetection: true,
      supportsConcurrentDNS: true
    };
  } catch {
    return {
      providerCount: 0,
      domainCount: 0,
      version: VERSION,
      supportsAsync: true,
      supportsIDN: true,
      supportsAliasDetection: true,
      supportsConcurrentDNS: true
    };
  }
}

/**
 * Batch-process multiple email addresses (sync path only).
 */
export function batchProcessEmails(
  emails: string[],
  options: {
    includeProviderInfo?: boolean;
    normalizeEmails?: boolean;
    deduplicateAliases?: boolean;
  } = {}
): Array<{
  email: string;
  isValid: boolean;
  provider?: string | null;
  loginUrl?: string | null;
  normalized?: string;
  isDuplicate?: boolean;
  error?: string;
}> {
  const {
    includeProviderInfo = false,
    normalizeEmails = false,
    deduplicateAliases = false
  } = options;

  const results: Array<{
    email: string;
    isValid: boolean;
    provider?: string | null;
    loginUrl?: string | null;
    normalized?: string;
    isDuplicate?: boolean;
    error?: string;
  }> = [];

  const seenNormalized = new Set<string>();

  for (const email of emails) {
    try {
      const validation = validateEmailAddress(email);
      const result: typeof results[0] = {
        email,
        isValid: validation.isValid
      };

      if (!validation.isValid) {
        result.error = validation.error?.message;
        results.push(result);
        continue;
      }

      if (normalizeEmails && validation.normalizedEmail) {
        try {
          result.normalized = normalizeEmail(validation.normalizedEmail);
        } catch {
          result.normalized = validation.normalizedEmail;
        }
      }

      if (deduplicateAliases && result.normalized) {
        if (seenNormalized.has(result.normalized)) {
          result.isDuplicate = true;
        } else {
          seenNormalized.add(result.normalized);
        }
      }

      if (includeProviderInfo && validation.normalizedEmail) {
        try {
          const providerResult = getEmailProviderSync(validation.normalizedEmail);
          result.provider = providerResult.provider?.companyProvider || null;
          result.loginUrl = providerResult.provider?.loginUrl || null;
        } catch {
          result.provider = null;
        }
      }

      results.push(result);
    } catch (error) {
      results.push({
        email,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

// ===== LEGACY COMPATIBILITY =====

/**
 * @deprecated Use validateEmailAddress or isValidEmail instead
 */
export const isValidEmailAddress = isValidEmail;

export const PROVIDER_COUNT = Config.SUPPORTED_PROVIDERS_COUNT;
export const DOMAIN_COUNT = Config.SUPPORTED_DOMAINS_COUNT;

export default {
  getEmailProvider,
  getEmailProviderSync,
  getEmailProviderFast,
  validateEmailAddress,
  isValidEmail,
  normalizeEmail,
  emailsMatch,
  detectEmailAlias,
  getSupportedProviders,
  isEmailProviderSupported,
  extractDomain,
  getLibraryStats,
  batchProcessEmails,
  Config,
  PROVIDER_COUNT,
  DOMAIN_COUNT
};

function readPackageVersion(): string {
  try {
    const pkg = require('../package.json') as { version?: string };
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

export const VERSION = readPackageVersion();
