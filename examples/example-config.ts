#!/usr/bin/env tsx

/**
 * Example demonstrating configuration and constants
 * Run with: npx tsx example-config.ts
 */

import { 
  getEmailProvider,
  getEmailProviderFast,
  Config,
  getSupportedProviders
} from '../src/index';

console.log('⚙️ Configuration and Constants Examples\n');

async function demonstrateConfiguration() {
  console.log('📊 Package Configuration:');
  console.log(`  Default DNS Timeout: ${Config.DEFAULT_DNS_TIMEOUT}ms`);
  console.log(`  Max DNS Requests/Minute: ${Config.MAX_DNS_REQUESTS_PER_MINUTE}`);
  console.log(`  Supported Providers: ${Config.SUPPORTED_PROVIDERS_COUNT}`);
  console.log(`  Supported Domains: ${Config.SUPPORTED_DOMAINS_COUNT}`);
  console.log('');

  console.log('🔍 Actual Provider Statistics:');
  const providers = getSupportedProviders();
  const totalDomains = providers.reduce((sum, p) => sum + p.domains.length, 0);
  console.log(`  Actual Providers Loaded: ${providers.length}`);
  console.log(`  Actual Domains Loaded: ${totalDomains}`);
  console.log(`  Providers with DNS Detection: ${providers.filter(p => p.customDomainDetection).length}`);
  console.log('');

  console.log('1. Using default timeout:');
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

  console.log('2. Using custom timeout (shorter than default):');
  const customTimeout = Math.floor(Config.DEFAULT_DNS_TIMEOUT / 2); // Half the default
  const start2 = Date.now();
  try {
    const result2 = await getEmailProvider('user@google.com', customTimeout);
    const duration2 = Date.now() - start2;
    console.log(`   ✅ Detected: ${result2.provider?.companyProvider} in ${duration2}ms`);
    console.log(`   🔗 Method: ${result2.detectionMethod}`);
    console.log(`   ⚡ Custom timeout: ${customTimeout}ms (vs default ${Config.DEFAULT_DNS_TIMEOUT}ms)`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  console.log('');

  console.log('3. High-performance detection with configuration options:');
  const start3 = Date.now();
  try {
    const result3 = await getEmailProviderFast('user@microsoft.com', {
      timeout: Config.DEFAULT_DNS_TIMEOUT,
      enableParallel: true,
      collectDebugInfo: true
    });
    const duration3 = Date.now() - start3;
    console.log(`   ✅ Detected: ${result3.provider?.companyProvider} in ${duration3}ms`);
    console.log(`   🔗 Method: ${result3.detectionMethod}`);
    console.log(`   ⚡ Internal timing: ${result3.timing?.total}ms`);
    console.log(`   📊 Confidence: ${result3.confidence}`);
    console.log(`   🔧 Used timeout: ${Config.DEFAULT_DNS_TIMEOUT}ms`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }
  console.log('');

  console.log('4. Rate limiting considerations:');
  console.log(`   • DNS queries are limited to ${Config.MAX_DNS_REQUESTS_PER_MINUTE} per minute`);
  console.log(`   • Known domains (${Config.SUPPORTED_DOMAINS_COUNT}+ domains) bypass rate limiting`);
  console.log('   • Rate limiting only affects unknown business domains');
  console.log('   • Consider caching results for frequently queried domains');
  console.log('');

  console.log('5. Performance characteristics:');
  console.log(`   • Known domain lookup: O(1) - instant`);
  console.log(`   • Unknown domain DNS lookup: up to ${Config.DEFAULT_DNS_TIMEOUT}ms`);
  console.log(`   • Parallel DNS detection: ~2x faster than sequential`);
  console.log(`   • Provider database size: ~21KB optimized format`);
  console.log('');

  console.log('💡 Configuration Tips:');
  console.log('   • Use default timeout for reliability');
  console.log('   • Use shorter timeouts (1-3s) for better UX in web apps');
  console.log('   • Use longer timeouts (10s+) for slow/unreliable networks');
  console.log('   • Enable parallel detection for better performance');
  console.log('   • Cache results to avoid redundant DNS queries');
  console.log(`   • ${Config.SUPPORTED_PROVIDERS_COUNT} providers cover most use cases`);
}

demonstrateConfiguration().then(() => {
  console.log('\n✨ Configuration demonstration completed!');
}).catch(error => {
  console.error('Demo error:', error);
});
