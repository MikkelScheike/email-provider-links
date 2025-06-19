/**
 * Hash Verification System
 * 
 * Provides cryptographic integrity verification for the email providers database
 * to detect tampering or unauthorized modifications.
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Known good hashes for the providers database.
 * These should be updated whenever the legitimate data changes.
 * 
 * IMPORTANT: These hashes should be stored in a separate, more secure location
 * in production (e.g., environment variables, secure CI/CD secrets)
 */
const KNOWN_GOOD_HASHES = {
  // SHA-256 hash of the legitimate emailproviders.json
  'emailproviders.json': 'da7a856fe04b11e326230d195fcc3d44f078e481b8929cf4fb5040276e05ffd0',
  
  // You can add hashes for other critical files
  'package.json': '4fec42bf25d33615a2b19bfe573b6d706404d39bfcdd6464a6958e70fca2a579'
};

export interface HashVerificationResult {
  isValid: boolean;
  expectedHash?: string;
  actualHash: string;
  reason?: string;
  file: string;
}

/**
 * Calculates SHA-256 hash of a file or string content
 * 
 * @param content - File content as string or Buffer
 * @returns SHA-256 hash as hex string
 */
export function calculateHash(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Calculates SHA-256 hash of a file
 * 
 * @param filePath - Path to the file
 * @returns SHA-256 hash as hex string
 */
export function calculateFileHash(filePath: string): string {
  const content = readFileSync(filePath);
  return calculateHash(content);
}

/**
 * Verifies the integrity of the email providers JSON file
 * 
 * @param filePath - Path to the providers JSON file
 * @param expectedHash - Optional expected hash (if not provided, uses KNOWN_GOOD_HASHES)
 * @returns Verification result
 */
export function verifyProvidersIntegrity(
  filePath: string, 
  expectedHash?: string
): HashVerificationResult {
  try {
    const actualHash = calculateFileHash(filePath);
    const expectedHashToUse = expectedHash || KNOWN_GOOD_HASHES['emailproviders.json'];
    
    if (expectedHashToUse === 'TO_BE_CALCULATED') {
      return {
        isValid: false,
        actualHash,
        reason: 'Expected hash not configured. Run generateSecurityHashes() first.',
        file: filePath
      };
    }
    
    const isValid = actualHash === expectedHashToUse;
    
    return {
      isValid,
      expectedHash: expectedHashToUse,
      actualHash,
      reason: isValid ? undefined : 'File hash does not match expected value - potential tampering detected',
      file: filePath
    };
    
  } catch (error) {
    return {
      isValid: false,
      actualHash: '',
      reason: `Failed to verify file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      file: filePath
    };
  }
}

/**
 * Verifies the integrity of providers data from JSON object
 * 
 * @param providersData - The providers data object
 * @param expectedHash - Expected hash of the JSON string
 * @returns Verification result
 */
export function verifyProvidersDataIntegrity(
  providersData: any,
  expectedHash?: string
): HashVerificationResult {
  try {
    // Create deterministic JSON string (sorted keys)
    const jsonString = JSON.stringify(providersData, Object.keys(providersData).sort(), 2);
    const actualHash = calculateHash(jsonString);
    
    const expectedHashToUse = expectedHash || KNOWN_GOOD_HASHES['emailproviders.json'];
    
    if (expectedHashToUse === 'TO_BE_CALCULATED') {
      return {
        isValid: false,
        actualHash,
        reason: 'Expected hash not configured',
        file: 'providersData'
      };
    }
    
    const isValid = actualHash === expectedHashToUse;
    
    return {
      isValid,
      expectedHash: expectedHashToUse,
      actualHash,
      reason: isValid ? undefined : 'Data hash does not match expected value',
      file: 'providersData'
    };
    
  } catch (error) {
    return {
      isValid: false,
      actualHash: '',
      reason: `Failed to verify data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      file: 'providersData'
    };
  }
}

/**
 * Generates security hashes for critical files - use this during development
 * 
 * @param basePath - Base path of the project
 * @returns Object with calculated hashes
 */
export function generateSecurityHashes(basePath: string = __dirname) {
  const files = [
    'providers/emailproviders.json',
    'package.json'
  ];
  
  const hashes: Record<string, string> = {};
  
  for (const file of files) {
    try {
      const fullPath = join(basePath, '..', '..', file);
      const hash = calculateFileHash(fullPath);
      hashes[file.split('/').pop() || file] = hash;
      console.log(`✅ ${file}: ${hash}`);
    } catch (error) {
      console.error(`❌ Failed to hash ${file}:`, error);
    }
  }
  
  return hashes;
}

/**
 * Easy-to-use function to recalculate and display current hashes
 * for updating KNOWN_GOOD_HASHES when making legitimate changes
 * 
 * @param basePath - Base path of the project
 * @returns Formatted hash configuration for copy-paste
 */
export function recalculateHashes(basePath?: string): string {
  console.log('🔄 RECALCULATING SECURITY HASHES');
  console.log('=' .repeat(50));
  
  const hashes = generateSecurityHashes(basePath);
  
  const configCode = `
// Updated KNOWN_GOOD_HASHES configuration:
const KNOWN_GOOD_HASHES = {
  'emailproviders.json': '${hashes['emailproviders.json']}',
  'package.json': '${hashes['package.json']}'
};
`;
  
  console.log('\n📋 Copy this configuration to hash-verifier.ts:');
  console.log(configCode);
  
  console.log('\n⚠️  SECURITY REMINDER:');
  console.log('- Only update hashes after verifying changes are legitimate');
  console.log('- Review git diff before updating hash values');
  console.log('- Consider requiring code review for hash updates');
  
  return configCode;
}

/**
 * Enhanced security warning system for hash mismatches
 * 
 * @param result - Hash verification result
 * @param options - Warning options
 */
export function handleHashMismatch(
  result: HashVerificationResult,
  options: {
    throwOnMismatch?: boolean;
    logLevel?: 'error' | 'warn' | 'silent';
    onMismatch?: (result: HashVerificationResult) => void;
  } = {}
): void {
  if (result.isValid) return;
  
  const { throwOnMismatch = false, logLevel = 'error', onMismatch } = options;
  
  const securityAlert = [
    '🚨🚨🚨 CRITICAL SECURITY ALERT 🚨🚨🚨',
    `File: ${result.file}`,
    `Reason: ${result.reason}`,
    `Expected Hash: ${result.expectedHash}`,
    `Actual Hash: ${result.actualHash}`,
    '',
    '⚠️  POTENTIAL SECURITY BREACH DETECTED:',
    '- File may have been tampered with',
    '- Unauthorized modifications detected',
    '- Supply chain attack possible',
    '',
    '🔍 IMMEDIATE ACTIONS REQUIRED:',
    '1. Stop using this package immediately',
    '2. Investigate the source of file changes',
    '3. Check git history for unauthorized commits',
    '4. Verify file integrity from trusted source',
    '5. Report security incident if confirmed',
    '',
    '📧 Consider reporting to: security@[your-domain].com'
  ].join('\n');
  
  if (logLevel === 'error') {
    console.error(securityAlert);
  } else if (logLevel === 'warn') {
    console.warn(securityAlert);
  }
  
  // Call custom handler if provided
  if (onMismatch) {
    onMismatch(result);
  }
  
  // Throw error if requested (for production environments)
  if (throwOnMismatch) {
    throw new Error(
      `SECURITY BREACH: Hash verification failed for ${result.file}. ` +
      `Expected: ${result.expectedHash}, Got: ${result.actualHash}`
    );
  }
}

/**
 * Comprehensive security audit including hash verification
 * 
 * @param providersFilePath - Path to providers JSON file
 * @returns Complete security audit result
 */
export function performSecurityAudit(providersFilePath?: string): {
  hashVerification: HashVerificationResult;
  recommendations: string[];
  securityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
} {
  const filePath = providersFilePath || join(__dirname, '..', '..', 'providers', 'emailproviders.json');
  const hashResult = verifyProvidersIntegrity(filePath);
  
  const recommendations: string[] = [];
  let securityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL' = 'HIGH';
  
  if (!hashResult.isValid) {
    securityLevel = 'CRITICAL';
    recommendations.push('🚨 CRITICAL: File integrity check failed - investigate immediately');
    recommendations.push('🔒 Verify the source of the providers file');
    recommendations.push('📋 Check git history for unauthorized changes');
  }
  
  if (KNOWN_GOOD_HASHES['emailproviders.json'] === 'TO_BE_CALCULATED') {
    securityLevel = securityLevel === 'HIGH' ? 'MEDIUM' : securityLevel;
    recommendations.push('⚙️  Configure expected hash values in production');
    recommendations.push('🔐 Store hashes in secure environment variables');
  }
  
  recommendations.push('🔄 Regularly update hash values when making legitimate changes');
  recommendations.push('📊 Monitor for unexpected hash changes in CI/CD');
  recommendations.push('🛡️  Consider implementing digital signatures for additional security');
  
  return {
    hashVerification: hashResult,
    recommendations,
    securityLevel
  };
}

/**
 * Creates a signed manifest of all provider URLs with their hashes
 * This can be used to detect any URL modifications
 * 
 * @param providers - Array of email providers
 * @returns Signed manifest with URL hashes
 */
export function createProviderManifest(providers: any[]): {
  timestamp: string;
  providerCount: number;
  urlHashes: Record<string, string>;
  manifestHash: string;
} {
  const urlHashes: Record<string, string> = {};
  
  for (const provider of providers) {
    if (provider.loginUrl) {
      const key = `${provider.companyProvider}::${provider.loginUrl}`;
      urlHashes[key] = calculateHash(provider.loginUrl);
    }
  }
  
  const manifestData = {
    timestamp: new Date().toISOString(),
    providerCount: providers.length,
    urlHashes
  };
  
  const manifestHash = calculateHash(JSON.stringify(manifestData, null, 2));
  
  return {
    ...manifestData,
    manifestHash
  };
}

