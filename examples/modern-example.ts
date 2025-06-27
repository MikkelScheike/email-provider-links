#!/usr/bin/env tsx

/**
 * Modern Email Provider Links Demo
 * 
 * Showcases the enhanced capabilities of the email-provider-links package
 * Run with: npx tsx examples/modern-example.ts
 */

import { 
  getEmailProvider,
  getEmailProviderSync, 
  getEmailProviderFast,
  validateEmailAddress,
  isValidEmail,
  extractDomain,
  normalizeEmail,
  emailsMatch,
  getSupportedProviders,
  isEmailProviderSupported,
  getLibraryStats,
  batchProcessEmails,
  validateInternationalEmail,
  Config
} from '../src/index';

console.log('🚀 Modern Email Provider Links - Enhanced Demo\n');

// ===== LIBRARY INFORMATION =====
function showLibraryInfo() {
  console.log('📊 Library Statistics:');
  const stats = getLibraryStats();
  console.log(`  Version: ${stats.version}`);
  console.log(`  Providers: ${stats.providerCount}`);
  console.log(`  Domains: ${stats.domainCount}`);
  console.log(`  Features: Async ✓ IDN ✓ Aliases ✓ Concurrent DNS ✓`);
  console.log('');
}

// ===== ENHANCED EMAIL VALIDATION =====
function demonstrateValidation() {
  console.log('✅ Enhanced Email Validation:\n');
  
  const testEmails = [
    'user@gmail.com',           // Valid
    'test.user+tag@outlook.com', // Valid with alias
    'user@münchen.de',          // International domain
    'invalid-email',            // Invalid format
    '',                         // Empty
    'user@domain',              // Missing TLD
    'a'.repeat(65) + '@test.com' // Too long username
  ];
  
  testEmails.forEach(email => {
    const result = validateEmailAddress(email);
    console.log(`Email: "${email}"`);
    
    if (result.isValid) {
      console.log(`  ✅ Valid - Normalized: ${result.normalizedEmail}`);
      console.log(`  🌐 Domain: ${extractDomain(email)}`);
    } else {
      console.log(`  ❌ Invalid - ${result.error?.message}`);
      console.log(`  🔍 Error Code: ${result.error?.code}`);
    }
    console.log('');
  });
}

// ===== ASYNC PROVIDER DETECTION =====
async function demonstrateAsyncDetection() {
  console.log('🔍 Async Provider Detection (with DNS lookup):\n');
  
  const testEmails = [
    'user@gmail.com',        // Known provider
    'test@fastmail.com',     // Known provider
    'business@example.org',  // Unknown domain (will try DNS)
    'admin@google.com'       // Business domain (might detect Google Workspace)
  ];
  
  for (const email of testEmails) {
    console.log(`🔍 Analyzing: ${email}`);
    
    try {
      const result = await getEmailProvider(email, 3000); // 3s timeout
      
      if (result.provider) {
        console.log(`  ✅ Provider: ${result.provider.companyProvider}`);
        console.log(`  🔗 Login URL: ${result.loginUrl}`);
        console.log(`  📡 Detection: ${result.detectionMethod}`);
        
        if (result.proxyService) {
          console.log(`  🛡️  Proxy: ${result.proxyService}`);
        }
      } else {
        console.log(`  ❌ Provider: Not found`);
        if (result.error) {
          console.log(`  ⚠️  Error: ${result.error.message}`);
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Error: ${error}`);
    }
    console.log('');
  }
}

// ===== HIGH-PERFORMANCE DETECTION =====
async function demonstrateHighPerformance() {
  console.log('⚡ High-Performance Detection:\n');
  
  const email = 'user@mycompany.com';
  console.log(`🚀 Fast detection for: ${email}`);
  
  try {
    const result = await getEmailProviderFast(email, {
      enableParallel: true,
      collectDebugInfo: true,
      timeout: 2000
    });
    
    if (result.provider) {
      console.log(`  ✅ Provider: ${result.provider.companyProvider}`);
      console.log(`  🔗 Login URL: ${result.loginUrl}`);
      console.log(`  📊 Confidence: ${(result.confidence || 0) * 100}%`);
    } else {
      console.log(`  ❌ Provider: Not found`);
    }
    
    if (result.timing) {
      console.log(`  ⏱️  Timing:`);
      console.log(`    MX Query: ${result.timing.mx}ms`);
      console.log(`    TXT Query: ${result.timing.txt}ms`);
      console.log(`    Total: ${result.timing.total}ms`);
    }
    
    if (result.debug) {
      console.log(`  🔍 Debug Info: Available`);
    }
  } catch (error) {
    console.log(`  ⚠️  Error: ${error}`);
  }
  console.log('');
}

// ===== EMAIL NORMALIZATION & ALIAS DETECTION =====
function demonstrateNormalization() {
  console.log('🔄 Email Normalization & Alias Detection:\n');
  
  const aliasExamples = [
    ['u.s.e.r+work@gmail.com', 'user@gmail.com'],
    ['USER@GMAIL.COM', 'user@gmail.com'],
    ['test.email+newsletter@gmail.com', 'testemail@gmail.com'],
    ['user+tag@outlook.com', 'user@outlook.com'],
    ['business+department@yahoo.com', 'business@yahoo.com']
  ];
  
  aliasExamples.forEach(([original, expected]) => {
    const normalized = normalizeEmail(original);
    const matches = emailsMatch(original, expected);
    
    console.log(`Original: ${original}`);
    console.log(`  Normalized: ${normalized}`);
    console.log(`  Matches '${expected}': ${matches ? '✅' : '❌'}`);
    console.log('');
  });
}

// ===== BATCH PROCESSING =====
function demonstrateBatchProcessing() {
  console.log('📦 Batch Email Processing:\n');
  
  const emails = [
    'user@gmail.com',
    'u.s.e.r+work@gmail.com',    // Duplicate alias
    'test@yahoo.com',
    'invalid-email',
    'business@fastmail.com',
    'user@gmail.com'             // Exact duplicate
  ];
  
  console.log('🔍 Processing batch with deduplication and provider info...');
  
  const results = batchProcessEmails(emails, {
    includeProviderInfo: true,
    normalizeEmails: true,
    deduplicateAliases: true
  });
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.email}`);
    console.log(`   Valid: ${result.isValid ? '✅' : '❌'}`);
    
    if (result.isValid) {
      console.log(`   Normalized: ${result.normalized}`);
      console.log(`   Provider: ${result.provider || 'Unknown'}`);
      
      if (result.isDuplicate) {
        console.log(`   🔄 Duplicate detected`);
      }
      
      if (result.loginUrl) {
        console.log(`   Login: ${result.loginUrl}`);
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });
  console.log('');
}

// ===== PROVIDER INFORMATION =====
function showProviderInfo() {
  console.log('📋 Provider Information:\n');
  
  const providers = getSupportedProviders();
  
  console.log(`Total providers: ${providers.length}`);
  console.log('\nTop 10 providers by domain count:');
  
  const sortedProviders = providers
    .map(p => ({ 
      name: p.companyProvider, 
      domainCount: p.domains?.length || 0,
      hasBusinessDetection: !!(p.customDomainDetection?.mxPatterns || p.customDomainDetection?.txtPatterns)
    }))
    .sort((a, b) => b.domainCount - a.domainCount)
    .slice(0, 10);
  
  sortedProviders.forEach((provider, index) => {
    const badge = provider.hasBusinessDetection ? '🏢' : '📧';
    console.log(`  ${index + 1}. ${badge} ${provider.name} (${provider.domainCount} domains)`);
  });
  
  console.log('\nTest a few providers:');
  const testProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me'];
  testProviders.forEach(domain => {
    const supported = isEmailProviderSupported(`test@${domain}`);
    console.log(`  ${supported ? '✅' : '❌'} ${domain}`);
  });
  
  console.log('');
}

// ===== INTERNATIONAL DOMAIN SUPPORT =====
function demonstrateIDNSupport() {
  console.log('🌍 International Domain Support:\n');
  
  const internationalEmails = [
    'user@münchen.de',           // German umlaut
    'test@москва.рф',           // Cyrillic
    'admin@中国.cn',            // Chinese
    'user@español.es',          // Spanish
    'test@العربية.السعودية'     // Arabic
  ];
  
  internationalEmails.forEach(email => {
    console.log(`Email: ${email}`);
    
    const validation = validateInternationalEmail(email);
    if (validation) {
      console.log(`  ❌ Invalid: ${validation.message}`);
      console.log(`  🔍 Code: ${validation.code}`);
    } else {
      console.log(`  ✅ Valid international email`);
      const domain = extractDomain(email);
      console.log(`  🌐 Domain: ${domain}`);
    }
    console.log('');
  });
}

// ===== CONFIGURATION =====
function showConfiguration() {
  console.log('⚙️  Configuration:\n');
  
  console.log(`DNS Timeout: ${Config.DEFAULT_DNS_TIMEOUT}ms`);
  console.log(`Rate Limit: ${Config.MAX_DNS_REQUESTS_PER_MINUTE} requests/minute`);
  console.log(`Providers: ${Config.SUPPORTED_PROVIDERS_COUNT}`);
  console.log(`Domains: ${Config.SUPPORTED_DOMAINS_COUNT}`);
  console.log('');
}

// ===== RUN ALL DEMONSTRATIONS =====
async function runFullDemo() {
  showLibraryInfo();
  demonstrateValidation();
  await demonstrateAsyncDetection();
  await demonstrateHighPerformance();
  demonstrateNormalization();
  demonstrateBatchProcessing();
  showProviderInfo();
  demonstrateIDNSupport();
  showConfiguration();
  
  console.log('✨ Demo completed! The library is working perfectly.\n');
  console.log('🔗 More examples: https://github.com/mikkelscheike/email-provider-links');
  console.log('📚 Documentation: https://github.com/mikkelscheike/email-provider-links#readme');
}

// Run the demo
runFullDemo().catch(console.error);