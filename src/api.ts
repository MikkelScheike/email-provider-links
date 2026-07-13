/**
 * Email Provider Links API
 * 
 * Simplified API with better error handling and performance improvements.
 * Clean function names and enhanced error context.
 */

import { loadProviders } from './provider-loader';
import { validateInternationalEmail, domainToPunycode, IDNValidationError } from './idn';
import { normalizeEmail } from './alias-detection';
import { DnsConstants } from './constants';
import type { ConcurrentDNSResult } from './concurrent-dns';

let cachedProvidersRef: EmailProvider[] | null = null;
let cachedDomainMap: Map<string, EmailProvider> | null = null;

function getDomainMapFromProviders(providers: EmailProvider[]): Map<string, EmailProvider> {
  if (cachedProvidersRef === providers && cachedDomainMap) {
    return cachedDomainMap;
  }

  const domainMap = new Map<string, EmailProvider>();

  for (const loadedProvider of providers) {
    for (const domain of loadedProvider.domains) {
      domainMap.set(domain.toLowerCase(), loadedProvider);
    }
  }

  cachedProvidersRef = providers;
  cachedDomainMap = domainMap;
  return domainMap;
}

/** Lazy-load DNS engine so sync-only consumers avoid parsing concurrent-dns. */
function detectProviderConcurrentLazy(
  domain: string,
  providers: EmailProvider[],
  config: {
    timeout?: number;
    enableParallel?: boolean;
    collectDebugInfo?: boolean;
  }
): Promise<ConcurrentDNSResult> {
  // CJS lazy require keeps cold import light and stays compatible with Jest mocks.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { detectProviderConcurrent } = require('./concurrent-dns') as typeof import('./concurrent-dns');
  return detectProviderConcurrent(domain, providers, config);
}

function normalizeValidatedEmail(trimmedEmail: string, domain: string): string {
  return normalizeEmail(trimmedEmail, {
    alreadyValidated: true,
    punycodeDomain: domain
  });
}

function lookupKnownProvider(domain: string): {
  ok: true;
  provider: EmailProvider | null;
} | {
  ok: false;
  error: NonNullable<EmailProviderResult['error']>;
} {
  try {
    const result = loadProviders();
    if (!result.success) {
      if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
        console.error('Provider lookup blocked due to validation failure');
      }
      return {
        ok: false,
        error: {
          type: 'NETWORK_ERROR',
          message: 'Service temporarily unavailable'
        }
      };
    }

    const domainMap = result.domainMap ?? getDomainMapFromProviders(result.providers);
    return { ok: true, provider: domainMap.get(domain) || null };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      console.error('Provider lookup failed:', error);
    }
    return {
      ok: false,
      error: {
        type: 'NETWORK_ERROR',
        message: 'Service temporarily unavailable'
      }
    };
  }
}

function validateAndParseEmailForLookup(email: string): {
  ok: true;
  trimmedEmail: string;
  domain: string;
} | {
  ok: false;
  email: string;
  error: NonNullable<EmailProviderResult['error']>;
} {
  if (!email || typeof email !== 'string') {
    return {
      ok: false,
      email: email || '',
      error: {
        type: 'INVALID_EMAIL',
        message: 'Email address is required and must be a string'
      }
    };
  }

  const trimmedEmail = email.trim();

  // Strict validation: treat any IDN validation failure as invalid input.
  // Only surface IDN_VALIDATION_ERROR for true encoding issues.
  const idnError = validateInternationalEmail(trimmedEmail);
  if (idnError) {
    if (idnError.code === IDNValidationError.INVALID_ENCODING) {
      return {
        ok: false,
        email: trimmedEmail,
        error: {
          type: 'IDN_VALIDATION_ERROR',
          message: idnError.message,
          idnError: idnError.code
        }
      };
    }
    return {
      ok: false,
      email: trimmedEmail,
      error: {
        type: 'INVALID_EMAIL',
        message: 'Invalid email format'
      }
    };
  }

  const atIndex = trimmedEmail.lastIndexOf('@');
  if (atIndex === -1) {
    return {
      ok: false,
      email: trimmedEmail,
      error: {
        type: 'INVALID_EMAIL',
        message: 'Invalid email format'
      }
    };
  }

  const domainRaw = trimmedEmail.slice(atIndex + 1).toLowerCase();
  const domain = domainToPunycode(domainRaw);

  return { ok: true, trimmedEmail, domain };
}

// EmailProvider interface
export type ProviderType = 
  | 'public_provider'  // Regular email providers (Gmail, Yahoo, etc.)
  | 'custom_provider'  // Business email services (Google Workspace, Microsoft 365)
  | 'proxy_service';   // Email proxy services (Cloudflare, etc.)

export interface EmailProvider {
  companyProvider: string;
  loginUrl: string | null;
  domains: string[];
  type: ProviderType;
  alias?: {
    dots?: {
      ignore: boolean;
      strip: boolean;
    };
    plus?: {
      ignore: boolean;
      strip: boolean;
    };
    case?: {
      ignore: boolean;
      strip: boolean;
    };
  };
  customDomainDetection?: {
    mxPatterns?: string[];
    txtPatterns?: string[];
  };
}

/**
 * Simplified provider information for frontend use
 * Contains only essential fields needed by consumers
 */
export interface SimplifiedProvider {
  /** The provider name (e.g., "Gmail", "ProtonMail") */
  companyProvider: string;
  /** Direct URL to the email provider's login page */
  loginUrl: string | null;
  /** Provider type for UI differentiation */
  type: ProviderType;
}

/**
 * Extended result interface with full provider details
 * Includes internal implementation details like domains array and alias configuration.
 * Use this when you need access to all provider metadata.
 */
export interface EmailProviderResult {
  /** The detected email provider, or null if not found */
  provider: EmailProvider | null;
  /** The original email address that was analyzed */
  email: string;
  /** Direct URL to the email provider's login page, or null if unknown */
  loginUrl: string | null;
  /** Method used to detect the provider */
  detectionMethod?: 'domain_match' | 'mx_record' | 'txt_record' | 'both' | 'proxy_detected';
  /** If a proxy service was detected, which service (e.g., 'Cloudflare') */
  proxyService?: string;
  /** Error information if detection failed */
  error?: {
    type: 'INVALID_EMAIL' | 'DNS_TIMEOUT' | 'RATE_LIMITED' | 'UNKNOWN_DOMAIN' | 'NETWORK_ERROR' | 'IDN_VALIDATION_ERROR';
    message: string;
    retryAfter?: number; // seconds until retry allowed (for rate limiting)
    idnError?: string; // specific IDN validation error message
  };
}

/**
 * Standard result interface (default)
 * Contains only essential information needed by consumers.
 * This is the default response format for all API functions.
 */
export interface SimplifiedEmailProviderResult {
  /** The detected email provider (simplified), or null if not found */
  provider: SimplifiedProvider | null;
  /** The normalized email address */
  email: string;
  /** Method used to detect the provider */
  detectionMethod?: 'domain_match' | 'mx_record' | 'txt_record' | 'both' | 'proxy_detected';
  /** Error information if detection failed */
  error?: {
    type: 'INVALID_EMAIL' | 'DNS_TIMEOUT' | 'RATE_LIMITED' | 'UNKNOWN_DOMAIN' | 'NETWORK_ERROR' | 'IDN_VALIDATION_ERROR';
    message: string;
    retryAfter?: number;
    idnError?: string;
  };
}

/**
 * Convert a full EmailProvider to a simplified version
 */
function simplifyProvider(provider: EmailProvider | null): SimplifiedProvider | null {
  if (!provider) return null;
  return {
    companyProvider: provider.companyProvider,
    loginUrl: provider.loginUrl,
    type: provider.type
  };
}

/**
 * Get email provider information for any email address.
 * 
 * This is the primary function that handles all email types:
 * - Consumer emails (gmail.com, yahoo.com, etc.)
 * - Business domains (mycompany.com using Google Workspace, etc.)
 * - Unknown providers (graceful fallback)
 * 
 * By default, returns a simplified response with only essential fields.
 * Use the `extended` option to get full provider details including domains and alias configuration.
 * 
 * @param email - The email address to analyze
 * @param options - Optional configuration: timeout for DNS queries (default: 5000ms) and extended response flag
 * @returns Promise resolving to SimplifiedEmailProviderResult (default) or EmailProviderResult (if extended)
 */
export async function getEmailProvider(
  email: string,
  options?: number | { timeout?: number; extended?: false }
): Promise<SimplifiedEmailProviderResult>;
export async function getEmailProvider(
  email: string,
  options: { timeout?: number; extended: true }
): Promise<EmailProviderResult>;
export async function getEmailProvider(
  email: string,
  options?: number | { timeout?: number; extended?: boolean }
): Promise<SimplifiedEmailProviderResult | EmailProviderResult>;
export async function getEmailProvider(
  email: string, 
  options?: number | { timeout?: number; extended?: boolean }
): Promise<SimplifiedEmailProviderResult | EmailProviderResult> {
  // Parse options - support both legacy (number) and new (object) format
  const timeout = typeof options === 'number' ? options : options?.timeout;
  const extended = typeof options === 'object' && options?.extended === true;

  try {
    const parsed = validateAndParseEmailForLookup(email);
    if (!parsed.ok) {
      let normalizedEmail = parsed.email;
      try {
        normalizedEmail = normalizeEmail(parsed.email);
      } catch {
        // keep original
      }
      const errorResult = {
        provider: null,
        email: normalizedEmail,
        ...(extended ? { loginUrl: null } : {}),
        error: parsed.error
      };
      return extended ? errorResult as EmailProviderResult : errorResult as SimplifiedEmailProviderResult;
    }

    const { trimmedEmail, domain } = parsed;
    const normalizedEmail = normalizeValidatedEmail(trimmedEmail, domain);

    // Fast path: known domain map (no DNS module load)
    const known = lookupKnownProvider(domain);
    if (!known.ok) {
      const errorResult = {
        provider: null,
        email: normalizedEmail,
        ...(extended ? { loginUrl: null } : {}),
        error: known.error
      };
      return extended ? errorResult as EmailProviderResult : errorResult as SimplifiedEmailProviderResult;
    }

    if (known.provider) {
      if (extended) {
        return {
          provider: known.provider,
          email: normalizedEmail,
          loginUrl: known.provider.loginUrl,
          detectionMethod: 'domain_match'
        };
      }
      return {
        provider: simplifyProvider(known.provider),
        email: normalizedEmail,
        detectionMethod: 'domain_match'
      };
    }

    // Fall back to DNS detection for business domains (lazy-loaded)
    const loadResult = loadProviders();
    if (!loadResult.success) {
      const errorResult = {
        provider: null,
        email: normalizedEmail,
        ...(extended ? { loginUrl: null } : {}),
        error: {
          type: 'NETWORK_ERROR' as const,
          message: 'Service temporarily unavailable'
        }
      };
      return extended ? errorResult as EmailProviderResult : errorResult as SimplifiedEmailProviderResult;
    }

    const concurrentResult = await detectProviderConcurrentLazy(domain, loadResult.providers, {
      timeout: timeout || DnsConstants.DEFAULT_TIMEOUT_MS,
      enableParallel: true,
      collectDebugInfo: false
    });

    if (extended) {
      const result: EmailProviderResult = {
        provider: concurrentResult.provider,
        email: normalizedEmail,
        loginUrl: concurrentResult.provider?.loginUrl || null,
        detectionMethod: concurrentResult.detectionMethod || 'mx_record'
      };

      if (concurrentResult.proxyService) {
        result.proxyService = concurrentResult.proxyService;
      }

      if (!result.provider && !result.proxyService) {
        result.error = {
          type: 'UNKNOWN_DOMAIN',
          message: `No email provider found for domain: ${domain}`
        };
      }

      return result;
    }

    const result: SimplifiedEmailProviderResult = {
      provider: simplifyProvider(concurrentResult.provider),
      email: normalizedEmail,
      detectionMethod: concurrentResult.detectionMethod || 'mx_record'
    };

    if (!result.provider) {
      result.error = {
        type: 'UNKNOWN_DOMAIN',
        message: `No email provider found for domain: ${domain}`
      };
    }

    return result;

  } catch (error: unknown) {
    // Enhanced error handling
    const errorResult: any = {
      provider: null,
      email,
      error: {} as EmailProviderResult['error']
    };
    if (extended) {
      errorResult.loginUrl = null;
    }

    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      const retryMatch = error.message.match(/Try again in (\d+) seconds/);
      const retryAfter = retryMatch?.[1] ? parseInt(retryMatch[1], 10) : undefined;
      
      errorResult.error = {
        type: 'RATE_LIMITED',
        message: 'DNS query rate limit exceeded',
        ...(retryAfter !== undefined ? { retryAfter } : {})
      };
      return extended ? errorResult as EmailProviderResult : errorResult as SimplifiedEmailProviderResult;
    }

    if (error instanceof Error && error.message.includes('timeout')) {
      errorResult.error = {
        type: 'DNS_TIMEOUT',
        message: `DNS lookup timed out after ${timeout || 5000}ms`
      };
      return extended ? errorResult as EmailProviderResult : errorResult as SimplifiedEmailProviderResult;
    }

    errorResult.error = {
      type: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Unknown network error'
    };
    return extended ? errorResult as EmailProviderResult : errorResult as SimplifiedEmailProviderResult;
  }
}

/**
 * Get email provider information synchronously (no DNS lookup).
 *
 * Only checks predefined domains (no DNS). Use `extended: true` for full provider metadata.
 */
export function getEmailProviderSync(
  email: string,
  options?: { extended?: false }
): SimplifiedEmailProviderResult;
export function getEmailProviderSync(
  email: string,
  options: { extended: true }
): EmailProviderResult;
export function getEmailProviderSync(
  email: string,
  options?: { extended?: boolean }
): SimplifiedEmailProviderResult | EmailProviderResult;
export function getEmailProviderSync(
  email: string,
  options?: { extended?: boolean }
): SimplifiedEmailProviderResult | EmailProviderResult {
  const extended = options?.extended === true;
  try {
    const parsed = validateAndParseEmailForLookup(email);
    if (!parsed.ok) {
      let normalizedEmail = parsed.email;
      try {
        normalizedEmail = normalizeEmail(parsed.email);
      } catch {
        // keep original
      }
      const errorResult: SimplifiedEmailProviderResult | EmailProviderResult = {
        provider: null,
        email: normalizedEmail,
        error: parsed.error,
        ...(extended ? { loginUrl: null } : {})
      };
      return errorResult;
    }

    const { trimmedEmail, domain } = parsed;
    const normalizedEmail = normalizeValidatedEmail(trimmedEmail, domain);
    const known = lookupKnownProvider(domain);

    if (!known.ok) {
      const errorResult: SimplifiedEmailProviderResult | EmailProviderResult = {
        provider: null,
        email: normalizedEmail,
        error: known.error,
        ...(extended ? { loginUrl: null } : {})
      };
      return errorResult;
    }

    const provider = known.provider;

    if (extended) {
      const result: EmailProviderResult = {
        provider: provider || null,
        email: normalizedEmail,
        loginUrl: provider?.loginUrl || null,
        detectionMethod: 'domain_match'
      };

      if (!result.provider) {
        result.error = {
          type: 'UNKNOWN_DOMAIN',
          message: `No email provider found for domain: ${domain} (sync mode - business domains not supported)`
        };
      }

      return result;
    }

    const result: SimplifiedEmailProviderResult = {
      provider: simplifyProvider(provider),
      email: normalizedEmail,
      detectionMethod: 'domain_match'
    };

    if (!result.provider) {
      result.error = {
        type: 'UNKNOWN_DOMAIN',
        message: `No email provider found for domain: ${domain} (sync mode - business domains not supported)`
      };
    }

    return result;

  } catch (error: unknown) {
    const errorResult: SimplifiedEmailProviderResult | EmailProviderResult = {
      provider: null,
      email,
      error: {
        type: 'INVALID_EMAIL',
        message: error instanceof Error ? error.message : 'Invalid email address'
      },
      ...(extended ? { loginUrl: null } : {})
    };
    return errorResult;
  }
}

// Re-export alias detection functions from the dedicated module
export { normalizeEmail, emailsMatch } from './alias-detection';

/**
 * Enhanced email provider detection with concurrent DNS for maximum performance.
 * Uses parallel MX/TXT lookups for faster business domain detection, and includes
 * timing / confidence metadata for monitoring.
 * 
 * Prefer `getEmailProvider()` unless you need timing or debug data.
 */
export async function getEmailProviderFast(
  email: string,
  options?: {
    timeout?: number;
    enableParallel?: boolean;
    collectDebugInfo?: boolean;
    extended?: false;
  }
): Promise<SimplifiedEmailProviderResult & {
  timing?: { mx: number; txt: number; total: number };
  confidence?: number;
  debug?: unknown;
}>;
export async function getEmailProviderFast(
  email: string,
  options: {
    timeout?: number;
    enableParallel?: boolean;
    collectDebugInfo?: boolean;
    extended: true;
  }
): Promise<EmailProviderResult & {
  timing?: { mx: number; txt: number; total: number };
  confidence?: number;
  debug?: unknown;
}>;
export async function getEmailProviderFast(
  email: string, 
  options: {
    timeout?: number;
    enableParallel?: boolean;
    collectDebugInfo?: boolean;
    extended?: boolean;
  } = {}
): Promise<(SimplifiedEmailProviderResult | EmailProviderResult) & {
  timing?: {
    mx: number;
    txt: number;
    total: number;
  };
  confidence?: number;
  debug?: unknown;
}> {
  const {
    timeout = 5000,
    enableParallel = true,
    collectDebugInfo = false,
    extended = false
  } = options;

  try {
    const parsed = validateAndParseEmailForLookup(email);
    if (!parsed.ok) {
      return {
        provider: null,
        email: parsed.email,
        ...(extended ? { loginUrl: null } : {}),
        error: parsed.error
      };
    }

    const { domain, trimmedEmail } = parsed;
    const normalizedEmail = normalizeValidatedEmail(trimmedEmail, domain);

    const known = lookupKnownProvider(domain);
    if (!known.ok) {
      return {
        provider: null,
        email: normalizedEmail,
        ...(extended ? { loginUrl: null } : {}),
        error: known.error
      };
    }

    if (known.provider) {
      if (extended) {
        return {
          provider: known.provider,
          email: normalizedEmail,
          loginUrl: known.provider.loginUrl,
          detectionMethod: 'domain_match',
          timing: { mx: 0, txt: 0, total: 0 },
          confidence: 1.0
        };
      }
      return {
        provider: simplifyProvider(known.provider),
        email: normalizedEmail,
        detectionMethod: 'domain_match',
        timing: { mx: 0, txt: 0, total: 0 },
        confidence: 1.0
      };
    }

    const result = loadProviders();
    if (!result.success) {
      return {
        provider: null,
        email: normalizedEmail,
        ...(extended ? { loginUrl: null } : {}),
        error: {
          type: 'NETWORK_ERROR',
          message: 'Service temporarily unavailable'
        }
      };
    }

    const concurrentResult = await detectProviderConcurrentLazy(domain, result.providers, {
      timeout,
      enableParallel,
      collectDebugInfo
    });

    if (extended) {
      const fastResult: EmailProviderResult & {
        timing?: { mx: number; txt: number; total: number };
        confidence?: number;
        debug?: unknown;
      } = {
        provider: concurrentResult.provider,
        email: normalizedEmail,
        loginUrl: concurrentResult.provider?.loginUrl || null,
        detectionMethod: concurrentResult.detectionMethod || 'mx_record',
        timing: concurrentResult.timing,
        confidence: concurrentResult.confidence,
        debug: concurrentResult.debug,
        error: !concurrentResult.provider && !concurrentResult.proxyService ? {
          type: 'UNKNOWN_DOMAIN',
          message: `No email provider found for domain: ${domain}`
        } : undefined
      };

      if (concurrentResult.proxyService) {
        fastResult.proxyService = concurrentResult.proxyService;
      }

      return fastResult;
    }

    return {
      provider: simplifyProvider(concurrentResult.provider),
      email: normalizedEmail,
      detectionMethod: concurrentResult.detectionMethod || 'mx_record',
      timing: concurrentResult.timing,
      confidence: concurrentResult.confidence,
      debug: concurrentResult.debug,
      error: !concurrentResult.provider ? {
        type: 'UNKNOWN_DOMAIN',
        message: `No email provider found for domain: ${domain}`
      } : undefined
    };

  } catch (error: unknown) {
    const errorResult: SimplifiedEmailProviderResult | EmailProviderResult = {
      provider: null,
      email,
      error: {
        type: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'DNS detection failed'
      },
      ...(extended ? { loginUrl: null } : {})
    };
    return errorResult;
  }
}

/**
 * Configuration constants
 */
export const Config = {
  DEFAULT_DNS_TIMEOUT: DnsConstants.DEFAULT_TIMEOUT_MS,
  MAX_DNS_REQUESTS_PER_MINUTE: DnsConstants.MAX_REQUESTS_PER_MINUTE,
  SUPPORTED_PROVIDERS_COUNT: 140,
  SUPPORTED_DOMAINS_COUNT: 259
} as const;
