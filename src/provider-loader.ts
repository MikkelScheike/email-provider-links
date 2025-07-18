/**
 * Email Provider Loader
 * 
 * Integrates URL validation and hash verification to load and validate
 * email provider data with security checks.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { validateEmailProviderUrl, auditProviderSecurity } from './url-validator';
import { verifyProvidersIntegrity, generateSecurityHashes } from './hash-verifier';
import { Provider, ProvidersData, decompressTxtPattern } from './schema';
import type { EmailProvider } from './index';

export interface LoadResult {
  success: boolean;
  providers: EmailProvider[];
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

/**
 * Clear the cache (useful for testing or when providers file changes)
 */
export function clearCache(): void {
  cachedLoadResult = null;
}

/**
 * Convert compressed provider to EmailProvider format
 */
function convertProviderToEmailProvider(compressedProvider: Provider): EmailProvider {
  if (!compressedProvider.type) {
    console.warn(`Missing type for provider ${compressedProvider.id}`);
  }
  const provider: EmailProvider = {
    companyProvider: compressedProvider.companyProvider,
    loginUrl: compressedProvider.loginUrl || null,
    domains: compressedProvider.domains || [],
    type: compressedProvider.type,
    alias: compressedProvider.alias
  };

  // Include DNS detection patterns for business email services and proxy services
  const needsCustomDomainDetection = 
    compressedProvider.type === 'custom_provider' || 
    compressedProvider.type === 'proxy_service';

  if (needsCustomDomainDetection && (compressedProvider.mx?.length || compressedProvider.txt?.length)) {
    provider.customDomainDetection = {};
    
    if (compressedProvider.mx?.length) {
      provider.customDomainDetection.mxPatterns = compressedProvider.mx;
    }
    
    if (compressedProvider.txt?.length) {
      // Decompress TXT patterns
      provider.customDomainDetection.txtPatterns = compressedProvider.txt.map(decompressTxtPattern);
    }
  }

  return provider;
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
    const fileContent = readFileSync(filePath, 'utf8');
    const data: ProvidersData = JSON.parse(fileContent);
    
    // Validate format
    if (!data.version || !data.providers || !Array.isArray(data.providers)) {
      throw new Error('Invalid provider data format');
    }
    
    // Convert to EmailProvider format
    providers = data.providers.map(convertProviderToEmailProvider);
  } catch (error) {
    issues.push(`Failed to load providers file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      providers: [],
      securityReport: {
        hashVerification: false,
        urlValidation: false,
        totalProviders: 0,
        validUrls: 0,
        invalidUrls: 0,
        securityLevel: 'CRITICAL',
        issues
      }
    };
  }
  
  // Step 3: URL validation audit
  const urlAudit = auditProviderSecurity(providers);
  if (urlAudit.invalid > 0) {
    issues.push(`${urlAudit.invalid} providers have invalid URLs`);
    // Suppress logging during tests to avoid console noise
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      console.warn('⚠️  URL validation issues found:');
      for (const invalid of urlAudit.invalidProviders) {
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
  let securityLevel: 'SECURE' | 'WARNING' | 'CRITICAL' = 'SECURE';
  
  if (!hashResult.isValid) {
    securityLevel = 'CRITICAL';
  } else if (urlAudit.invalid > 0 || issues.length > 0) {
    securityLevel = 'WARNING';
  }
  
  const loadResult = {
    success: securityLevel !== 'CRITICAL',
    providers: secureProviders,
    securityReport: {
      hashVerification: hashResult.isValid,
      urlValidation: urlAudit.invalid === 0,
      totalProviders: providers.length,
      validUrls: urlAudit.valid,
      invalidUrls: urlAudit.invalid,
      securityLevel,
      issues
    }
  };

  // Cache the result for future calls
  cachedLoadResult = loadResult;

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
  return (req: any, res: any, next: any) => {
    // If a custom providers getter is provided, use that instead of loading from file
    const result = options.getProviders ? options.getProviders() : loadProviders(undefined, options.expectedHash);
    
    // Handle security level
    if (result.securityReport.securityLevel === 'CRITICAL' && !options.allowInvalidUrls) {
      if (options.onSecurityIssue) {
        options.onSecurityIssue(result.securityReport);
      }
      return res.status(500).json({
        error: 'Security validation failed',
        details: result.securityReport
      });
    }
    
    // Attach secure providers to request
    (req as any).secureProviders = result.providers;
    (req as any).securityReport = result.securityReport;
    
    next();
  };
}

export default {
  loadProviders,
  initializeSecurity,
  createSecurityMiddleware,
  clearCache
};

