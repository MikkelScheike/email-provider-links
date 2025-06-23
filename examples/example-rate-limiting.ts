#!/usr/bin/env tsx

/**
 * Example demonstrating rate limiting functionality
 * Run with: npx tsx example-rate-limiting.ts
 */

import { 
  detectProviderByDNS,
  getEmailProviderLinkWithDNS,
  RateLimit
} from '../src/index';

console.log('🚦 Rate Limiting Examples\n');

async function demonstrateRateLimiting() {
  console.log('Rate Limiting Configuration:');
  console.log(`  Max Requests: ${RateLimit.MAX_REQUESTS}`);
  console.log(`  Time Window: ${RateLimit.WINDOW_MS / 1000} seconds`);
  console.log('');

  // Get current rate limiter status
  const limiter = RateLimit.getCurrentLimiter();
  console.log('Current Rate Limiter Status:');
  console.log(`  Current Count: ${limiter.getCurrentCount()}`);
  console.log(`  Time Until Reset: ${limiter.getTimeUntilReset()}ms`);
  console.log('');

  console.log('1. Testing rate limiting with unknown domains (will trigger DNS):');
  
  // Test domains that don't exist in the JSON database
  const testDomains = [
    'test-business-1.example',
    'test-business-2.example', 
    'test-business-3.example',
    'test-business-4.example',
    'test-business-5.example',
    'test-business-6.example',
    'test-business-7.example',
    'test-business-8.example',
    'test-business-9.example',
    'test-business-10.example',
    'test-business-11.example', // This should trigger rate limiting
    'test-business-12.example'  // This should also be rate limited
  ];

  for (let i = 0; i < testDomains.length; i++) {
    const domain = testDomains[i];
    const email = `user@${domain}`;
    
    console.log(`  ${i + 1}. Testing: ${email}`);
    
    try {
      const start = Date.now();
      const result = await getEmailProviderLinkWithDNS(email, 1000); // 1 second timeout
      const duration = Date.now() - start;
      
      console.log(`     ✅ Result: ${result.provider?.companyProvider || 'Unknown'} (${duration}ms)`);
      console.log(`     📊 Method: ${result.detectionMethod || 'none'}`);
      
      if (result.proxyService) {
        console.log(`     🛡️  Proxy: ${result.proxyService}`);
      }
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('Rate limit exceeded')) {
        console.log(`     🚫 Rate Limited: ${errorMessage}`);
        console.log(`     ⏰ Current count: ${limiter.getCurrentCount()}`);
        console.log(`     ⏳ Reset in: ${Math.ceil(limiter.getTimeUntilReset() / 1000)} seconds`);
      } else {
        console.log(`     ❌ DNS Error: ${errorMessage.substring(0, 50)}...`);
      }
    }
    
    console.log('');
  }

  console.log('2. Testing with known domains (should NOT trigger rate limiting):');
  
  const knownDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
  
  for (const domain of knownDomains) {
    const email = `user@${domain}`;
    console.log(`  Testing: ${email}`);
    
    try {
      const start = Date.now();
      const result = await getEmailProviderLinkWithDNS(email);
      const duration = Date.now() - start;
      
      console.log(`     ✅ Provider: ${result.provider?.companyProvider} (${duration}ms)`);
      console.log(`     📊 Method: ${result.detectionMethod}`);
      console.log('     💡 No DNS query needed - rate limit not affected');
      
    } catch (error) {
      console.log(`     ❌ Error: ${(error as Error).message}`);
    }
    
    console.log('');
  }

  console.log('3. Testing custom rate limiter:');
  
  // Create a custom rate limiter with very restrictive limits
  const customLimiter = new RateLimit.SimpleRateLimiter(2, 5000); // 2 requests per 5 seconds
  
  console.log('  Custom limiter (2 requests per 5 seconds):');
  
  for (let i = 1; i <= 4; i++) {
    const allowed = customLimiter.isAllowed();
    console.log(`     Request ${i}: ${allowed ? '✅ Allowed' : '🚫 Blocked'}`);
    console.log(`     Count: ${customLimiter.getCurrentCount()}`);
    console.log(`     Reset in: ${customLimiter.getTimeUntilReset()}ms`);
    console.log('');
  }

  console.log('💡 Rate Limiting Tips:');
  console.log('   • Rate limiting only applies to DNS queries for unknown domains');
  console.log('   • Known domains (gmail.com, etc.) bypass DNS and rate limiting');
  console.log('   • Default limit: 10 DNS requests per 60 seconds');
  console.log('   • Rate limit errors include retry timing information');
  console.log('   • Custom rate limiters can be created for specific use cases');
  console.log('   • Rate limiting prevents abuse and protects DNS infrastructure');
}

demonstrateRateLimiting().then(() => {
  console.log('\n✨ Rate limiting demonstration completed!');
}).catch(error => {
  console.error('Demo error:', error);
});
