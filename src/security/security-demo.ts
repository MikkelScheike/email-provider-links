#!/usr/bin/env tsx

/**
 * Security Demonstration Script
 * 
 * This script demonstrates how the URL validation and hash verification
 * systems work to protect against supply chain attacks.
 */

import { validateEmailProviderUrl, auditProviderSecurity } from './url-validator';
import { calculateFileHash, generateSecurityHashes, verifyProvidersIntegrity } from './hash-verifier';
import { secureLoadProviders, initializeSecurity } from './secure-loader';
import { readFileSync } from 'fs';
import { join } from 'path';

function demo() {
  console.log('🔐 EMAIL PROVIDER LINKS - SECURITY DEMONSTRATION\n');
  
  // 1. URL Validation Demo
  console.log('📋 1. URL VALIDATION DEMO');
  console.log('=' .repeat(50));
  
  const testUrls = [
    'https://mail.google.com/mail/',           // ✅ Valid
    'https://outlook.office365.com',           // ✅ Valid  
    'https://evil-phishing-site.com/gmail',    // ❌ Invalid (not allowlisted)
    'http://gmail.com',                        // ❌ Invalid (not HTTPS)
    'https://192.168.1.1/webmail',            // ❌ Invalid (IP address)
    'https://bit.ly/fake-gmail',               // ❌ Invalid (URL shortener)
    'https://gmail.tk'                         // ❌ Invalid (suspicious TLD)
  ];
  
  testUrls.forEach(url => {
    const result = validateEmailProviderUrl(url);
    const status = result.isValid ? '✅' : '❌';
    console.log(`${status} ${url}`);
    if (!result.isValid) {
      console.log(`   Reason: ${result.reason}`);
    }
  });
  
  // 2. Hash Verification Demo
  console.log('\n📋 2. HASH VERIFICATION DEMO');
  console.log('=' .repeat(50));
  
  try {
    const providersPath = join(__dirname, '..', '..', 'providers', 'emailproviders.json');
    const currentHash = calculateFileHash(providersPath);
    console.log(`Current providers file hash: ${currentHash}`);
    
    // Simulate tampering detection
    const fakeHash = 'fake_hash_indicating_tampering';
    const verificationResult = verifyProvidersIntegrity(providersPath, fakeHash);
    
    console.log(`\\nTampering simulation:`);
    console.log(`Expected: ${fakeHash}`);
    console.log(`Actual: ${verificationResult.actualHash}`);
    console.log(`Valid: ${verificationResult.isValid ? '✅' : '❌'}`);
    if (!verificationResult.isValid) {
      console.log(`Reason: ${verificationResult.reason}`);
    }
  } catch (error) {
    console.error('Failed to demonstrate hash verification:', error);
  }
  
  // 3. Provider Security Audit
  console.log('\\n📋 3. PROVIDER SECURITY AUDIT');
  console.log('=' .repeat(50));
  
  try {
    const providersPath = join(__dirname, '..', '..', 'providers', 'emailproviders.json');
    const providersData = JSON.parse(readFileSync(providersPath, 'utf8'));
    const audit = auditProviderSecurity(providersData.providers);
    
    console.log(`Total providers: ${audit.total}`);
    console.log(`Valid URLs: ${audit.valid}`);
    console.log(`Invalid URLs: ${audit.invalid}`);
    console.log(`Status: ${audit.report}`);
    
    if (audit.invalid > 0) {
      console.log('\\nInvalid providers:');
      audit.invalidProviders.forEach(invalid => {
        console.log(`- ${invalid.provider}: ${invalid.validation.reason}`);
      });
    }
  } catch (error) {
    console.error('Failed to audit providers:', error);
  }
  
  // 4. Secure Loading Demo
  console.log('\\n📋 4. SECURE LOADING DEMO');
  console.log('=' .repeat(50));
  
  const secureResult = secureLoadProviders();
  console.log(`Load success: ${secureResult.success ? '✅' : '❌'}`);
  console.log(`Security level: ${secureResult.securityReport.securityLevel}`);
  console.log(`Hash verification: ${secureResult.securityReport.hashVerification ? '✅' : '❌'}`);
  console.log(`URL validation: ${secureResult.securityReport.urlValidation ? '✅' : '❌'}`);
  console.log(`Total providers loaded: ${secureResult.providers.length}`);
  
  if (secureResult.securityReport.issues.length > 0) {
    console.log('\\nSecurity issues:');
    secureResult.securityReport.issues.forEach(issue => {
      console.log(`- ${issue}`);
    });
  }
  
  // 5. Attack Simulation
  console.log('\\n📋 5. ATTACK SIMULATION');
  console.log('=' .repeat(50));
  
  console.log('Simulating common attack scenarios:\\n');
  
  // Simulate malicious URL injection
  const maliciousProvider = {
    companyProvider: 'Fake Gmail',
    loginUrl: 'https://gmaiI.com/login',  // Note the capital i instead of l
    domains: ['gmail.com']
  };
  
  const maliciousValidation = validateEmailProviderUrl(maliciousProvider.loginUrl);
  console.log(`🎭 Typosquatting attack: ${maliciousProvider.loginUrl}`);
  console.log(`   Blocked: ${!maliciousValidation.isValid ? '✅' : '❌'}`);
  if (!maliciousValidation.isValid) {
    console.log(`   Reason: ${maliciousValidation.reason}`);
  }
  
  // Simulate URL shortener attack
  const shortenerAttack = {
    companyProvider: 'Shortened Gmail',
    loginUrl: 'https://bit.ly/definitely-not-gmail',
    domains: ['gmail.com']
  };
  
  const shortenerValidation = validateEmailProviderUrl(shortenerAttack.loginUrl);
  console.log(`\\n🔗 URL shortener attack: ${shortenerAttack.loginUrl}`);
  console.log(`   Blocked: ${!shortenerValidation.isValid ? '✅' : '❌'}`);
  if (!shortenerValidation.isValid) {
    console.log(`   Reason: ${shortenerValidation.reason}`);
  }
  
  // Simulate non-HTTPS attack
  const httpAttack = {
    companyProvider: 'Insecure Gmail',
    loginUrl: 'http://gmail.com',
    domains: ['gmail.com']
  };
  
  const httpValidation = validateEmailProviderUrl(httpAttack.loginUrl);
  console.log(`\\n🔓 Non-HTTPS attack: ${httpAttack.loginUrl}`);
  console.log(`   Blocked: ${!httpValidation.isValid ? '✅' : '❌'}`);
  if (!httpValidation.isValid) {
    console.log(`   Reason: ${httpValidation.reason}`);
  }
  
  console.log('\\n🎯 SECURITY SUMMARY');
  console.log('=' .repeat(50));
  console.log('✅ URL allowlisting prevents malicious redirects');
  console.log('✅ Hash verification detects file tampering');  
  console.log('✅ HTTPS enforcement prevents downgrade attacks');
  console.log('✅ Suspicious pattern detection blocks common attacks');
  console.log('✅ Comprehensive logging for security monitoring');
  
  console.log('\\n🔧 NEXT STEPS FOR PRODUCTION');
  console.log('=' .repeat(50));
  console.log('1. Store expected hashes in environment variables');
  console.log('2. Enable strict security mode in CI/CD pipeline');
  console.log('3. Set up monitoring alerts for security failures');
  console.log('4. Regular security audits of provider data');
  console.log('5. Consider adding digital signatures for extra security');
}

// Run the demo
if (require.main === module) {
  demo();
}

export { demo };

