#!/usr/bin/env tsx

/**
 * Example usage of the email-provider-links package
 * Run with: npx tsx example.ts
 */

import { 
  getEmailProviderLink, 
  isEmailProviderSupported, 
  getSupportedProviders,
  isValidEmail,
  extractDomain,
  findEmailProvider
} from '../src/index';

console.log('🚀 Email Provider Links - Demo\n');

// Test emails
const testEmails = [
  'user@gmail.com',
  'myemail@outlook.com',
  'test@yahoo.com',
  'user@icloud.com',
  'secure@protonmail.com',
  'business@zoho.com',
  'unknown@example.org'
];

console.log('📧 Testing email provider detection:\n');

testEmails.forEach(email => {
  const result = getEmailProviderLink(email);
  console.log(`Email: ${email}`);
  
  if (result.provider) {
    console.log(`  ✅ Provider: ${result.provider.companyProvider}`);
    console.log(`  🔗 Login URL: ${result.loginUrl}`);
  } else {
    console.log(`  ❌ Provider: Not supported`);
  }
  console.log('');
});

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

// Test provider finding
console.log('Provider finding:');
const gmailProvider = findEmailProvider('gmail.com');
console.log(`  findEmailProvider('gmail.com'): ${gmailProvider?.companyProvider}`);
console.log('');

// Test provider support
console.log('Provider support check:');
console.log(`  isEmailProviderSupported('user@gmail.com'): ${isEmailProviderSupported('user@gmail.com')}`);
console.log(`  isEmailProviderSupported('user@unknown.com'): ${isEmailProviderSupported('user@unknown.com')}`);
console.log('');

// List all supported providers
console.log('📋 All supported providers:');
const providers = getSupportedProviders();
providers.forEach((provider, index) => {
  console.log(`  ${index + 1}. ${provider.companyProvider} (${provider.domains.join(', ')})`);
});

console.log('\n✨ Demo completed!');

