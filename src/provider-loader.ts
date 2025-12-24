/**
 * Email Provider Loader
 * 
 * Integrates URL validation and hash verification to load and validate
 * email provider data with security checks.
 */

import { join } from 'path';
import { readFileSync } from 'fs';
import { validateEmailProviderUrl, auditProviderSecurity } from './url-validator';
import { verifyProvidersIntegrity, generateSecurityHashes } from './hash-verifier';
import { convertProviderToEmailProviderShared, readProvidersDataFile, buildDomainMapShared } from './provider-store';
import type { EmailProvider } from './api';

type MiddlewareRequestLike = Record<string, unknown> & {
  secureProviders?: EmailProvider[];
  securityReport?: LoadResult['securityReport'];
};

type MiddlewareResponseLike = {
  status: (code: number) => { json: (body: unknown) => unknown };
};

type MiddlewareNextLike = () => void;

export interface LoadResult {
  success: boolean;
  providers: EmailProvider[];
  domainMap?: Map<string, EmailProvider>;
  stats?: {
    loadTime: number;
    domainMapTime: number;
    providerCount: number;
    domainCount: number;
    fileSize: number;
  };
  securityReport: {
    hashVerification: boolean;
    urlValidation: boolean;
    totalProviders: number;
    validUrls: number;
    invalidUrls: number;
    securityLevel: 'SECURE' | 'WARNING' | 'CRITICAL';
    issues: string[];
  };
}

// Cache for load results
let cachedLoadResult: LoadResult | null = null;

// Cache for loading statistics
let loadingStats: LoadResult['stats'] | null = null;

// Cache for domain maps
let cachedDomainMap: Map<string, EmailProvider> | null = null;

/**
 * Clear the cache (useful for testing or when providers file changes)
 */
export function clearCache(): void {
  cachedLoadResult = null;
  loadingStats = null;
  cachedDomainMap = null;
}

/**
 * Loads and validates email provider data with security checks
 * 
 * @param providersPath - Path to the providers JSON file
 * @param expectedHash - Optional expected hash for verification
 * @returns Load result with validation details
 */
export function loadProviders(
  providersPath?: string,
  expectedHash?: string
): LoadResult {
  // Return cached result if available (both success and failure)
  if (cachedLoadResult) {
    return cachedLoadResult;
  }
  
  const filePath = providersPath || join(__dirname, '..', 'providers', 'emailproviders.json');
  const issues: string[] = [];
  let providers: EmailProvider[] = [];
  
  // Step 1: Hash verification
  const hashResult = verifyProvidersIntegrity(filePath, expectedHash);
  if (!hashResult.isValid) {
    issues.push(`Hash verification failed: ${hashResult.reason}`);
    
    // In production, you might want to abort here
    // Suppress logging during tests to avoid console noise
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      console.error('🚨 SECURITY WARNING: Hash verification failed!');
      console.error('File:', hashResult.file);
      console.error('Reason:', hashResult.reason);
      console.error('Expected:', hashResult.expectedHash);
      console.error('Actual:', hashResult.actualHash);
    }
  }
  
  // Step 2: Load and parse JSON
  try {
    const { data } = readProvidersDataFile(filePath);
    providers = data.providers.map(convertProviderToEmailProviderShared);
    
    // Log memory usage in development mode
    if (process.env.NODE_ENV === 'development' && !process.env.JEST_WORKER_ID) {
      const memUsage = process.memoryUsage();
      const memUsageMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
      console.log(`🚀 Current memory usage: ${memUsageMB} MB`);
    }
  } catch (error: any) {
    // For non-Error objects (like strings), treat as "Unknown error" to match test expectations
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error?.code;
    const isFileNotFound = errorCode === 'ENOENT' || errorMessage.includes('ENOENT') || errorMessage.includes('no such file');
    const isJsonError = errorMessage.includes('JSON') || errorMessage.includes('Unexpected token') || error instanceof SyntaxError;
    
    // Return error result for JSON parse errors and file not found (ENOENT)
    // This allows security tests to check error handling
    // Note: ENOENT errors are already handled by hash verification, but we still need to handle
    // them here in case hash verification passed but file was deleted between verification and read
    if (isJsonError || isFileNotFound) {
      if (!isJsonError) {
        // For file not found, don't add duplicate issue if hash verification already failed
        if (hashResult.isValid) {
          issues.push(`Failed to load providers file: ${errorMessage}`);
        }
      } else {
        issues.push(`Failed to load providers file: ${errorMessage}`);
      }
      return {
        success: false,
        providers: [],
        securityReport: {
          hashVerification: hashResult.isValid,
          urlValidation: false,
          totalProviders: 0,
          validUrls: 0,
          invalidUrls: 0,
          securityLevel: 'CRITICAL',
          issues
        }
      };
    }
    
    // For other errors, add to issues and throw (to match loader.test.ts expectations)
    issues.push(`Failed to load providers file: ${errorMessage}`);
    throw new Error(`Failed to load provider data: ${errorMessage}`);
  }
  
  // Step 3: URL validation audit
  const urlAudit = auditProviderSecurity(providers);
  
  // Count only providers with invalid URLs (not providers without URLs)
  const providersWithInvalidUrls = urlAudit.invalidProviders.filter(invalid => 
    invalid.url !== '' && invalid.url !== undefined && invalid.url !== null
  );
  
  if (providersWithInvalidUrls.length > 0) {
    issues.push(`${providersWithInvalidUrls.length} providers have invalid URLs`);
    // Suppress logging during tests to avoid console noise
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      console.warn('⚠️  URL validation issues found:');
      for (const invalid of providersWithInvalidUrls) {
        console.warn(`- ${invalid.provider}: ${invalid.validation.reason}`);
      }
    }
  }
  
  // Step 4: Filter out invalid providers in production
  const secureProviders = providers.filter(provider => {
    if (!provider.loginUrl) return true; // Allow providers without login URLs
    const validation = validateEmailProviderUrl(provider.loginUrl);
    return validation.isValid;
  });
  
  if (secureProviders.length < providers.length) {
    const filtered = providers.length - secureProviders.length;
    issues.push(`Filtered out ${filtered} providers with invalid URLs`);
  }
  
  // Step 5: Determine security level
  // Only providers with invalid URLs affect security level, not providers without URLs
  let securityLevel: 'SECURE' | 'WARNING' | 'CRITICAL' = 'SECURE';
  
  if (!hashResult.isValid) {
    securityLevel = 'CRITICAL';
  } else if (providersWithInvalidUrls.length > 0 || issues.length > 0) {
    securityLevel = 'WARNING';
  }
  
  const loadResult = {
    success: securityLevel !== 'CRITICAL',
    providers: secureProviders,
    domainMap: buildDomainMap(secureProviders),
    stats: {
      loadTime: 0, // Would need to track this during load
      domainMapTime: 0,
      providerCount: secureProviders.length,
      domainCount: secureProviders.reduce((count, p) => count + (p.domains?.length || 0), 0),
      fileSize: readFileSync(filePath, 'utf8').length // Calculate actual file size in bytes
    },
    securityReport: {
      hashVerification: hashResult.isValid,
      urlValidation: providersWithInvalidUrls.length === 0, // Only count providers with invalid URLs, not providers without URLs
      totalProviders: providers.length,
      validUrls: urlAudit.valid,
      invalidUrls: providersWithInvalidUrls.length, // Only count actual invalid URLs
      securityLevel,
      issues
    }
  };

  // Cache the result for future calls
  cachedLoadResult = loadResult;
  
  // Update loading stats for getLoadingStats()
  loadingStats = loadResult.stats;

  return loadResult;
}

/**
 * Development utility to generate and display current hashes
 */
export function initializeSecurity() {
  console.log('🔐 Generating security hashes for email providers...');
  const hashes = generateSecurityHashes();
  
  console.log('\n📋 Security Setup Instructions:');
  console.log('1. Store these hashes securely (environment variables, CI/CD secrets)');
  console.log('2. Update KNOWN_GOOD_HASHES in hash-verifier.ts');
  console.log('3. Enable hash verification in production');
  console.log('\n⚠️  Remember to update hashes when making legitimate changes to provider data!');
  
  return hashes;
}

/**
 * Express middleware for provider loading with security checks (if using in web apps)
 */
interface SecurityMiddlewareOptions {
  expectedHash?: string;
  allowInvalidUrls?: boolean;
  onSecurityIssue?: (report: LoadResult['securityReport']) => void;
  getProviders?: () => LoadResult;
}

export function createSecurityMiddleware(options: SecurityMiddlewareOptions = {}) {
  return (req: MiddlewareRequestLike, res: MiddlewareResponseLike, next: MiddlewareNextLike) => {
    // If a custom providers getter is provided, use that instead of loading from file
    const result = options.getProviders ? options.getProviders() : loadProviders(undefined, options.expectedHash);
    
    // Handle security level
    if (result.securityReport.securityLevel === 'CRITICAL' && !options.allowInvalidUrls) {
      if (options.onSecurityIssue) {
        options.onSecurityIssue(result.securityReport);
      }
      res.status(500).json({
        error: 'Security validation failed',
        details: result.securityReport
      });
      return;
    }
    
    // Attach secure providers to request
    req.secureProviders = result.providers;
    req.securityReport = result.securityReport;
    
    next();
    return;
  };
}

/**
 * Build domain map from providers
 */
export function buildDomainMap(providers: EmailProvider[]): Map<string, EmailProvider> {
  // Return cached domain map if available
  if (cachedDomainMap) {
    return cachedDomainMap;
  }
  
  // Build and cache the domain map
  cachedDomainMap = buildDomainMapShared(providers);
  return cachedDomainMap;
}

/**
 * Get loading statistics from the last load operation
 */
export function getLoadingStats() {
  return loadingStats;
}

/**
 * Load providers with debug information (always reloads cache)
 */
export function loadProvidersDebug() {
  const startTime = process.hrtime.bigint();
  
  // Clear cache for debug mode - ensure we always reload
  cachedLoadResult = null;
  loadingStats = null;
  
  const result = loadProviders();
  const endTime = process.hrtime.bigint();
  
  // Build domain map and calculate stats
  const domainMapStart = process.hrtime.bigint();
  const domainMap = buildDomainMap(result.providers);
  const domainMapEnd = process.hrtime.bigint();
  
  // Store loading stats
  loadingStats = {
    loadTime: Number(endTime - startTime) / 1000000, // Convert to milliseconds
    domainMapTime: Number(domainMapEnd - domainMapStart) / 1000000,
    providerCount: result.providers.length,
    domainCount: domainMap.size,
    fileSize: 0 // Would need to track this during load
  };
  
  // Debug output
  console.log('=== Provider Loading Debug ===');
  console.log(`Providers loaded: ${result.providers.length}`);
  console.log(`Security level: ${result.securityReport.securityLevel}`);
  console.log(`Load time: ${loadingStats.loadTime.toFixed(2)}ms`);
  console.log(`Domain map time: ${loadingStats.domainMapTime.toFixed(2)}ms`);
  console.log(`Total domains: ${loadingStats.domainCount}`);
  console.log('=============================');
  
  // Return enhanced result with debug info - ensure new objects each time
  return {
    ...result,
    domainMap: new Map(domainMap), // Create new Map instance
    stats: { ...loadingStats } // Create new stats object
  };
}

export default {
  loadProviders,
  loadProvidersDebug,
  buildDomainMap,
  getLoadingStats,
  initializeSecurity,
  createSecurityMiddleware,
  clearCache
};

