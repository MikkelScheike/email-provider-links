/**
 * Email Alias Detection Examples
 * 
 * Demonstrates how to use the email alias detection functionality
 * to identify and normalize email aliases across different providers.
 */

import {
  detectEmailAlias,
  normalizeEmail,
  emailsMatch,
  getAliasCapabilities,
  generateAliases,
  analyzeEmailAliases
} from '../src/alias-detection';

console.log('🔍 Email Alias Detection Examples\n');

// Example 1: Basic alias detection
console.log('📧 Example 1: Basic Alias Detection');
console.log('=====================================');

const gmailExamples = [
  'user@gmail.com',
  'u.s.e.r@gmail.com',
  'user+newsletter@gmail.com',
  'u.s.e.r+shopping@gmail.com'
];

gmailExamples.forEach(email => {
  const result = detectEmailAlias(email);
  console.log(`Email: ${email}`);
  console.log(`  Canonical: ${result.canonical}`);
  console.log(`  Is Alias: ${result.isAlias}`);
  console.log(`  Type: ${result.aliasType}`);
  console.log(`  Alias Part: ${result.aliasPart || 'none'}`);
  console.log('');
});

// Example 2: Provider comparison
console.log('🔄 Example 2: Provider Comparison');
console.log('==================================');

const testEmails = [
  'user+test@gmail.com',      // Gmail: plus supported, dots ignored
  'user+test@outlook.com',    // Outlook: plus supported, dots preserved
  'user+test@yahoo.com',      // Yahoo: plus supported
  'user+test@aol.com'         // AOL: plus not supported
];

testEmails.forEach(email => {
  const result = detectEmailAlias(email);
  const [, domain] = email.split('@');
  const capabilities = getAliasCapabilities(domain);
  
  console.log(`${email}:`);
  console.log(`  Canonical: ${result.canonical}`);
  console.log(`  Plus Support: ${capabilities?.supportsPlusAddressing || false}`);
  console.log(`  Dots Ignored: ${capabilities?.ignoresDots || false}`);
  console.log('');
});

// Example 3: Email matching
console.log('🔗 Example 3: Email Matching');
console.log('=============================');

const emailPairs = [
  ['user@gmail.com', 'u.s.e.r@gmail.com'],
  ['user@gmail.com', 'user+newsletter@gmail.com'],
  ['user@outlook.com', 'user+work@outlook.com'],
  ['user@gmail.com', 'user@outlook.com']
];

emailPairs.forEach(([email1, email2]) => {
  const match = emailsMatch(email1, email2);
  console.log(`${email1} === ${email2}: ${match}`);
});

console.log('');

// Example 4: Alias generation
console.log('⚙️ Example 4: Alias Generation');
console.log('===============================');

const baseEmail = 'john.doe@gmail.com';
const aliases = generateAliases(baseEmail, {
  plusAliases: ['work', 'shopping', 'newsletter'],
  includeDotVariations: true,
  maxDotVariations: 3
});

console.log(`Base email: ${baseEmail}`);
console.log('Generated aliases:');
aliases.forEach(alias => console.log(`  - ${alias}`));

console.log('');

// Example 5: Email list analysis
console.log('📊 Example 5: Email List Analysis');
console.log('==================================');

const emailList = [
  'john@gmail.com',
  'j.o.h.n@gmail.com',
  'john+work@gmail.com',
  'jane@outlook.com',
  'jane+personal@outlook.com',
  'bob@yahoo.com',
  'bob+newsletter@yahoo.com',
  'alice@unknown-provider.com'
];

const analysis = analyzeEmailAliases(emailList);

console.log(`Total emails analyzed: ${analysis.totalEmails}`);
console.log(`Unique canonical addresses: ${analysis.uniqueCanonical}`);
console.log('');

console.log('Alias groups:');
analysis.aliasGroups.forEach(group => {
  console.log(`  ${group.canonical} (${group.count} aliases):`);
  group.aliases.forEach(alias => {
    if (alias !== group.canonical) {
      console.log(`    - ${alias}`);
    }
  });
});

console.log('');
console.log('Provider statistics:');
Object.entries(analysis.providerStats).forEach(([provider, stats]) => {
  console.log(`  ${provider}:`);
  console.log(`    Total: ${stats.total}, Aliases: ${stats.aliases}`);
  console.log(`    Types: ${JSON.stringify(stats.types)}`);
});

// Example 6: Normalization for deduplication
console.log('');
console.log('🧹 Example 6: Email Deduplication');
console.log('==================================');

const duplicateEmails = [
  'user@gmail.com',
  'u.s.e.r@gmail.com',
  'USER@gmail.com',
  'user+work@gmail.com',
  'user+personal@gmail.com',
  'different@gmail.com'
];

const normalizedEmails = new Set(duplicateEmails.map(normalizeEmail));

console.log('Original emails:');
duplicateEmails.forEach(email => console.log(`  - ${email}`));

console.log('');
console.log('After normalization and deduplication:');
Array.from(normalizedEmails).forEach(email => console.log(`  - ${email}`));

console.log(`\nReduced from ${duplicateEmails.length} to ${normalizedEmails.size} unique addresses`);

// Example 7: Provider capabilities overview
console.log('');
console.log('🔧 Example 7: Provider Capabilities');
console.log('====================================');

const providers = [
  'gmail.com',
  'outlook.com', 
  'yahoo.com',
  'proton.me',
  'icloud.com',
  'aol.com'
];

providers.forEach(provider => {
  const capabilities = getAliasCapabilities(provider);
  if (capabilities) {
    console.log(`${provider}:`);
    console.log(`  Plus addressing: ${capabilities.supportsPlusAddressing}`);
    console.log(`  Ignores dots: ${capabilities.ignoresDots}`);
    console.log(`  Subdomain aliases: ${capabilities.supportsSubdomainAlias}`);
    console.log('');
  }
});

console.log('✅ Examples completed!');
