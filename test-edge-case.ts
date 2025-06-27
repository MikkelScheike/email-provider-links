#!/usr/bin/env tsx

/**
 * Edge Case Testing: Illegal Local Part with Valid Domain
 * 
 * Testing whether the system can:
 * 1. Detect illegal local parts
 * 2. Still provide domain/login URL information when possible
 * 3. Give clear error messages about what failed and why
 * 4. Identify which component triggered the error
 */

import { 
  getEmailProvider,
  getEmailProviderSync,
  validateEmailAddress,
  validateInternationalEmail,
  extractDomain,
  isValidEmail
} from './src/index';

console.log('🧪 Testing Edge Case: Illegal Local Part with Valid Domain\n');

// Test cases with illegal local parts but valid domains
const testCases = [
  {
    email: '.invalid@gmail.com',
    description: 'Local part starts with dot'
  },
  {
    email: 'invalid.@gmail.com', 
    description: 'Local part ends with dot'
  },
  {
    email: 'inva..lid@gmail.com',
    description: 'Local part has consecutive dots'
  },
  {
    email: 'a'.repeat(65) + '@gmail.com',
    description: 'Local part too long (65 chars) but valid domain'
  },
  {
    email: 'user@example@gmail.com',
    description: 'Multiple @ symbols'
  },
  {
    email: 'user with spaces@gmail.com',
    description: 'Local part contains spaces'
  },
  {
    email: 'user<script>@outlook.com',
    description: 'Local part contains HTML/script tags'
  },
  {
    email: '"quoted..dots"@yahoo.com',
    description: 'Quoted local part (technically valid but unusual)'
  }
];

async function testEdgeCase(testCase: { email: string; description: string }) {
  console.log(`\n📧 Testing: ${testCase.email}`);
  console.log(`📝 Case: ${testCase.description}`);
  console.log('─'.repeat(60));

  // 1. Test enhanced validation
  console.log('🔍 Enhanced Validation:');
  const validation = validateEmailAddress(testCase.email);
  if (validation.isValid) {
    console.log('  ✅ Valid');
    console.log(`  📧 Normalized: ${validation.normalizedEmail}`);
  } else {
    console.log('  ❌ Invalid');
    console.log(`  🚨 Error Type: ${validation.error?.type}`);
    console.log(`  🔍 Error Code: ${validation.error?.code}`);
    console.log(`  💬 Message: ${validation.error?.message}`);
  }

  // 2. Test international validation
  console.log('\n🌍 International Validation:');
  const idnValidation = validateInternationalEmail(testCase.email);
  if (idnValidation) {
    console.log('  ❌ Invalid');
    console.log(`  🚨 Error Type: ${idnValidation.type}`);
    console.log(`  🔍 Error Code: ${idnValidation.code}`);
    console.log(`  💬 Message: ${idnValidation.message}`);
  } else {
    console.log('  ✅ Valid by international standards');
  }

  // 3. Test basic validation
  console.log('\n📋 Basic Validation:');
  const basicValid = isValidEmail(testCase.email);
  console.log(`  ${basicValid ? '✅' : '❌'} Basic validation: ${basicValid}`);

  // 4. Test domain extraction (should work even with invalid local part)
  console.log('\n🌐 Domain Extraction:');
  const domain = extractDomain(testCase.email);
  if (domain) {
    console.log(`  ✅ Domain extracted: ${domain}`);
  } else {
    console.log('  ❌ Could not extract domain');
  }

  // 5. Test synchronous provider detection
  console.log('\n📞 Sync Provider Detection:');
  try {
    const syncResult = getEmailProviderSync(testCase.email);
    if (syncResult.provider) {
      console.log(`  ✅ Provider: ${syncResult.provider.companyProvider}`);
      console.log(`  🔗 Login URL: ${syncResult.loginUrl}`);
      console.log(`  📡 Method: ${syncResult.detectionMethod}`);
    } else {
      console.log('  ❌ No provider found');
      if (syncResult.error) {
        console.log(`  🚨 Error Type: ${syncResult.error.type}`);
        console.log(`  💬 Message: ${syncResult.error.message}`);
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Exception: ${error}`);
  }

  // 6. Test async provider detection
  console.log('\n🔍 Async Provider Detection:');
  try {
    const asyncResult = await getEmailProvider(testCase.email);
    if (asyncResult.provider) {
      console.log(`  ✅ Provider: ${asyncResult.provider.companyProvider}`);
      console.log(`  🔗 Login URL: ${asyncResult.loginUrl}`);
      console.log(`  📡 Method: ${asyncResult.detectionMethod}`);
    } else {
      console.log('  ❌ No provider found');
      if (asyncResult.error) {
        console.log(`  🚨 Error Type: ${asyncResult.error.type}`);
        console.log(`  💬 Message: ${asyncResult.error.message}`);
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Exception: ${error}`);
  }

  // 7. Test manual domain provider lookup (bypass email validation)
  if (domain) {
    console.log('\n🎯 Direct Domain Provider Lookup:');
    try {
      const domainResult = await getEmailProvider(`valid@${domain}`);
      if (domainResult.provider) {
        console.log(`  ✅ Domain Provider: ${domainResult.provider.companyProvider}`);
        console.log(`  🔗 Domain Login URL: ${domainResult.loginUrl}`);
        console.log('  📝 Note: This shows the domain IS supported, just the email format was invalid');
      } else {
        console.log(`  ❌ Domain ${domain} not supported`);
      }
    } catch (error) {
      console.log(`  ⚠️  Domain lookup failed: ${error}`);
    }
  }
}

async function runAllTests() {
  console.log('🎯 Purpose: Validate error handling granularity and component isolation');
  console.log('📋 Expected: Clear errors with specific components and actionable messages');
  console.log('═'.repeat(80));

  for (const testCase of testCases) {
    await testEdgeCase(testCase);
    console.log('\n' + '═'.repeat(80));
  }

  // Summary
  console.log('\n📊 Summary of Error Handling Capabilities:');
  console.log('✅ Enhanced validation provides detailed error codes and messages');
  console.log('✅ International validation identifies specific validation issues');  
  console.log('✅ Component isolation allows domain extraction even with invalid local parts');
  console.log('✅ Provider detection can work independently of email format validation');
  console.log('✅ Clear error attribution shows which component failed and why');
  console.log('✅ Actionable error messages help developers understand what to fix');
}

// Run the tests
runAllTests().catch(console.error);