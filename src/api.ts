/**
 * Email Provider Links API
 * 
 * Simplified API with better error handling and performance improvements.
 * Clean function names and enhanced error context.
 */

import { 
  detectProviderConcurrent
} from './concurrent-dns';
import { loadProviders } from './loader';

// EmailProvider interface
export interface EmailProvider {
  companyProvider: string;
  loginUrl: string;
  domains: string[];
  customDomainDetection?: {
    mxPatterns?: string[];
    txtPatterns?: string[];
  };
}

/**
 * Enhanced result interface with rich error context
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
 * Get email provider information for any email address.
 * 
 * This is the primary function that handles all email types:
 * - Consumer emails (gmail.com, yahoo.com, etc.)
 * - Business domains (mycompany.com using Google Workspace, etc.)
 * - Unknown providers (graceful fallback)
 * 
 * @param email - The email address to analyze
 * @param timeout - Optional timeout for DNS queries in milliseconds (default: 5000ms)
 * @returns Promise resolving to EmailProviderResult with provider info and error context
 * 
 * @example
 * ```typescript
 * // Consumer email
 * const gmail = await getEmailProvider('user@gmail.com');
 * console.log(gmail.provider?.companyProvider); // "Gmail"
 * console.log(gmail.loginUrl);                  // "https://mail.google.com/mail/"
 * 
 * // Business domain
 * const business = await getEmailProvider('user@mycompany.com');
 * console.log(business.provider?.companyProvider); // "Google Workspace" (if detected)
 * console.log(business.detectionMethod);          // "mx_record"
 * 
 * // Error handling
 * const invalid = await getEmailProvider('invalid-email');
 * console.log(invalid.error?.type);    // "INVALID_EMAIL"
 * console.log(invalid.error?.message); // "Invalid email format"
 * ```
 */
export async function getEmailProvider(email: string, timeout?: number): Promise<EmailProviderResult> {
  try {
    // Input validation
    if (!email || typeof email !== 'string') {
      return {
        provider: null,
        email: email || '',
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Email address is required and must be a string'
        }
      };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        provider: null,
        email,
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return {
        provider: null,
        email,
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Invalid email format - missing domain'
        }
      };
    }

    // First try synchronous domain matching
    const syncResult = getEmailProviderSync(email);
    if (syncResult.provider) {
      return {
        ...syncResult,
        detectionMethod: 'domain_match'
      };
    }

    // Fall back to DNS detection for business domains
    const { providers } = loadProviders();
    const concurrentResult = await detectProviderConcurrent(domain, providers, {
      timeout: timeout || 5000,
      enableParallel: true,
      collectDebugInfo: false
    });

    const result: EmailProviderResult = {
      provider: concurrentResult.provider,
      email,
      loginUrl: concurrentResult.provider?.loginUrl || null,
      detectionMethod: concurrentResult.detectionMethod || 'mx_record'
    };

    if (concurrentResult.proxyService) {
      result.proxyService = concurrentResult.proxyService;
    }

    // Add error context for null results
    if (!result.provider && !result.proxyService) {
      result.error = {
        type: 'UNKNOWN_DOMAIN',
        message: `No email provider found for domain: ${domain}`
      };
    }

    return result;

  } catch (error: any) {
    // Enhanced error handling
    if (error.message?.includes('Rate limit exceeded')) {
      const retryMatch = error.message.match(/Try again in (\d+) seconds/);
      const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : undefined;
      
      return {
        provider: null,
        email,
        loginUrl: null,
        error: {
          type: 'RATE_LIMITED',
          message: 'DNS query rate limit exceeded',
          ...(retryAfter !== undefined ? { retryAfter } : {})
        }
      };
    }

    if (error.message?.includes('timeout')) {
      return {
        provider: null,
        email,
        loginUrl: null,
        error: {
          type: 'DNS_TIMEOUT',
          message: `DNS lookup timed out after ${timeout || 5000}ms`
        }
      };
    }

    return {
      provider: null,
      email,
      loginUrl: null,
      error: {
        type: 'NETWORK_ERROR',
        message: error.message || 'Unknown network error'
      }
    };
  }
}

/**
 * Get email provider information synchronously (no DNS lookup).
 * 
 * This function only checks predefined domains and returns immediately.
 * Use this when you can't use async functions or don't want DNS lookups.
 * 
 * @param email - The email address to analyze
 * @returns EmailProviderResult with provider info (limited to known domains)
 * 
 * @example
 * ```typescript
 * // Works for known domains
 * const gmail = getEmailProviderSync('user@gmail.com');
 * console.log(gmail.provider?.companyProvider); // "Gmail"
 * 
 * // Unknown domains return null
 * const unknown = getEmailProviderSync('user@mycompany.com');
 * console.log(unknown.provider); // null
 * console.log(unknown.error?.type); // "UNKNOWN_DOMAIN"
 * ```
 */
export function getEmailProviderSync(email: string): EmailProviderResult {
  try {
    // Input validation
    if (!email || typeof email !== 'string') {
      return {
        provider: null,
        email: email || '',
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Email address is required and must be a string'
        }
      };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        provider: null,
        email,
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      };
    }

    // Pure synchronous domain matching
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return {
        provider: null,
        email,
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Invalid email format - missing domain'
        }
      };
    }

    // Load providers and find matching domain
    const { providers } = loadProviders();
    const provider = providers.find(p => 
      p.domains?.some(d => d.toLowerCase() === domain)
    );

    const result: EmailProviderResult = {
      provider: provider || null,
      email,
      loginUrl: provider?.loginUrl || null,
      detectionMethod: 'domain_match'
    };

    // Add error context for null results
    if (!result.provider) {
      result.error = {
        type: 'UNKNOWN_DOMAIN',
        message: `No email provider found for domain: ${domain} (sync mode - business domains not supported)`
      };
    }

    return result;

  } catch (error: any) {
    return {
      provider: null,
      email,
      loginUrl: null,
      error: {
        type: 'INVALID_EMAIL',
        message: error.message || 'Invalid email address'
      }
    };
  }
}

/**
 * Normalize an email address to its canonical form.
 * 
 * This handles provider-specific aliasing rules:
 * - Gmail: removes dots and plus addressing
 * - Other providers: removes plus addressing only
 * 
 * @param email - The email address to normalize
 * @returns The canonical email address
 * 
 * @example
 * ```typescript
 * const canonical = normalizeEmail('U.S.E.R+work@GMAIL.COM');
 * console.log(canonical); // 'user@gmail.com'
 * 
 * const outlook = normalizeEmail('user+newsletter@outlook.com');
 * console.log(outlook); // 'user@outlook.com'
 * ```
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return email;
  }

  // Convert to lowercase
  const lowercaseEmail = email.toLowerCase().trim();
  
  // Split email into local and domain parts
  const atIndex = lowercaseEmail.lastIndexOf('@');
  if (atIndex === -1) {
    return lowercaseEmail;
  }
  
  let localPart = lowercaseEmail.slice(0, atIndex);
  const domainPart = lowercaseEmail.slice(atIndex + 1);
  
  // Gmail-specific rules: remove dots and plus addressing
  if (domainPart === 'gmail.com' || domainPart === 'googlemail.com') {
    // Remove all dots from local part
    localPart = localPart.replace(/\./g, '');
    // Remove plus addressing (everything after +)
    const plusIndex = localPart.indexOf('+');
    if (plusIndex !== -1) {
      localPart = localPart.slice(0, plusIndex);
    }
  } else {
    // For other providers, only remove plus addressing
    const plusIndex = localPart.indexOf('+');
    if (plusIndex !== -1) {
      localPart = localPart.slice(0, plusIndex);
    }
  }
  
  return `${localPart}@${domainPart}`;
}

/**
 * Check if two email addresses are the same person (accounting for aliases).
 * 
 * This normalizes both emails and compares their canonical forms.
 * Useful for preventing duplicate accounts and matching login attempts.
 * 
 * @param email1 - First email address
 * @param email2 - Second email address
 * @returns true if the emails represent the same person
 * 
 * @example
 * ```typescript
 * const match = emailsMatch('user@gmail.com', 'u.s.e.r+work@gmail.com');
 * console.log(match); // true
 * 
 * const different = emailsMatch('user@gmail.com', 'other@gmail.com');
 * console.log(different); // false
 * ```
 */
export function emailsMatch(email1: string, email2: string): boolean {
  if (!email1 || !email2 || typeof email1 !== 'string' || typeof email2 !== 'string') {
    return false;
  }
  
  // Normalize both emails and compare
  const normalized1 = normalizeEmail(email1);
  const normalized2 = normalizeEmail(email2);
  
  return normalized1 === normalized2;
}

/**
 * Enhanced email provider detection with concurrent DNS for maximum performance.
 * This function uses parallel MX/TXT lookups for 2x faster business domain detection.
 * 
 * @param email - The email address to analyze
 * @param options - Configuration options for DNS detection
 * @returns Promise resolving to EmailProviderResult with enhanced performance data
 * 
 * @example
 * ```typescript
 * // High-performance detection with concurrent DNS
 * const result = await getEmailProviderFast('user@mycompany.com', {
 *   enableParallel: true,
 *   collectDebugInfo: true
 * });
 * 
 * console.log(result.provider?.companyProvider); // "Google Workspace"
 * console.log(result.detectionMethod);           // "mx_record" 
 * console.log(result.timing);                    // { mx: 120, txt: 95, total: 125 }
 * ```
 */
export async function getEmailProviderFast(
  email: string, 
  options: {
    timeout?: number;
    enableParallel?: boolean;
    collectDebugInfo?: boolean;
  } = {}
): Promise<EmailProviderResult & {
  timing?: {
    mx: number;
    txt: number;
    total: number;
  };
  confidence?: number;
  debug?: any;
}> {
  const {
    timeout = 5000,
    enableParallel = true,
    collectDebugInfo = false
  } = options;

  try {
    // Input validation
    if (!email || typeof email !== 'string') {
      return {
        provider: null,
        email: email || '',
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Email address is required and must be a string'
        }
      };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        provider: null,
        email,
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return {
        provider: null,
        email,
        loginUrl: null,
        error: {
          type: 'INVALID_EMAIL',
          message: 'Invalid email format - missing domain'
        }
      };
    }

    // First try standard domain matching (fast path)
    const syncResult = getEmailProviderSync(email);
    if (syncResult.provider) {
      return {
        ...syncResult,
        detectionMethod: 'domain_match',
        timing: { mx: 0, txt: 0, total: 0 },
        confidence: 1.0
      };
    }

    // Fall back to concurrent DNS detection for business domains
    const { providers } = loadProviders();
    const concurrentResult = await detectProviderConcurrent(domain, providers, {
      timeout,
      enableParallel,
      collectDebugInfo
    });

    return {
      provider: concurrentResult.provider,
      email,
      loginUrl: concurrentResult.provider?.loginUrl || null,
      detectionMethod: concurrentResult.detectionMethod || 'mx_record',
      proxyService: concurrentResult.proxyService,
      timing: concurrentResult.timing,
      confidence: concurrentResult.confidence,
      debug: concurrentResult.debug,
      error: !concurrentResult.provider && !concurrentResult.proxyService ? {
        type: 'UNKNOWN_DOMAIN',
        message: `No email provider found for domain: ${domain}`
      } : undefined
    };

  } catch (error: any) {
    return {
      provider: null,
      email,
      loginUrl: null,
      error: {
        type: 'NETWORK_ERROR',
        message: error.message || 'DNS detection failed'
      }
    };
  }
}

/**
 * Configuration constants
 */
export const Config = {
  DEFAULT_DNS_TIMEOUT: 5000,
  MAX_DNS_REQUESTS_PER_MINUTE: 10,
  SUPPORTED_PROVIDERS_COUNT: 93,
  SUPPORTED_DOMAINS_COUNT: 180
} as const;