#!/usr/bin/env tsx

/**
 * Example usage of the email-provider-links package
 * Run with: npx tsx example.ts
 */

import { 
  getEmailProvider,
  getEmailProviderSync, 
  isEmailProviderSupported, 
  getSupportedProviders,
  isValidEmail,
  extractDomain,
  normalizeEmail,
  emailsMatch
} from '../src/index';

console.log('🚀 Email Provider Links - Demo\n');

// Demonstrate the main async function first
async function demoAsyncAPI() {
  console.log('🔍 Testing async provider detection (recommended):\n');
  
  const testEmails = [
    'user@gmail.com',
    'business@example.com',  // Unknown domain - will try DNS
    'user@fastmail.com'
  ];
  
  for (const email of testEmails) {
    console.log(`Email: ${email}`);
    try {
      const result = await getEmailProvider(email);
      if (result.provider) {
        console.log(`  ✅ Provider: ${result.provider.companyProvider}`);
        console.log(`  🔗 Login URL: ${result.loginUrl}`);
        console.log(`  📡 Method: ${result.detectionMethod || 'domain_match'}`);
      } else {
        console.log(`  ❌ Provider: Not found`);
      }
    } catch (error) {
      console.log(`  ⚠️  Error: ${error}`);
    }
    console.log('');
  }
}

// Demonstrate sync API
function demoSyncAPI() {
  console.log('⚡ Testing synchronous detection (known domains only):\n');

  const testEmails = [
    'user@gmail.com',
    'myemail@outlook.com',
    'test@yahoo.com',
    'unknown@example.org'
  ];

  testEmails.forEach(email => {
    const result = getEmailProviderSync(email);
    console.log(`Email: ${email}`);
    
    if (result.provider) {
      console.log(`  ✅ Provider: ${result.provider.companyProvider}`);
      console.log(`  🔗 Login URL: ${result.loginUrl}`);
    } else {
      console.log(`  ❌ Provider: Not supported`);
    }
    console.log('');
  });
}

// Demonstrate email normalization
function demoEmailNormalization() {
  console.log('🔄 Testing email normalization (alias detection):\n');
  
  const aliasExamples = [
    ['u.s.e.r+work@gmail.com', 'user@gmail.com'],
    ['user+tag@outlook.com', 'user@outlook.com'],
    ['test.email+newsletter@gmail.com', 'testemail@gmail.com']
  ];
  
  aliasExamples.forEach(([original, expected]) => {
    const normalized = normalizeEmail(original);
    const match = emailsMatch(original, expected);
    console.log(`Original: ${original}`);
    console.log(`  Normalized: ${normalized}`);
    console.log(`  Matches '${expected}': ${match}`);
    console.log('');
  });
}

console.log('🔍 Testing utility functions:\n');

// Test email validation
console.log('Email validation:');
console.log(`  isValidEmail('user@gmail.com'): ${isValidEmail('user@gmail.com')}`);
console.log(`  isValidEmail('invalid-email'): ${isValidEmail('invalid-email')}`);
console.log('');

// Test domain extraction
console.log('Domain extraction:');
console.log(`  extractDomain('user@gmail.com'): ${extractDomain('user@gmail.com')}`);
console.log(`  extractDomain('USER@OUTLOOK.COM'): ${extractDomain('USER@OUTLOOK.COM')}`);
console.log('');

// Test provider lookup
console.log('Provider lookup:');
const providers = getSupportedProviders();
const gmailProvider = providers.find(p => p.domains.includes('gmail.com'));
console.log(`  Gmail provider: ${gmailProvider?.companyProvider}`);
console.log('');

// Test provider support
console.log('Provider support check:');
console.log(`  isEmailProviderSupported('user@gmail.com'): ${isEmailProviderSupported('user@gmail.com')}`);
console.log(`  isEmailProviderSupported('user@unknown.com'): ${isEmailProviderSupported('user@unknown.com')}`);
console.log('');

// List all supported providers
console.log('📋 All supported providers:');
providers.slice(0, 10).forEach((provider, index) => {
  console.log(`  ${index + 1}. ${provider.companyProvider} (${provider.domains.length} domains)`);
});
console.log(`  ... and ${providers.length - 10} more providers`);

// Run the async demos
(async () => {
  await demoAsyncAPI();
  demoSyncAPI();
  demoEmailNormalization();
  console.log('\n✨ Demo completed!');
})();

