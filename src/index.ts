/**
 * Email Provider Links
 * 
 * A TypeScript package that provides direct links to email providers
 * based on email addresses to streamline login and password reset flows.
 * 
 * The package uses a two-tier detection system:
 * 1. Fast domain lookup against a JSON database of known providers
 * 2. DNS-based detection for custom business domains using MX/TXT record analysis
 * 
 * @packageDocumentation
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { resolveMx, resolveTxt } from 'dns';

// Convert Node.js callback-style DNS functions to Promise-based
const resolveMxAsync = promisify(resolveMx);
const resolveTxtAsync = promisify(resolveTxt);

/**
 * Default timeout for DNS queries in milliseconds.
 */
const DEFAULT_DNS_TIMEOUT = 5000; // 5 seconds

/**
 * Creates a Promise that rejects after the specified timeout.
 *
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects with timeout error
 * @internal
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`DNS query timeout after ${ms}ms`)), ms);
  });
}

/**
 * Wraps a DNS query with a timeout.
 *
 * @param promise - The DNS query promise
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that resolves with DNS result or rejects on timeout
 * @internal
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([promise, createTimeout(timeoutMs)]);
}

/**
 * Represents an email provider with its associated domains and login URL.
 * 
 * @interface EmailProvider
 * @example
 * ```typescript
 * {
 *   companyProvider: "Gmail",
 *   loginUrl: "https://mail.google.com/mail/",
 *   domains: ["gmail.com", "googlemail.com"],
 *   customDomainDetection: {
 *     mxPatterns: ["aspmx.l.google.com"],
 *     txtPatterns: ["v=spf1 include:_spf.google.com"]
 *   }
 * }
 * ```
 */
export interface EmailProvider {
  /** Human-readable name of the email provider company */
  companyProvider: string;
  /** Direct URL to the provider's login/webmail page */
  loginUrl: string;
  /** Array of email domains this provider handles (e.g., ['gmail.com', 'googlemail.com']) */
  domains: string[];
  /** Optional DNS-based detection patterns for custom business domains */
  customDomainDetection?: {
    /** MX record patterns to match against (e.g., ['aspmx.l.google.com']) */
    mxPatterns?: string[];
    /** TXT record patterns to match against (e.g., ['v=spf1 include:_spf.google.com']) */
    txtPatterns?: string[];
  };
}

/**
 * Result object returned by email provider detection functions.
 * 
 * @interface EmailProviderResult
 * @example
 * ```typescript
 * {
 *   provider: { companyProvider: "Gmail", loginUrl: "https://mail.google.com/mail/", domains: ["gmail.com"] },
 *   email: "user@gmail.com",
 *   loginUrl: "https://mail.google.com/mail/",
 *   detectionMethod: "domain_match"
 * }
 * ```
 */
export interface EmailProviderResult {
  /** The detected email provider, or null if not found/behind proxy */
  provider: EmailProvider | null;
  /** The original email address that was analyzed */
  email: string;
  /** Direct URL to the email provider's login page, or null if unknown */
  loginUrl: string | null;
  /** Method used to detect the provider */
  detectionMethod?: 'domain_match' | 'mx_record' | 'txt_record' | 'proxy_detected';
  /** If a proxy service was detected, which service (e.g., 'Cloudflare') */
  proxyService?: string;
}

/**
 * Result object returned by DNS-based provider detection.
 * 
 * @interface DNSDetectionResult
 * @example
 * ```typescript
 * {
 *   provider: { companyProvider: "Google Workspace", ... },
 *   detectionMethod: "mx_record",
 *   proxyService: undefined
 * }
 * ```
 */
export interface DNSDetectionResult {
  /** The detected email provider, or null if not found/behind proxy */
  provider: EmailProvider | null;
  /** Method used for DNS-based detection */
  detectionMethod: 'mx_record' | 'txt_record' | 'proxy_detected' | null;
  /** If a proxy service was detected, which service (e.g., 'Cloudflare') */
  proxyService?: string;
}

interface ProvidersData {
  providers: EmailProvider[];
}

// Load providers from external JSON file
let EMAIL_PROVIDERS: EmailProvider[] = [];
// Performance optimization: Create a domain-to-provider Map for O(1) lookups
let DOMAIN_TO_PROVIDER_MAP: Map<string, EmailProvider> = new Map();

/**
 * Builds a Map for fast domain-to-provider lookups.
 * This optimization improves lookup performance from O(n*m) to O(1)
 * where n = number of providers, m = average domains per provider.
 * 
 * @internal
 */
function buildDomainMap(): void {
  DOMAIN_TO_PROVIDER_MAP.clear();
  for (const provider of EMAIL_PROVIDERS) {
    for (const domain of provider.domains) {
      DOMAIN_TO_PROVIDER_MAP.set(domain.toLowerCase(), provider);
    }
  }
}

try {
  const providersPath = join(__dirname, '..', 'providers', 'emailproviders.json');
  const providersData: ProvidersData = JSON.parse(readFileSync(providersPath, 'utf8'));
  EMAIL_PROVIDERS = providersData.providers;
  buildDomainMap(); // Build optimized lookup map
} catch (error) {
  // Fallback to hardcoded providers if JSON file is not found
  console.warn('Could not load providers from JSON file, using fallback providers');
  EMAIL_PROVIDERS = [
    {
      companyProvider: 'Google',
      loginUrl: 'https://accounts.google.com/signin',
      domains: ['gmail.com', 'googlemail.com']
    },
    {
      companyProvider: 'Microsoft',
      loginUrl: 'https://outlook.live.com/owa/',
      domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com']
    },
    {
      companyProvider: 'Yahoo',
      loginUrl: 'https://login.yahoo.com/',
      domains: ['yahoo.com', 'yahoo.co.uk', 'yahoo.ca', 'yahoo.com.au', 'ymail.com', 'rocketmail.com']
    }
  ];
  buildDomainMap(); // Build optimized lookup map for fallback too
}

/**
 * Validates if a string is a valid email address using a basic regex pattern.
 * 
 * @param email - The string to validate as an email address
 * @returns true if the string matches basic email format, false otherwise
 * 
 * @example
 * ```typescript
 * isValidEmail('user@gmail.com');     // true
 * isValidEmail('invalid-email');      // false
 * isValidEmail('user@domain');        // false
 * ```
 * 
 * @remarks
 * This uses a simple regex pattern that covers most common email formats.
 * It may not catch all edge cases defined in RFC 5322, but works for 
 * standard email addresses.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extracts the domain portion from an email address.
 * 
 * @param email - The email address to extract the domain from
 * @returns The domain in lowercase, or null if the email is invalid
 * 
 * @example
 * ```typescript
 * extractDomain('user@Gmail.com');    // 'gmail.com'
 * extractDomain('test@yahoo.co.uk');  // 'yahoo.co.uk'
 * extractDomain('invalid-email');     // null
 * ```
 * 
 * @remarks
 * The domain is automatically normalized to lowercase for consistent matching.
 */
export function extractDomain(email: string): string | null {
  if (!isValidEmail(email)) {
    return null;
  }
  
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Finds an email provider by matching the domain against the known providers database.
 * Uses an optimized Map for O(1) lookup performance.
 * 
 * @param domain - The email domain to look up (e.g., 'gmail.com')
 * @returns The matching EmailProvider object, or null if not found
 * 
 * @example
 * ```typescript
 * const provider = findEmailProvider('gmail.com');
 * console.log(provider?.companyProvider); // 'Gmail'
 * console.log(provider?.loginUrl);        // 'https://mail.google.com/mail/'
 * ```
 * 
 * @remarks
 * This function performs a case-insensitive O(1) lookup using a pre-built Map.
 * It only checks the predefined JSON database, not DNS records.
 * Performance optimized from O(n*m) to O(1) where n=providers, m=domains per provider.
 */
export function findEmailProvider(domain: string): EmailProvider | null {
  const normalizedDomain = domain.toLowerCase();
  return DOMAIN_TO_PROVIDER_MAP.get(normalizedDomain) || null;
}

/**
 * Gets email provider information and login URL for a given email address.
 * This is the basic/synchronous version that only checks predefined domains.
 * 
 * @param email - The email address to analyze
 * @returns EmailProviderResult containing provider info and login URL
 * 
 * @example
 * ```typescript
 * const result = getEmailProviderLink('user@gmail.com');
 * console.log(result.loginUrl);        // 'https://mail.google.com/mail/'
 * console.log(result.provider?.companyProvider); // 'Gmail'
 * ```
 * 
 * @remarks
 * This function only checks against the predefined JSON database of known domains.
 * It will NOT detect business domains that use major email providers (e.g., 
 * mycompany.com using Google Workspace). For comprehensive detection including
 * business domains, use {@link getEmailProviderLinkWithDNS} instead.
 * 
 * **Limitations:**
 * - Only synchronous operation (no DNS lookups)
 * - Limited to domains in the JSON database
 * - Won't detect custom business domains
 * - No proxy service detection
 */
export function getEmailProviderLink(email: string): EmailProviderResult {
  const domain = extractDomain(email);
  
  if (!domain) {
    return {
      provider: null,
      email,
      loginUrl: null
    };
  }
  
  const provider = findEmailProvider(domain);
  
  return {
    provider,
    email,
    loginUrl: provider ? provider.loginUrl : null
  };
}

/**
 * Returns an array of all supported email providers.
 * 
 * @returns A copy of the EMAIL_PROVIDERS array
 * 
 * @example
 * ```typescript
 * const providers = getSupportedProviders();
 * console.log(providers.length);  // 55+
 * console.log(providers[0].companyProvider); // 'Gmail'
 * ```
 * 
 * @remarks
 * Returns a shallow copy to prevent external modification of the internal
 * providers array. The returned array includes both consumer email providers
 * (gmail.com, yahoo.com) and business email providers with DNS detection patterns.
 */
export function getSupportedProviders(): EmailProvider[] {
  return [...EMAIL_PROVIDERS];
}

/**
 * Checks if an email address uses a supported email provider.
 * 
 * @param email - The email address to check
 * @returns true if the provider is supported, false otherwise
 * 
 * @example
 * ```typescript
 * isEmailProviderSupported('user@gmail.com');     // true
 * isEmailProviderSupported('user@unknown.com');   // false
 * ```
 * 
 * @remarks
 * This is a convenience function that uses {@link getEmailProviderLink} internally.
 * It only checks predefined domains, not DNS-based detection. For business
 * domain support checking, you would need to use {@link getEmailProviderLinkWithDNS}.
 */
export function isEmailProviderSupported(email: string): boolean {
  const result = getEmailProviderLink(email);
  return result.provider !== null;
}

/**
 * Detects proxy services that obscure the actual email provider by analyzing MX records.
 * 
 * @param mxRecords - Array of MX records from DNS lookup
 * @returns The name of the detected proxy service, or null if none detected
 * 
 * @internal
 * @remarks
 * This function checks MX record patterns against known proxy/CDN services.
 * When a proxy is detected, it means we cannot determine the actual email
 * provider behind the proxy service. Currently detects:
 * - Cloudflare Email Routing
 * - CloudFront (AWS)
 * - Fastly
 * - MaxCDN
 * - KeyCDN
 * - Mailgun proxy configurations
 * - SendGrid proxy configurations
 * 
 * @example
 * ```typescript
 * const mxRecords = [{ exchange: 'isaac.mx.cloudflare.net', priority: 10 }];
 * const proxy = detectProxyService(mxRecords);
 * console.log(proxy); // 'Cloudflare'
 * ```
 */
function detectProxyService(mxRecords: { exchange: string; priority: number }[]): string | null {
  const proxyPatterns = [
    { service: 'Cloudflare', patterns: ['mxrecord.io', 'mxrecord.mx', 'cloudflare'] },
    { service: 'CloudFront', patterns: ['cloudfront.net'] },
    { service: 'Fastly', patterns: ['fastly.com'] },
    { service: 'MaxCDN', patterns: ['maxcdn.com'] },
    { service: 'KeyCDN', patterns: ['keycdn.com'] },
    { service: 'Mailgun Proxy', patterns: ['mailgun.org', 'mg.', 'mailgun'] },
    { service: 'SendGrid Proxy', patterns: ['sendgrid.net', 'sendgrid.com'] }
  ];
  
  for (const mxRecord of mxRecords) {
    const exchange = mxRecord.exchange.toLowerCase();
    
    for (const proxyService of proxyPatterns) {
      for (const pattern of proxyService.patterns) {
        if (exchange.includes(pattern.toLowerCase())) {
          return proxyService.service;
        }
      }
    }
  }
  
  return null;
}

/**
 * Performs DNS-based detection for custom business domains using MX and TXT record analysis.
 * This function is used internally by {@link getEmailProviderLinkWithDNS} but can also be
 * called directly to analyze domain email configuration.
 * 
 * @param domain - The domain to analyze (e.g., 'mycompany.com')
 * @param timeoutMs - Optional timeout for DNS queries in milliseconds (default: 5000ms)
 * @returns Promise resolving to DNSDetectionResult with provider info or proxy detection
 * 
 * @example
 * ```typescript
 * const result = await detectProviderByDNS('microsoft.com');
 * console.log(result.provider?.companyProvider); // 'Microsoft 365 (Business)'
 * console.log(result.detectionMethod);           // 'mx_record'
 * ```
 * 
 * @remarks
 * **Detection Algorithm:**
 * 1. Performs MX record lookup for the domain
 * 2. Checks if MX records match known proxy services (Cloudflare, etc.)
 * 3. If proxy detected, returns null provider with proxy info
 * 4. Otherwise, matches MX records against business email provider patterns
 * 5. If no MX match, falls back to TXT record analysis (SPF records, etc.)
 * 6. Returns the first matching provider or null if none found
 * 
 * **Provider Patterns Checked:**
 * - Google Workspace: aspmx.l.google.com, aspmx2.googlemail.com, etc.
 * - Microsoft 365: *.protection.outlook.com, *.outlook.com
 * - ProtonMail: mail.protonmail.ch, mailsec.protonmail.ch
 * - FastMail: *.messagingengine.com
 * - And many others...
 * 
 * **Error Handling:**
 * DNS lookup failures are caught and the function gracefully falls back
 * to the next detection method or returns null if all methods fail.
 */
export async function detectProviderByDNS(domain: string, timeoutMs: number = DEFAULT_DNS_TIMEOUT): Promise<DNSDetectionResult> {
  const normalizedDomain = domain.toLowerCase();
  
  // Get providers that support custom domain detection
  const customDomainProviders = EMAIL_PROVIDERS.filter(provider => 
    provider.customDomainDetection && 
    (provider.customDomainDetection.mxPatterns || provider.customDomainDetection.txtPatterns)
  );

  // Try MX record detection first with timeout
  try {
    const mxRecords = await withTimeout(resolveMxAsync(normalizedDomain), timeoutMs);
    
    // Check for proxy services first
    const proxyService = detectProxyService(mxRecords);
    if (proxyService) {
      return {
        provider: null,
        detectionMethod: 'proxy_detected',
        proxyService
      };
    }
    
    for (const provider of customDomainProviders) {
      if (provider.customDomainDetection?.mxPatterns) {
        for (const mxRecord of mxRecords) {
          const exchange = mxRecord.exchange.toLowerCase();
          
          for (const pattern of provider.customDomainDetection.mxPatterns) {
            if (exchange.includes(pattern.toLowerCase())) {
              return {
                provider,
                detectionMethod: 'mx_record'
              };
            }
          }
        }
      }
    }
  } catch (error) {
    // MX lookup failed, continue to TXT records
  }

  // Try TXT record detection with timeout
  try {
    const txtRecords = await withTimeout(resolveTxtAsync(normalizedDomain), timeoutMs);
    const flatTxtRecords = txtRecords.flat();
    
    for (const provider of customDomainProviders) {
      if (provider.customDomainDetection?.txtPatterns) {
        for (const txtRecord of flatTxtRecords) {
          const record = txtRecord.toLowerCase();
          
          for (const pattern of provider.customDomainDetection.txtPatterns) {
            if (record.includes(pattern.toLowerCase())) {
              return {
                provider,
                detectionMethod: 'txt_record'
              };
            }
          }
        }
      }
    }
  } catch (error) {
    // TXT lookup failed
  }

  return {
    provider: null,
    detectionMethod: null
  };
}

/**
 * Enhanced email provider detection with automatic DNS-based custom domain detection.
 * This is the recommended function for most use cases as it provides comprehensive
 * detection coverage including business domains and proxy services.
 * 
 * @param email - The email address to analyze
 * @param timeoutMs - Optional timeout for DNS queries in milliseconds (default: 5000ms)
 * @returns Promise resolving to EmailProviderResult with provider info and detection method
 * 
 * @example
 * ```typescript
 * // Consumer email (fast domain match)
 * const gmail = await getEmailProviderLinkWithDNS('user@gmail.com');
 * console.log(gmail.provider?.companyProvider); // 'Gmail'
 * console.log(gmail.detectionMethod);           // 'domain_match'
 * 
 * // Business domain (DNS detection)
 * const business = await getEmailProviderLinkWithDNS('user@mycompany.com');
 * console.log(business.provider?.companyProvider); // 'Google Workspace' (if detected)
 * console.log(business.detectionMethod);           // 'mx_record'
 * 
 * // Proxied domain (proxy detection)
 * const proxied = await getEmailProviderLinkWithDNS('user@proxied-domain.com');
 * console.log(proxied.provider);         // null
 * console.log(proxied.proxyService);     // 'Cloudflare'
 * console.log(proxied.detectionMethod);  // 'proxy_detected'
 * ```
 * 
 * @remarks
 * **Detection Hierarchy (in order):**
 * 1. **Domain Match**: Fast lookup against predefined domains (gmail.com, yahoo.com, etc.)
 * 2. **DNS MX Records**: Analyzes mail exchange records for business email providers
 * 3. **DNS TXT Records**: Checks SPF and verification records as fallback
 * 4. **Proxy Detection**: Identifies when domains are behind CDN/proxy services
 * 
 * **Supported Detection Cases:**
 * - ✅ Consumer emails: gmail.com, yahoo.com, outlook.com, etc.
 * - ✅ Business domains: Google Workspace, Microsoft 365, ProtonMail Business, etc.
 * - ✅ Proxy services: Cloudflare, CloudFront, Fastly, etc.
 * - ✅ International providers: QQ Mail, NetEase, Yandex, etc.
 * 
 * **Performance:**
 * - Fast for known consumer domains (synchronous JSON lookup)
 * - Additional DNS lookup time for unknown domains (~100-500ms)
 * - Graceful degradation if DNS lookups fail
 * 
 * **Error Handling:**
 * - Invalid email addresses return null provider
 * - DNS lookup failures are caught and don't throw errors
 * - Network timeouts gracefully fall back to null detection
 * 
 * **Use Cases:**
 * - Password reset flows ("Check your Gmail inbox")
 * - Login form enhancements (direct links to email providers)
 * - Email client detection for support purposes
 * - Business domain analysis for enterprise features
 */
export async function getEmailProviderLinkWithDNS(email: string, timeoutMs: number = DEFAULT_DNS_TIMEOUT): Promise<EmailProviderResult> {
  const domain = extractDomain(email);
  
  if (!domain) {
    return {
      provider: null,
      email,
      loginUrl: null
    };
  }
  
  // First try standard domain matching
  const provider = findEmailProvider(domain);
  
  if (provider) {
    return {
      provider,
      email,
      loginUrl: provider.loginUrl,
      detectionMethod: 'domain_match'
    };
  }
  
  // If no direct match, try DNS-based detection for custom domains
  const dnsResult = await detectProviderByDNS(domain, timeoutMs);
  
  if (dnsResult.provider) {
    return {
      provider: dnsResult.provider,
      email,
      loginUrl: dnsResult.provider.loginUrl,
      detectionMethod: dnsResult.detectionMethod || 'mx_record'
    };
  }
  
  // Handle proxy detection case
  if (dnsResult.detectionMethod === 'proxy_detected') {
    return {
      provider: null,
      email,
      loginUrl: null,
      detectionMethod: 'proxy_detected',
      proxyService: dnsResult.proxyService
    };
  }
  
  return {
    provider: null,
    email,
    loginUrl: null
  };
}

// Default export for convenience
export default {
  getEmailProviderLink,
  getEmailProviderLinkWithDNS,
  detectProviderByDNS,
  isValidEmail,
  extractDomain,
  findEmailProvider,
  getSupportedProviders,
  isEmailProviderSupported
};

