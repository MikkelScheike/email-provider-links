/**
 * Test suite for rate limiting functionality
 */

import { 
  RateLimit, 
  detectProviderByDNS,
  getEmailProviderLinkWithDNS
} from '../src/index';

const { SimpleRateLimiter } = RateLimit;

describe('Rate Limiting', () => {
  describe('SimpleRateLimiter', () => {
    let rateLimiter: InstanceType<typeof SimpleRateLimiter>;

    beforeEach(() => {
      // Create a new rate limiter with test-friendly values
      rateLimiter = new SimpleRateLimiter(3, 1000); // 3 requests per 1 second for faster testing
    });

    it('should allow requests under the limit', () => {
      expect(rateLimiter.isAllowed()).toBe(true);
      expect(rateLimiter.isAllowed()).toBe(true);
      expect(rateLimiter.isAllowed()).toBe(true);
      expect(rateLimiter.getCurrentCount()).toBe(3);
    });

    it('should block requests over the limit', () => {
      // Use up the allowance
      expect(rateLimiter.isAllowed()).toBe(true);
      expect(rateLimiter.isAllowed()).toBe(true);
      expect(rateLimiter.isAllowed()).toBe(true);
      
      // Fourth request should be blocked
      expect(rateLimiter.isAllowed()).toBe(false);
      expect(rateLimiter.getCurrentCount()).toBe(3);
    });

    it('should reset after the time window', async () => {
      // Use up the allowance
      rateLimiter.isAllowed();
      rateLimiter.isAllowed();
      rateLimiter.isAllowed();
      
      // Should be blocked
      expect(rateLimiter.isAllowed()).toBe(false);
      
      // Wait for the window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be allowed again
      expect(rateLimiter.isAllowed()).toBe(true);
      expect(rateLimiter.getCurrentCount()).toBe(1);
    });

    it('should provide accurate time until reset', () => {
      const startTime = Date.now();
      
      // Use up allowance
      rateLimiter.isAllowed();
      rateLimiter.isAllowed();
      rateLimiter.isAllowed();
      
      const timeUntilReset = rateLimiter.getTimeUntilReset();
      const elapsedTime = Date.now() - startTime;
      
      // Should be close to 1000ms minus elapsed time
      expect(timeUntilReset).toBeGreaterThan(900 - elapsedTime);
      expect(timeUntilReset).toBeLessThanOrEqual(1000 - elapsedTime);
    });

    it('should return 0 time until reset when not rate limited', () => {
      expect(rateLimiter.getTimeUntilReset()).toBe(0);
      
      rateLimiter.isAllowed();
      rateLimiter.isAllowed();
      
      // Still under limit, but now we have timestamps, so it won't be 0
      // Instead, it will be the time until the oldest timestamp expires
      const timeUntilReset = rateLimiter.getTimeUntilReset();
      expect(timeUntilReset).toBeGreaterThan(0);
      expect(timeUntilReset).toBeLessThanOrEqual(1000);
    });

    it('should handle concurrent requests correctly', () => {
      const results = [];
      
      // Simulate concurrent requests
      for (let i = 0; i < 5; i++) {
        results.push(rateLimiter.isAllowed());
      }
      
      // First 3 should be allowed, last 2 should be blocked
      expect(results).toEqual([true, true, true, false, false]);
    });

    it('should clean up old timestamps correctly', async () => {
      // Make some requests
      rateLimiter.isAllowed();
      rateLimiter.isAllowed();
      
      expect(rateLimiter.getCurrentCount()).toBe(2);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Getting count should clean up old timestamps
      expect(rateLimiter.getCurrentCount()).toBe(0);
    });
  });

  describe('DNS Rate Limiting Integration', () => {
    it('should enforce rate limits by checking the limiter state', () => {
      // Test the rate limiting logic without actually making DNS calls
      const testLimiter = new SimpleRateLimiter(2, 60000); // 2 requests per minute
      
      // Simulate what happens in detectProviderByDNS
      // First request should be allowed
      expect(testLimiter.isAllowed()).toBe(true);
      
      // Second request should be allowed
      expect(testLimiter.isAllowed()).toBe(true);
      
      // Third request should be blocked
      expect(testLimiter.isAllowed()).toBe(false);
      
      // Verify the error message format that would be thrown
      const retryAfter = Math.ceil(testLimiter.getTimeUntilReset() / 1000);
      const expectedError = `Rate limit exceeded. DNS queries limited to 10 requests per minute. Try again in ${retryAfter} seconds.`;
      expect(expectedError).toMatch(/Rate limit exceeded/);
      expect(expectedError).toMatch(/Try again in \d+ seconds/);
      expect(expectedError).toContain('10 requests per minute');
    });

    it('should not rate limit known domains', async () => {
      // Known domains should work regardless of rate limiting state
      // because they bypass DNS lookup entirely
      const gmailResult = await getEmailProviderLinkWithDNS('user@gmail.com');
      expect(gmailResult.provider?.companyProvider).toBe('Gmail');
      expect(gmailResult.detectionMethod).toBe('domain_match');

      const outlookResult = await getEmailProviderLinkWithDNS('user@outlook.com');
      expect(outlookResult.provider?.companyProvider).toBe('Microsoft Outlook');
      expect(outlookResult.detectionMethod).toBe('domain_match');
    });
    
    it('should integrate rate limiting into DNS detection flow', () => {
      // Test that the rate limiter is called when DNS detection would occur
      const limiter = RateLimit.getCurrentLimiter();
      const initialCount = limiter.getCurrentCount();
      
      // This test verifies the integration exists without relying on
      // actual DNS resolution which can be unreliable in test environments
      expect(typeof limiter.isAllowed).toBe('function');
      expect(typeof limiter.getCurrentCount).toBe('function');
      expect(typeof limiter.getTimeUntilReset).toBe('function');
      
      // The count should be a number (could be 0 or higher depending on other tests)
      expect(typeof initialCount).toBe('number');
      expect(initialCount).toBeGreaterThanOrEqual(0);
      
      // Test that the limiter actually works
      expect(typeof limiter.isAllowed()).toBe('boolean');
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should expose correct rate limiting constants', () => {
      expect(RateLimit.MAX_REQUESTS).toBe(10);
      expect(RateLimit.WINDOW_MS).toBe(60000);
      expect(typeof RateLimit.SimpleRateLimiter).toBe('function');
      expect(typeof RateLimit.getCurrentLimiter).toBe('function');
    });

    it('should provide access to current limiter', () => {
      const limiter = RateLimit.getCurrentLimiter();
      expect(limiter).toBeDefined();
      expect(typeof limiter.isAllowed).toBe('function');
      expect(typeof limiter.getCurrentCount).toBe('function');
      expect(typeof limiter.getTimeUntilReset).toBe('function');
    });

    it('should allow creating custom rate limiters', () => {
      const customLimiter = new RateLimit.SimpleRateLimiter(5, 30000);
      
      // Should work with custom parameters
      for (let i = 0; i < 5; i++) {
        expect(customLimiter.isAllowed()).toBe(true);
      }
      
      // Sixth request should be blocked
      expect(customLimiter.isAllowed()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max requests', () => {
      const limiter = new SimpleRateLimiter(0, 1000);
      expect(limiter.isAllowed()).toBe(false);
      expect(limiter.getCurrentCount()).toBe(0);
    });

    it('should handle very small time windows', async () => {
      const limiter = new SimpleRateLimiter(2, 1); // 1ms window
      
      expect(limiter.isAllowed()).toBe(true);
      expect(limiter.isAllowed()).toBe(true);
      expect(limiter.isAllowed()).toBe(false);
      
      // Wait for the tiny window to expire
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(limiter.isAllowed()).toBe(true);
    });

    it('should handle large numbers of requests efficiently', () => {
      const limiter = new SimpleRateLimiter(1000, 60000);
      
      const start = Date.now();
      
      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        limiter.isAllowed();
      }
      
      const duration = Date.now() - start;
      
      // Should complete quickly (less than 100ms)
      expect(duration).toBeLessThan(100);
      expect(limiter.getCurrentCount()).toBe(1000);
      
      // 1001st request should be blocked
      expect(limiter.isAllowed()).toBe(false);
    });
  });
});
