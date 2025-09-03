/**
 * Edge Case Tests for Concurrent DNS Module
 * 
 * These tests specifically target uncovered lines in concurrent DNS detection,
 * including error scenarios, fallback handling, and edge cases.
 */

// Mock Node's dns module to avoid native handle leaks in open-handle detection
// This keeps tests deterministic and prevents lingering c-ares sockets
jest.mock('dns', () => {
  const mockResolveMx = (domain: string, cb: (err: any, addresses: any[]) => void) => {
    process.nextTick(() => {
const invalidLike = !domain || domain.startsWith('.') || domain.endsWith('.') || domain.includes('..') || !domain.includes('.');
      if (domain.includes('invalid')) {
        const err: any = new Error('ENOTFOUND');
        err.code = 'ENOTFOUND';
        cb(err, []);
      } else if (invalidLike || domain === 'com') {
        // Simulate no MX records for invalid-ish inputs
        cb(null, []);
      } else {
        // Simulate a generic MX that matches common patterns
        cb(null, [{ exchange: 'mx.google.com', priority: 10 }]);
      }
    });
  };
  const mockResolveTxt = (domain: string, cb: (err: any, records: string[][]) => void) => {
    process.nextTick(() => {
const invalidLike = !domain || domain.startsWith('.') || domain.endsWith('.') || domain.includes('..') || !domain.includes('.');
      if (domain.includes('invalid')) {
        const err: any = new Error('ENOTFOUND');
        err.code = 'ENOTFOUND';
        cb(err, []);
      } else if (invalidLike || domain === 'com') {
        cb(null, []);
      } else {
        cb(null, [['v=spf1 include:gmail.com']]);
      }
    });
  };
  return { resolveMx: mockResolveMx, resolveTxt: mockResolveTxt };
});

/* global describe, it, expect */
import {
  ConcurrentDNSDetector,
  detectProviderConcurrent
} from '../src/concurrent-dns';

import { getSupportedProviders } from '../src/index';

describe('Concurrent DNS Edge Cases', () => {
  const providers = getSupportedProviders();

  describe('Constructor edge cases', () => {
    it('should filter providers with only mxPatterns', () => {
      const providersWithOnlyMx = providers.map(p => ({
        ...p,
        customDomainDetection: {
          mxPatterns: ['test.mx'],
          txtPatterns: undefined
        }
      }));
      
      const detector = new ConcurrentDNSDetector(providersWithOnlyMx);
      expect(detector).toBeInstanceOf(ConcurrentDNSDetector);
    });

    it('should filter providers with only txtPatterns', () => {
      const providersWithOnlyTxt = providers.map(p => ({
        ...p,
        customDomainDetection: {
          mxPatterns: undefined,
          txtPatterns: ['v=spf1 test']
        }
      }));
      
      const detector = new ConcurrentDNSDetector(providersWithOnlyTxt);
      expect(detector).toBeInstanceOf(ConcurrentDNSDetector);
    });

    it('should handle providers with null customDomainDetection', () => {
      const providersWithNull = providers.map(p => ({
        ...p,
        customDomainDetection: null as any
      }));
      
      const detector = new ConcurrentDNSDetector(providersWithNull);
      expect(detector).toBeInstanceOf(ConcurrentDNSDetector);
    });
  });

  describe('Parallel vs Sequential execution paths', () => {
    it('should use parallel execution when enabled', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        enableParallel: true,
        collectDebugInfo: true,
        timeout: 5000
      });

      const result = await detector.detectProvider('google.com');
      expect(result).toBeDefined();
      expect(result.timing).toBeDefined();
      
      if (result.debug) {
        expect(result.debug.fallbackUsed).toBe(false);
      }
    });

    it('should use sequential execution when parallel disabled', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        enableParallel: false,
        collectDebugInfo: true,
        timeout: 5000
      });

      const result = await detector.detectProvider('google.com');
      expect(result).toBeDefined();
      expect(result.timing).toBeDefined();
      
      if (result.debug) {
        expect(result.debug.fallbackUsed).toBe(false);
      }
    });

    it('should handle fallback from parallel to sequential', async () => {
      // Create a detector that will likely trigger fallback due to very short timeout
      const detector = new ConcurrentDNSDetector(providers, {
        enableParallel: true,
        fallbackToSequential: true,
        collectDebugInfo: true,
        timeout: 1 // Very short timeout to potentially trigger errors
      });

      const result = await detector.detectProvider('google.com');
      expect(result).toBeDefined();
      expect(result.timing).toBeDefined();
      
      // Fallback may or may not be used depending on network conditions
      if (result.debug && result.debug.fallbackUsed) {
        console.log('Fallback was successfully triggered and used');
      }
    });

    it('should handle fallback disabled scenario', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        enableParallel: true,
        fallbackToSequential: false,
        collectDebugInfo: true,
        timeout: 1 // Very short timeout
      });

      const result = await detector.detectProvider('google.com');
      expect(result).toBeDefined();
      expect(result.timing).toBeDefined();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle domains that cause DNS errors', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        collectDebugInfo: true,
        timeout: 2000
      });

      // Test with a domain that should not exist
      const result = await detector.detectProvider('this-domain-should-definitely-not-exist-12345.invalid');
      
      expect(result).toBeDefined();
      expect(result.provider).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.timing.total).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty domain string', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        collectDebugInfo: true
      });

      const result = await detector.detectProvider('');
      expect(result).toBeDefined();
      expect(result.provider).toBeNull();
    });

    it('should handle domain with only TLD', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        collectDebugInfo: true,
        timeout: 1000
      });

      const result = await detector.detectProvider('com');
      expect(result).toBeDefined();
    });

    it('should handle internationalized domain names (IDN)', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        collectDebugInfo: true,
        timeout: 2000
      });

      // Test with a domain containing non-ASCII characters (would normally be punycode)
      const result = await detector.detectProvider('xn--e1afmkfd.xn--p1ai'); // пример.рф in punycode
      expect(result).toBeDefined();
    });
  });

  describe('Provider matching edge cases', () => {
    it('should handle providers with conflicting patterns', async () => {
      // Create providers with overlapping patterns to test conflict detection
      const conflictingProviders = [
        {
          companyProvider: 'Test Provider 1',
          loginUrl: 'https://test1.com',
          domains: [],
          customDomainDetection: {
            mxPatterns: ['google.com'],
            txtPatterns: []
          }
        },
        {
          companyProvider: 'Test Provider 2', 
          loginUrl: 'https://test2.com',
          domains: [],
          customDomainDetection: {
            mxPatterns: ['google.com'],
            txtPatterns: []
          }
        }
      ];

      const detector = new ConcurrentDNSDetector(conflictingProviders, {
        collectDebugInfo: true,
        prioritizeMX: true
      });

      const result = await detector.detectProvider('google.com');
      
      if (result.debug && result.debug.mxMatches.length > 1) {
        expect(result.debug.conflicts).toBe(true);
      }
    });

    it('should prioritize MX records when configured', async () => {
      const testProviders = [
        {
          companyProvider: 'MX Provider',
          loginUrl: 'https://mx.com',
          domains: [],
          customDomainDetection: {
            mxPatterns: ['gmail.com'],
            txtPatterns: []
          }
        },
        {
          companyProvider: 'TXT Provider',
          loginUrl: 'https://txt.com', 
          domains: [],
          customDomainDetection: {
            mxPatterns: [],
            txtPatterns: ['v=spf1 include:gmail.com']
          }
        }
      ];

      const detector = new ConcurrentDNSDetector(testProviders, {
        prioritizeMX: true,
        collectDebugInfo: true
      });

      const result = await detector.detectProvider('gmail.com');
      
      // If both patterns match, MX should be preferred
      if (result.provider && result.debug) {
        if (result.debug.mxMatches.length > 0 && result.debug.txtMatches.length > 0) {
          expect(result.detectionMethod).toBe('mx_record');
        }
      }
    });

    it('should handle proxy detection for known CDNs', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        collectDebugInfo: true,
        timeout: 3000
      });

      // Test with a domain that might use Cloudflare (common proxy)
      const result = await detector.detectProvider('cloudflare.com');
      
      expect(result).toBeDefined();
      // May or may not detect proxy depending on actual DNS records
      if (result.proxyService) {
        expect(result.detectionMethod).toBe('proxy_detected');
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });
  });

  describe('Timing and performance edge cases', () => {
    it('should handle zero timeout gracefully', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        timeout: 0,
        collectDebugInfo: true
      });

      const result = await detector.detectProvider('google.com');
      expect(result).toBeDefined();
      expect(result.timing.total).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large timeout', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        timeout: 60000, // 1 minute
        collectDebugInfo: true
      });

      const result = await detector.detectProvider('google.com');
      expect(result).toBeDefined();
      expect(result.timing.total).toBeLessThan(60000); // Should complete much faster
    });

    it('should measure timing accurately for quick operations', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        timeout: 5000,
        collectDebugInfo: true
      });

      const startTime = Date.now();
      const result = await detector.detectProvider('google.com');
      const actualTime = Date.now() - startTime;
      
      expect(result.timing.total).toBeGreaterThanOrEqual(0);
      expect(result.timing.total).toBeLessThanOrEqual(actualTime + 50); // Allow some margin
    });
  });

  describe('Debug information collection', () => {
    it('should collect complete debug information when enabled', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        collectDebugInfo: true,
        timeout: 5000
      });

      const result = await detector.detectProvider('google.com');
      
      expect(result.debug).toBeDefined();
      if (result.debug) {
        expect(Array.isArray(result.debug.queries)).toBe(true);
        expect(Array.isArray(result.debug.mxMatches)).toBe(true);
        expect(Array.isArray(result.debug.txtMatches)).toBe(true);
        expect(typeof result.debug.conflicts).toBe('boolean');
        expect(typeof result.debug.fallbackUsed).toBe('boolean');
      }
    });

    it('should not collect debug information when disabled', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        collectDebugInfo: false,
        timeout: 5000
      });

      const result = await detector.detectProvider('google.com');
      expect(result.debug).toBeUndefined();
    });

    it('should record query results in debug info', async () => {
      const detector = new ConcurrentDNSDetector(providers, {
        collectDebugInfo: true,
        timeout: 5000
      });

      const result = await detector.detectProvider('google.com');
      
      if (result.debug && result.debug.queries) {
        result.debug.queries.forEach(query => {
          expect(query.type).toMatch(/^(mx|txt)$/);
          expect(typeof query.success).toBe('boolean');
          expect(typeof query.timing).toBe('number');
          expect(query.timing).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  describe('Utility function edge cases', () => {
    it('should work with detectProviderConcurrent utility function', async () => {
      const result = await detectProviderConcurrent('google.com', providers, {
        timeout: 3000,
        enableParallel: true,
        collectDebugInfo: true,
        prioritizeMX: true,
        fallbackToSequential: true
      });

      expect(result).toBeDefined();
      expect(result.timing).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle minimal configuration in utility function', async () => {
      const result = await detectProviderConcurrent('google.com', providers);
      
      expect(result).toBeDefined();
      expect(result.timing).toBeDefined();
    });

    it('should handle empty providers array in utility function', async () => {
      const result = await detectProviderConcurrent('google.com', [], {
        timeout: 1000,
        collectDebugInfo: true
      });

      expect(result).toBeDefined();
      expect(result.provider).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle invalid domain formats in utility function', async () => {
      const invalidDomains = [
        '',
        '.',
        '..',
        'domain.',
        '.domain',
        'domain..com',
        'domain..',
        '..domain.com'
      ];

      for (const domain of invalidDomains) {
        const result = await detectProviderConcurrent(domain, providers, {
          timeout: 1000
        });
        
        expect(result).toBeDefined();
        // Most invalid domains should return null provider
        expect(result.provider).toBeNull();
      }
    });
  });
});
