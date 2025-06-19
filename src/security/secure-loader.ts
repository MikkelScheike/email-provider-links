/**
 * Secure Loader for Email Providers
 * 
 * Integrates URL validation and hash verification to create a secure
 * loading system for email provider data.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { validateEmailProviderUrl, auditProviderSecurity } from './url-validator';
import { verifyProvidersIntegrity, generateSecurityHashes, handleHashMismatch } from './hash-verifier';
import type { EmailProvider } from '../index';

export interface SecureLoadResult {
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

/**
 * Securely loads and validates email provider data
 * 
 * @param providersPath - Path to the providers JSON file
 * @param expectedHash - Optional expected hash for verification
 * @returns Secure load result with validation details
 */
export function secureLoadProviders(
  providersPath?: string,
  expectedHash?: string
): SecureLoadResult {
  const filePath = providersPath || join(__dirname, '..', '..', 'providers', 'emailproviders.json');
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
    const data = JSON.parse(fileContent);
    providers = data.providers || [];
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
  
  return {
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
 * Express middleware for secure provider loading (if using in web apps)
 */
export function createSecurityMiddleware(options: {
  expectedHash?: string;
  allowInvalidUrls?: boolean;
  onSecurityIssue?: (report: SecureLoadResult['securityReport']) => void;
} = {}) {
  return (req: any, res: any, next: any) => {
    const result = secureLoadProviders(undefined, options.expectedHash);
    
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
  secureLoadProviders,
  initializeSecurity,
  createSecurityMiddleware
};

