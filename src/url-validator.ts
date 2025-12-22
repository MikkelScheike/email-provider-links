/**
 * URL Security Validation Module
 * 
 * Provides validation and allowlisting for email provider URLs to prevent
 * malicious redirects and supply chain attacks.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { verifyProvidersIntegrity } from './hash-verifier';
import type { ProvidersData } from './schema';

/**
 * Get allowlisted domains from provider data
 * Only URLs from these domains will be considered safe.
 */
export function getAllowedDomains(): Set<string> {
  const filePath = join(__dirname, '..', 'providers', 'emailproviders.json');
  const integrity = verifyProvidersIntegrity(filePath);
  if (!integrity.isValid) {
    return new Set<string>();
  }

  if (cachedAllowedDomains && cachedAllowlistHash === integrity.actualHash) {
    return cachedAllowedDomains;
  }

  const fileContent = readFileSync(filePath, 'utf8');
  const data: ProvidersData = JSON.parse(fileContent);
  const providers = data.providers;
  const allowedDomains = new Set<string>();

  for (const provider of providers) {
    if (provider.loginUrl) {
      try {
        const url = new URL(provider.loginUrl);
        allowedDomains.add(domainToPunycode(url.hostname.toLowerCase()));
      } catch {
        // Skip invalid URLs
        continue;
      }
    }
  }

  cachedAllowedDomains = allowedDomains;
  cachedAllowlistHash = integrity.actualHash;
  return allowedDomains;
}

let cachedAllowedDomains: Set<string> | null = null;
let cachedAllowlistHash: string | null = null;

/**
 * Suspicious URL patterns that should always be rejected
 */
const SUSPICIOUS_PATTERNS = [
  /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
  /localhost/i,
  /127\.0\.0\.1/,
  /192\.168\./,
  /10\./,
  /172\./,
  /\.tk$|\.ml$|\.ga$|\.cf$/i, // Suspicious TLDs
  /[a-z0-9]+-[a-z0-9]+-[a-z0-9]+\./i, // Random subdomain patterns
];

/**
 * URL shortener domains (should be rejected for security)
 */
const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'short.link',
  'ow.ly',
  'is.gd',
  'buff.ly'
];

import { domainToPunycode } from './idn';

type ProviderUrlLike = {
  companyProvider?: string;
  loginUrl?: string | null;
};

export interface URLValidationResult {
  isValid: boolean;
  reason?: string;
  domain?: string;
  normalizedUrl?: string;
}

/**
 * Validates if a URL is safe for email provider redirects
 * 
 * @param url - The URL to validate
 * @returns Validation result with details
 */
export function validateEmailProviderUrl(url: string): URLValidationResult {
  try {
    // Check for malicious patterns in raw URL before parsing
    const rawUrl = url.toLowerCase();
    
    // Decode URL to catch encoded malicious patterns
    let decodedUrl = '';
    try {
      decodedUrl = decodeURIComponent(rawUrl);
    } catch {
      // If URL can't be decoded, treat as suspicious
      return {
        isValid: false,
        reason: 'URL contains potentially malicious content',
        domain: 'unknown'
      };
    }
    
    // Check both raw and decoded URLs for malicious patterns
    const urlsToCheck = [rawUrl, decodedUrl];
    for (const urlToCheck of urlsToCheck) {
      if (
        urlToCheck.includes('..') || 
        urlToCheck.includes('%2e%2e') || 
        urlToCheck.includes('javascript:') || 
        urlToCheck.includes('data:') ||
        urlToCheck.includes('vbscript:') ||
        urlToCheck.includes('file:') ||
        urlToCheck.includes('about:') ||
        urlToCheck.includes('<script') ||
        urlToCheck.includes('onload=') ||
        urlToCheck.includes('onerror=')
      ) {
        return {
          isValid: false,
          reason: 'URL contains potentially malicious content',
          domain: 'unknown'
        };
      }
    }
    
    // Parse and normalize the URL
    const urlObj = new URL(url);
    const domain = domainToPunycode(urlObj.hostname.toLowerCase());
    const normalizedUrl = urlObj.toString();

    // Must use HTTPS
    if (urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        reason: 'URL must use HTTPS protocol',
        domain
      };
    }

    // Check for suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(domain)) {
        return {
          isValid: false,
          reason: 'URL contains suspicious patterns',
          domain
        };
      }
    }

    // Check for URL shorteners
    if (URL_SHORTENERS.includes(domain)) {
      return {
        isValid: false,
        reason: 'URL shorteners are not allowed',
        domain
      };
    }

    // Check if the domain is allowed
    const allowedDomains = getAllowedDomains();
    if (!allowedDomains.has(domain)) {
      return {
        isValid: false,
        reason: `Domain '${domain}' is not in the allowlist`,
        domain
      };
    }

    // Additional security checks for malicious content
    const fullUrl = urlObj.toString().toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    
    // Check for path traversal
    if (pathname.includes('..') || pathname.includes('%2e%2e')) {
      return {
        isValid: false,
        reason: 'URL contains potentially malicious content',
        domain
      };
    }
    
    // Check for JavaScript injection
    if (fullUrl.includes('javascript:') || search.includes('javascript') || fullUrl.includes('data:')) {
      return {
        isValid: false,
        reason: 'URL contains potentially malicious content', 
        domain
      };
    }

    return {
      isValid: true,
      domain,
      normalizedUrl
    };

  } catch (error) {
    return {
      isValid: false,
      reason: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates all URLs in an email providers array
 * 
 * @param providers - Array of email providers to validate
 * @returns Array of validation results
 */
export function validateAllProviderUrls(providers: ProviderUrlLike[]): Array<{
  provider: string;
  url: string;
  validation: URLValidationResult;
}> {
  const results: Array<{
    provider: string;
    url: string;
    validation: URLValidationResult;
  }> = [];

  for (const provider of providers) {
    if (provider.loginUrl) {
      results.push({
        provider: provider.companyProvider || 'Unknown',
        url: provider.loginUrl,
        validation: validateEmailProviderUrl(provider.loginUrl)
      });
    } else {
      // Providers without URLs are considered invalid
      results.push({
        provider: provider.companyProvider || 'Unknown',
        url: provider.loginUrl || '',
        validation: {
          isValid: false,
          reason: provider.loginUrl === '' ? 'Empty URL provided' : 'No URL provided'
        }
      });
    }
  }

  return results;
}

/**
 * Security audit function to check all provider URLs
 * 
 * @param providers - Array of email providers to audit
 * @returns Security audit report
 */
export function auditProviderSecurity(providers: ProviderUrlLike[]) {
  const validations = validateAllProviderUrls(providers);
  const invalid = validations.filter(v => !v.validation.isValid);
  const valid = validations.filter(v => v.validation.isValid);

  return {
    total: validations.length,
    valid: valid.length,
    invalid: invalid.length,
    invalidProviders: invalid,
    report: invalid.length === 0 
      ? '✅ All provider URLs passed security validation'
      : `⚠️  ${invalid.length} provider(s) failed security validation`
  };
}

