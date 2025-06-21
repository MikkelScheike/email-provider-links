#!/usr/bin/env tsx

/**
 * Example demonstrating DNS timeout configuration
 * Run with: npx tsx example-timeout.ts
 */

import { 
  getEmailProvider, 
  getEmailProviderFast 
} from '../src/index';

console.log('🕒 DNS Timeout Configuration Examples\n');

async function demonstrateTimeouts() {
  console.log('1. Default timeout (5000ms):');
  const start1 = Date.now();
  try {
    const result1 = await getEmailProvider('user@microsoft.com');
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
    const result2 = await getEmailProvider('user@google.com', 2000);
    const duration2 = Date.now() - start2;
    console.log(`   ✅ Detected: ${result2.provider?.companyProvider} in ${duration2}ms`);
    console.log(`   🔗 Method: ${result2.detectionMethod}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  console.log('');

  console.log('3. High-performance detection with custom timeout:');
  const start3 = Date.now();
  try {
    const result3 = await getEmailProviderFast('user@microsoft.com', {
      timeout: 3000,
      enableParallel: true,
      collectDebugInfo: true
    });
    const duration3 = Date.now() - start3;
    console.log(`   ✅ Detected: ${result3.provider?.companyProvider} in ${duration3}ms`);
    console.log(`   🔗 Method: ${result3.detectionMethod}`);
    console.log(`   ⚡ Performance: ${result3.timing?.total}ms (internal timing)`);
    console.log(`   📊 Confidence: ${result3.confidence}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  console.log('');

  console.log('4. Very short timeout (100ms) - may timeout:');
  const start4 = Date.now();
  try {
    const result4 = await getEmailProvider('user@nonexistent-domain-test.com', 100);
    const duration4 = Date.now() - start4;
    console.log(`   ✅ Result: ${result4.provider ? result4.provider.companyProvider : 'Not detected'} in ${duration4}ms`);
    if (result4.error) {
      console.log(`   ❌ Error: ${result4.error.message}`);
    }
  } catch (error) {
    const duration4 = Date.now() - start4;
    console.log(`   ⏱️  Timeout after ${duration4}ms (expected behavior)`);
  }
  console.log('');

  console.log('5. Timeout comparison - Parallel vs Sequential:');
  const testEmail = 'user@google.com';
  
  // Parallel detection
  const parallelStart = Date.now();
  const parallelResult = await getEmailProviderFast(testEmail, {
    timeout: 3000,
    enableParallel: true
  });
  const parallelDuration = Date.now() - parallelStart;
  
  // Sequential detection
  const sequentialStart = Date.now();
  const sequentialResult = await getEmailProviderFast(testEmail, {
    timeout: 3000,
    enableParallel: false
  });
  const sequentialDuration = Date.now() - sequentialStart;
  
  console.log(`   Parallel detection: ${parallelDuration}ms`);
  console.log(`   Sequential detection: ${sequentialDuration}ms`);
  console.log(`   Performance gain: ${Math.max(0, sequentialDuration - parallelDuration)}ms faster`);
  console.log('');

  console.log('💡 Timeout Configuration Tips:');
  console.log('   • Default 5000ms works for most cases');
  console.log('   • Use 2000ms for faster UX in web apps');
  console.log('   • Use 10000ms for reliable detection on slow networks');
  console.log('   • Consider user experience vs accuracy trade-offs');
  console.log('   • Use getEmailProviderFast() for performance metrics');
}

demonstrateTimeouts().then(() => {
  console.log('\n✨ Timeout demonstration completed!');
}).catch(error => {
  console.error('Demo error:', error);
});
