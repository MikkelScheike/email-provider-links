/**
 * Email Provider Links
 * 
 * A modern, robust email provider detection library with:
 * - 93+ verified email providers covering 180+ domains
 * - Concurrent DNS detection for business domains
 * - Zero runtime dependencies
 * - Comprehensive error handling with detailed context
 * - International email validation (IDN support)
 * - Email alias normalization and deduplication
 * - Enterprise-grade security features
 * 
 * @author Email Provider Links Team
 * @license MIT
 * @version 2.7.0
 */

// ===== PRIMARY API =====
// Core functions that 95% of users need

export {
  getEmailProvider,
  getEmailProviderSync,
  getEmailProviderFast,
  normalizeEmail,
  emailsMatch,
  Config
} from './api';

// ===== TYPES =====
// TypeScript interfaces for better developer experience

export type {
  EmailProvider,
  EmailProviderResult
} from './api';

// ===== ADVANCED FEATURES =====
// For power users and custom implementations

export { loadProviders } from './loader';
export { detectProviderConcurrent } from './concurrent-dns';
export { validateInternationalEmail, emailToPunycode, domainToPunycode } from './idn';

// Advanced types
export type {
  ConcurrentDNSConfig,
  ConcurrentDNSResult
} from './concurrent-dns';

// ===== EMAIL VALIDATION =====
// Enhanced validation with international support

import { validateInternationalEmail } from './idn';

/**
 * Enhanced email validation with comprehensive error reporting
 * 
 * @param email - Email address to validate
 * @returns Validation result with detailed error information
 * 
 * @example
 * ```typescript
 * const result = validateEmailAddress('user@example.com');
 * if (result.isValid) {
 *   console.log('Email is valid');
 * } else {
 *   console.log('Error:', result.error.message);
 * }
 * ```
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
  // Input validation
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

  // Trim whitespace
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

  // Use international validation
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
// Helper functions for common tasks

import { loadProviders } from './loader';
import { 
  getEmailProvider,
  getEmailProviderSync,
  getEmailProviderFast,
  normalizeEmail,
  emailsMatch,
  Config
} from './api';
import { detectProviderConcurrent } from './concurrent-dns';
import { validateInternationalEmail } from './idn';

/**
 * Get comprehensive list of all supported email providers
 * 
 * @returns Array of all email providers with metadata
 * 
 * @example
 * ```typescript
 * const providers = getSupportedProviders();
 * console.log(`Supports ${providers.length} providers`);
 * 
 * const gmailProvider = providers.find(p => p.domains.includes('gmail.com'));
 * console.log(gmailProvider?.companyProvider); // "Gmail"
 * ```
 */
export function getSupportedProviders() {
  try {
    const { providers } = loadProviders();
    return [...providers]; // Return defensive copy to prevent external mutations
  } catch (error) {
    console.warn('Failed to load providers:', error);
    return [];
  }
}

/**
 * Check if an email provider is supported (synchronous)
 * 
 * @param email - Email address to check
 * @returns true if the provider is supported
 * 
 * @example
 * ```typescript
 * if (isEmailProviderSupported('user@gmail.com')) {
 *   console.log('Gmail is supported');
 * }
 * ```
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
 * Extract and normalize domain from email address
 * 
 * @param email - Email address
 * @returns Normalized domain portion or null if invalid
 * 
 * @example
 * ```typescript
 * const domain = extractDomain('USER@GMAIL.COM');
 * console.log(domain); // "gmail.com"
 * 
 * const invalid = extractDomain('invalid-email');
 * console.log(invalid); // null
 * ```
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
 * Validate email format using enhanced rules
 * 
 * @param email - Email address to validate
 * @returns true if valid format
 * 
 * @example
 * ```typescript
 * if (isValidEmail('user@example.com')) {
 *   console.log('Email format is valid');
 * }
 * 
 * if (isValidEmail('user@münchen.de')) {
 *   console.log('International domain is valid');
 * }
 * ```
 */
export function isValidEmail(email: string): boolean {
  const validation = validateEmailAddress(email);
  return validation.isValid;
}

/**
 * Get library metadata and statistics
 * 
 * @returns Object with current library statistics
 * 
 * @example
 * ```typescript
 * const stats = getLibraryStats();
 * console.log(`Supports ${stats.providerCount} providers across ${stats.domainCount} domains`);
 * ```
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
      version: '2.7.0',
      supportsAsync: true,
      supportsIDN: true,
      supportsAliasDetection: true,
      supportsConcurrentDNS: true
    };
  } catch {
    return {
      providerCount: 0,
      domainCount: 0,
      version: '2.7.0',
      supportsAsync: true,
      supportsIDN: true,
      supportsAliasDetection: true,
      supportsConcurrentDNS: true
    };
  }
}

/**
 * Batch process multiple email addresses efficiently
 * 
 * @param emails - Array of email addresses to process
 * @param options - Processing options
 * @returns Array of results in the same order as input
 * 
 * @example
 * ```typescript
 * const emails = ['user@gmail.com', 'test@yahoo.com', 'invalid-email'];
 * const results = batchProcessEmails(emails);
 * 
 * results.forEach((result, index) => {
 *   console.log(`${emails[index]}: ${result.isValid ? 'Valid' : 'Invalid'}`);
 * });
 * ```
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

      // Add normalized email if requested
      if (normalizeEmails && validation.normalizedEmail) {
        try {
          result.normalized = normalizeEmail(validation.normalizedEmail);
        } catch {
          result.normalized = validation.normalizedEmail;
        }
      }

      // Check for duplicates if requested
      if (deduplicateAliases && result.normalized) {
        if (seenNormalized.has(result.normalized)) {
          result.isDuplicate = true;
        } else {
          seenNormalized.add(result.normalized);
        }
      }

      // Add provider info if requested
      if (includeProviderInfo && validation.normalizedEmail) {
        try {
          const providerResult = getEmailProviderSync(validation.normalizedEmail);
          result.provider = providerResult.provider?.companyProvider || null;
          result.loginUrl = providerResult.loginUrl;
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
// Maintain backward compatibility

/**
 * @deprecated Use validateEmailAddress instead for better error handling
 */
export const isValidEmailAddress = isValidEmail;

/**
 * Library metadata (legacy constants)
 */
export const PROVIDER_COUNT = 93;
export const DOMAIN_COUNT = 178;

/**
 * Default export for convenience
 * 
 * @example
 * ```typescript
 * import EmailProviderLinks from '@mikkelscheike/email-provider-links';
 * 
 * const result = await EmailProviderLinks.getEmailProvider('user@gmail.com');
 * ```
 */
export default {
  // Core functions
  getEmailProvider,
  getEmailProviderSync,
  getEmailProviderFast,
  
  // Validation
  validateEmailAddress,
  isValidEmail,
  normalizeEmail,
  emailsMatch,
  
  // Utilities
  getSupportedProviders,
  isEmailProviderSupported,
  extractDomain,
  getLibraryStats,
  batchProcessEmails,
  
  // Advanced
  loadProviders,
  detectProviderConcurrent,
  validateInternationalEmail,
  
  // Constants
  Config,
  PROVIDER_COUNT,
  DOMAIN_COUNT
};

/**
 * Version information
 */
export const VERSION = '2.7.0';