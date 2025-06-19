#!/usr/bin/env tsx

/**
 * Example demonstrating DNS timeout configuration
 * Run with: npx tsx example-timeout.ts
 */

import { 
  getEmailProviderLinkWithDNS, 
  detectProviderByDNS 
} from '../src/index';

console.log('🕒 DNS Timeout Configuration Examples\n');

async function demonstrateTimeouts() {
  console.log('1. Default timeout (5000ms):');
  const start1 = Date.now();
  try {
    const result1 = await getEmailProviderLinkWithDNS('user@microsoft.com');
    const duration1 = Date.now() - start1;
    console.log(`   ✅ Detected: ${result1.provider?.companyProvider} in ${duration1}ms`);
    console.log(`   🔗 Method: ${result1.detectionMethod}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  console.log('');

  console.log('2. Fast timeout (2000ms):');
  const start2 = Date.now();
  try {
    const result2 = await getEmailProviderLinkWithDNS('user@google.com', 2000);
    const duration2 = Date.now() - start2;
    console.log(`   ✅ Detected: ${result2.provider?.companyProvider} in ${duration2}ms`);
    console.log(`   🔗 Method: ${result2.detectionMethod}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  console.log('');

  console.log('3. Direct DNS detection with custom timeout:');
  const start3 = Date.now();
  try {
    const result3 = await detectProviderByDNS('microsoft.com', 3000);
    const duration3 = Date.now() - start3;
    console.log(`   ✅ Detected: ${result3.provider?.companyProvider} in ${duration3}ms`);
    console.log(`   🔗 Method: ${result3.detectionMethod}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  console.log('');

  console.log('4. Very short timeout (100ms) - may timeout:');
  const start4 = Date.now();
  try {
    const result4 = await getEmailProviderLinkWithDNS('user@nonexistent-domain-test.com', 100);
    const duration4 = Date.now() - start4;
    console.log(`   ✅ Result: ${result4.provider ? result4.provider.companyProvider : 'Not detected'} in ${duration4}ms`);
  } catch (error) {
    const duration4 = Date.now() - start4;
    console.log(`   ⏱️  Timeout after ${duration4}ms (expected behavior)`);
  }
  console.log('');

  console.log('💡 Timeout Configuration Tips:');
  console.log('   • Default 5000ms works for most cases');
  console.log('   • Use 2000ms for faster UX in web apps');
  console.log('   • Use 10000ms for reliable detection on slow networks');
  console.log('   • Consider user experience vs accuracy trade-offs');
}

demonstrateTimeouts().then(() => {
  console.log('\n✨ Timeout demonstration completed!');
}).catch(error => {
  console.error('Demo error:', error);
});

