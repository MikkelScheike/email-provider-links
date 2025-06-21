/**
 * Email Provider Links
 * 
 * A clean, modern email provider detection library with:
 * - 93+ verified email providers covering 180+ domains
 * - Concurrent DNS detection for business domains
 * - Zero runtime dependencies
 * - Comprehensive error handling
 * - Email alias normalization
 * 
 * @author Email Provider Links Team
 * @license MIT
 */

// ===== PRIMARY API =====
// These are the functions 95% of users need

export {
  getEmailProvider,
  getEmailProviderSync,
  getEmailProviderFast,
  normalizeEmail,
  emailsMatch,
  Config
} from './api';

// Export types that users will need
export type {
  EmailProvider,
  EmailProviderResult
} from './api';

// ===== ADVANCED FEATURES =====
// Export utility functions for advanced use cases

export { loadProvidersOptimized } from './loader';
export { detectProviderConcurrent } from './concurrent-dns';

// Export types for advanced users
export type {
  ConcurrentDNSConfig,
  ConcurrentDNSResult
} from './concurrent-dns';

// ===== UTILITY FUNCTIONS =====
// Helper functions for common tasks

import { loadProvidersOptimized } from './loader';
import { 
  getEmailProvider,
  getEmailProviderSync, 
  getEmailProviderFast,
  normalizeEmail,
  emailsMatch,
  Config
} from './api';

/**
 * Get list of all supported email providers
 * @returns Array of all email providers in the database
 */
export function getSupportedProviders() {
  const { providers } = loadProvidersOptimized();
  return [...providers]; // Return a copy to prevent external mutations
}

/**
 * Check if an email provider is supported
 * @param email - Email address to check
 * @returns true if the provider is supported
 */
export function isEmailProviderSupported(email: string): boolean {
  const result = getEmailProviderSync(email);
  return result.provider !== null;
}

/**
 * Extract domain from email address
 * @param email - Email address
 * @returns Domain portion or null if invalid
 */
export function extractDomain(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return null;
  }
  return email.split('@')[1]?.toLowerCase() || null;
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Library metadata
 */
export const PROVIDER_COUNT = 93;
export const DOMAIN_COUNT = 178;

/**
 * Default export for convenience
 */
export default {
  getEmailProvider,
  getEmailProviderSync,
  getEmailProviderFast,
  normalizeEmail,
  emailsMatch,
  Config,
  PROVIDER_COUNT,
  DOMAIN_COUNT
};
