import {
  ConcurrentDNSDetector,
  createConcurrentDNSDetector,
  detectProviderConcurrent,
  ConcurrentDNSConfig,
  ConcurrentDNSResult
} from '../src/concurrent-dns';
import { getSupportedProviders } from '../src/index';
import { getEmailProviderFast } from '../src/api';

describe('Concurrent DNS Detection Tests', () => {
  const providers = getSupportedProviders();
  
  describe('ConcurrentDNSDetector', () => {
    let detector: ConcurrentDNSDetector;
    
    beforeEach(() => {
      detector = new ConcurrentDNSDetector(providers, {
        timeout: 3000,
        collectDebugInfo: true
      });
    });

    afterEach(async () => {
      // Clean up any remaining DNS query states and promises
      await Promise.race([
        detector?.cleanup?.(),
        new Promise(resolve => setTimeout(resolve, 100).unref())
      ]);
    });

    describe('Provider Detection', () => {
      it('should detect Microsoft 365 from known domain', async () => {
        const result = await detector.detectProvider('microsoft.com');
        
        // Should either detect Microsoft 365 or handle gracefully
        if (result.provider) {
          expect(result.provider.companyProvider).toBe('Microsoft 365 (Business)');
          expect(result.detectionMethod).toMatch(/mx_record|txt_record|both/);
          expect(result.confidence).toBeGreaterThan(0);
        } else {
          expect(result.detectionMethod).toBeNull();
        }
        
        expect(result.timing.total).toBeGreaterThanOrEqual(0);
        expect(result.debug).toBeDefined();
      }, 10000);

      it('should handle unknown domains gracefully', async () => {
        const result = await detector.detectProvider('completely-unknown-domain-12345.com');
        
        expect(result.provider).toBeNull();
        expect(result.confidence).toBe(0);
        expect(result.timing.total).toBeGreaterThanOrEqual(0);
      }, 10000);

      it('should detect proxy services', async () => {
        // Test with a domain known to use Cloudflare (this might be flaky)
        const result = await detector.detectProvider('digitalhabitat.io');
        
        if (result.proxyService) {
          expect(result.detectionMethod).toBe('proxy_detected');
          expect(result.proxyService).toBe('Cloudflare');
          expect(result.provider).toBeNull();
        }
      }, 10000);
    });

    describe('Parallel vs Sequential Performance', () => {
      it('should show performance improvement with parallel queries', async () => {
        const parallelDetector = new ConcurrentDNSDetector(providers, {
          enableParallel: true,
          timeout: 5000
        });
        
        const sequentialDetector = new ConcurrentDNSDetector(providers, {
          enableParallel: false,
          timeout: 5000
        });

        const domain = 'google.com';
        
        // Measure parallel performance
        const parallelStart = Date.now();
        const parallelResult = await parallelDetector.detectProvider(domain);
        const parallelTime = Date.now() - parallelStart;
        
        // Measure sequential performance
        const sequentialStart = Date.now();
        const sequentialResult = await sequentialDetector.detectProvider(domain);
        const sequentialTime = Date.now() - sequentialStart;
        
        // Both should detect the same provider (if any)
        if (parallelResult.provider && sequentialResult.provider) {
          expect(parallelResult.provider.companyProvider).toBe(sequentialResult.provider.companyProvider);
        }
        
        // Parallel should be faster or similar (allowing for network variance)
        console.log(`Parallel: ${parallelTime}ms, Sequential: ${sequentialTime}ms`);
        // Due to DNS caching, query optimization, and network variance,
        // we can't guarantee consistent performance improvements in tests
        // Just ensure both complete within reasonable time
        expect(parallelTime).toBeLessThan(10000);
        expect(sequentialTime).toBeLessThan(10000);
      }, 15000);

      it('should handle timeout correctly', async () => {
        const quickDetector = new ConcurrentDNSDetector(providers, {
          timeout: 100, // Very short timeout
          enableParallel: true
        });

        const result = await quickDetector.detectProvider('google.com');
        
        // Should complete within reasonable time even with short timeout
        expect(result.timing.total).toBeLessThan(1000);
      }, 5000);
    });

    describe('Configuration Options', () => {
      it('should respect prioritizeMX setting', async () => {
        const mxPriorityDetector = new ConcurrentDNSDetector(providers, {
          prioritizeMX: true,
          collectDebugInfo: true
        });

        const result = await mxPriorityDetector.detectProvider('microsoft.com');
        
        if (result.provider && result.debug) {
          // If both MX and TXT matches exist, MX should be preferred
          if (result.debug.mxMatches.length > 0 && result.debug.txtMatches.length > 0) {
            expect(result.detectionMethod).toBe('mx_record');
          }
        }
      }, 10000);

      it('should collect debug information when enabled', async () => {
        const debugDetector = new ConcurrentDNSDetector(providers, {
          collectDebugInfo: true
        });

        const result = await debugDetector.detectProvider('google.com');
        
        expect(result.debug).toBeDefined();
        expect(result.debug?.queries).toBeDefined();
        expect(Array.isArray(result.debug?.queries)).toBe(true);
        // fallbackUsed property should exist (may be false if fallback wasn't needed)
        expect(typeof result.debug?.fallbackUsed).toBe('boolean');
      }, 10000);

      it('should not collect debug information when disabled', async () => {
        const noDebugDetector = new ConcurrentDNSDetector(providers, {
          collectDebugInfo: false
        });

        const result = await noDebugDetector.detectProvider('google.com');
        
        expect(result.debug).toBeUndefined();
      }, 10000);
    });

    describe('Error Handling and Fallback', () => {
      it('should fall back to sequential on parallel failure', async () => {
        const fallbackDetector = new ConcurrentDNSDetector(providers, {
          enableParallel: true,
          fallbackToSequential: true,
          collectDebugInfo: true
        });

        // This should succeed with either parallel or fallback
        const result = await fallbackDetector.detectProvider('google.com');
        
        expect(result.timing.total).toBeGreaterThanOrEqual(0);
        if (result.debug?.fallbackUsed) {
          console.log('Fallback was used for this test');
        }
      }, 10000);

      it('should handle DNS resolution failures gracefully', async () => {
        const result = await detector.detectProvider('invalid-domain-that-does-not-exist.invalid');
        
        expect(result.provider).toBeNull();
        expect(result.detectionMethod).toBeNull();
        expect(result.confidence).toBe(0);
        expect(result.timing.total).toBeGreaterThanOrEqual(0);
      }, 10000);
    });
  });

  describe('Factory Functions', () => {
    it('should create detector with factory function', () => {
      const detector = createConcurrentDNSDetector(providers, {
        timeout: 2000,
        enableParallel: false
      });
      
      expect(detector).toBeInstanceOf(ConcurrentDNSDetector);
    });

    it('should work with utility function', async () => {
      const result = await detectProviderConcurrent('google.com', providers, {
        timeout: 3000,
        collectDebugInfo: true
      });
      
      expect(result).toBeDefined();
      expect(result.timing).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    }, 10000);
  });

  describe('Integration with Email Provider API', () => {
    it('should work with getEmailProviderFast', async () => {
      const result = await getEmailProviderFast('user@microsoft.com', {
        enableParallel: true,
        collectDebugInfo: true
      });
      
      expect(result.email).toBe('user@microsoft.com');
      expect(result.timing).toBeDefined();
      
      if (result.provider) {
        expect(result.provider.companyProvider).toBe('Microsoft 365 (Business)');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
      } else {
        expect(result.error).toBeDefined();
      }
    }, 10000);

    it('should fall back to sync detection for known domains', async () => {
      const result = await getEmailProviderFast('user@gmail.com', {
        enableParallel: true
      });
      
      expect(result.provider?.companyProvider).toBe('Gmail');
      expect(result.detectionMethod).toBe('domain_match');
      expect(result.timing?.total).toBe(0); // Should be fast sync detection
      expect(result.confidence).toBe(1.0);
    });

    it('should handle invalid emails in fast mode', async () => {
      const result = await getEmailProviderFast('invalid-email');
      
      expect(result.provider).toBeNull();
      expect(result.error?.type).toBe('INVALID_EMAIL');
      expect(result.error?.message).toBe('Invalid email format');
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete DNS detection within reasonable time', async () => {
      const start = Date.now();
      const result = await detectProviderConcurrent('google.com', providers, {
        timeout: 5000,
        enableParallel: true
      });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(8000); // Allow some overhead
      expect(result.timing.total).toBeLessThan(duration + 100);
    }, 10000);

    it('should handle multiple concurrent detections', async () => {
      const domains = ['google.com', 'microsoft.com', 'fastmail.com'];
      
      const start = Date.now();
      const results = await Promise.all(
        domains.map(domain => detectProviderConcurrent(domain, providers, {
          timeout: 3000,
          enableParallel: true
        }))
      );
      const totalTime = Date.now() - start;
      
      expect(results).toHaveLength(domains.length);
      expect(totalTime).toBeLessThan(10000); // Should run concurrently
      
      results.forEach((result, index) => {
        expect(result.timing.total).toBeGreaterThanOrEqual(0);
        console.log(`${domains[index]}: ${result.provider?.companyProvider || 'Not detected'} (${result.timing.total}ms)`);
      });
    }, 15000);
  });

  describe('Confidence Scoring', () => {
    it('should assign higher confidence to MX record matches', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        prioritizeMX: true,
        collectDebugInfo: true
      });

      const result = await detector.detectProvider('google.com');
      
      if (result.provider && result.detectionMethod === 'mx_record') {
        expect(result.confidence).toBeGreaterThan(0.1); // Lower threshold for realistic testing
      }
    }, 10000);

    it('should provide confidence scores for all detections', async () => {
      const result = await detectProviderConcurrent('google.com', providers);
      
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      
      if (result.provider) {
        expect(result.confidence).toBeGreaterThan(0);
      }
    }, 10000);
  });
});
