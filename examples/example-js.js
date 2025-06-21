#!/usr/bin/env node

/**
 * JavaScript Example - demonstrating that the package works with plain JavaScript
 * Run with: node example-js.js (after building the package)
 */

// This would be: const { getEmailProviderLink } = require('email-provider-links');
// For local testing, we'll use the dist build
const { 
  getEmailProviderSync, 
  getEmailProvider,
  isEmailProviderSupported, 
  getSupportedProviders,
  isValidEmail 
} = require('../dist/index.js');

console.log('🚀 Email Provider Links - JavaScript Example\n');

// Test emails
const testEmails = [
  'user@gmail.com',
  'myemail@outlook.com', 
  'test@yahoo.com',
  'user@qq.com',
  'business@web.de',
  'unknown@example.org'
];

console.log('📧 Testing email provider detection in JavaScript:\n');

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

// Show validation
console.log('🔍 Email validation:');
console.log(`  isValidEmail('user@gmail.com'): ${isValidEmail('user@gmail.com')}`);
console.log(`  isValidEmail('invalid-email'): ${isValidEmail('invalid-email')}`);
console.log('');

// Show provider support check
console.log('✅ Provider support check:');
console.log(`  Gmail supported: ${isEmailProviderSupported('user@gmail.com')}`);
console.log(`  Unknown domain: ${isEmailProviderSupported('user@unknown.com')}`);
console.log('');

// List all providers
console.log('📋 All supported providers:');
const providers = getSupportedProviders();
providers.slice(0, 5).forEach((provider, index) => {
  console.log(`  ${index + 1}. ${provider.companyProvider}`);
});
console.log(`  ... and ${providers.length - 5} more providers`);

console.log('\n✨ JavaScript example completed!');
console.log('\n💡 Usage in your JavaScript project:');
console.log('// Synchronous detection');
console.log('const { getEmailProviderSync } = require("email-provider-links");');
console.log('const result = getEmailProviderSync("user@gmail.com");');
console.log('console.log(result.loginUrl); // "https://mail.google.com/mail/"');
console.log('');
console.log('// Async detection with DNS support');
console.log('const { getEmailProvider } = require("email-provider-links");');
console.log('const result = await getEmailProvider("user@mycompany.com");');

