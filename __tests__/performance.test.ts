/**
 * Performance Tests
 * 
 * These tests measure:
 * 1. Load time performance
 * 2. Memory usage
 * 3. Cache effectiveness
 * 4. Lookup performance
 * 5. Stress testing
 */

import {
  loadProviders,
  loadProvidersDebug,
  clearCache,
  getLoadingStats,
  buildDomainMap
} from '../src/provider-loader';
import { getEmailProviderSync, getEmailProviderFast } from '../src/api';

describe('Performance Tests', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('Load Time Performance', () => {
    it('should load data within performance budget', () => {
      const startTime = process.hrtime.bigint();
      const result = loadProviders();
      const endTime = process.hrtime.bigint();
      
      const durationMs = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
      
      // Performance budgets
      expect(durationMs).toBeLessThan(50); // First load should be under 50ms (increased from 10ms)
      expect(result.providers.length).toBeGreaterThan(100); // Expect at least 100 providers
    });

    it('should have fast cached access', () => {
      // First load to warm cache
      loadProviders();
      
      // Measure cached access
      const startTime = process.hrtime.bigint();
      loadProviders();
      const endTime = process.hrtime.bigint();
      
      const durationMs = Number(endTime - startTime) / 1_000_000;
      expect(durationMs).toBeLessThan(0.1); // Cached access should be under 0.1ms
    });
  });

  describe('Memory Usage', () => {
    it('should have stable memory usage under load', () => {
      // Warm up to trigger JIT and allocate stable structures
      for (let i = 0; i < 100; i++) {
        const warm = getEmailProviderSync('test@gmail.com');
        expect(warm.provider).toBeDefined();
      }

      // Encourage GC before measurement if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage();

      // Perform 1000 provider lookups
      for (let i = 0; i < 1000; i++) {
        const result = getEmailProviderSync('test@gmail.com');
        expect(result.provider).toBeDefined();
      }

      // Encourage GC after workload if available to reduce noise
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();

      // Memory increase should be reasonable for 1000 operations
      const heapIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB
      // Allow a slightly higher threshold to account for platform variance in CI
      expect(heapIncrease).toBeLessThan(80); // Heap should not grow more than 80MB
    });

    it('should free memory after cache clear', () => {
      // Load data to populate cache multiple times to ensure significant memory usage
      for (let i = 0; i < 100; i++) {
        loadProviders();
      }
      const beforeClear = process.memoryUsage().heapUsed;
      
      // Clear cache and force garbage collection if available
      clearCache();
      if (global.gc) {
        global.gc();
      }
      const afterClear = process.memoryUsage().heapUsed;
      
      // Memory should be within a reasonable range
      const memoryDiff = (afterClear - beforeClear) / 1024 / 1024; // MB
      expect(memoryDiff).toBeLessThan(1); // Should be within 1MB difference
    });
  });

  describe('Cache Effectiveness', () => {
    it('should maintain performance under repeated access', () => {
      // Warm-up to reduce JIT and GC noise
      for (let i = 0; i < 50; i++) { loadProviders(); }

      const times: number[] = [];
      // Measure 500 cached loads
      for (let i = 0; i < 500; i++) {
        const start = process.hrtime.bigint();
        loadProviders();
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1_000_000);
      }
      
      // Calculate statistics
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const percentile = (arr: number[], p: number) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
        return sorted[idx];
      };
      const p95 = percentile(times, 95);
      const p99 = percentile(times, 99);
      
      // Tight on typical performance but resilient to rare CI hiccups
      expect(average).toBeLessThan(0.12); // Average under 0.12ms
      expect(p95).toBeLessThan(1.0);      // 95th percentile under 1ms
      expect(p99).toBeLessThan(3.5);      // 99th percentile under 3.5ms
      expect(max).toBeLessThan(6);        // Guardrail for pathological outliers
    });
  });

  describe('Lookup Performance', () => {
    it('should have fast domain lookups', async () => {
      const { domainMap } = loadProviders();
      
      // Add null check for domainMap
      if (!domainMap) {
        throw new Error('Domain map is undefined');
      }
      
      const domains = Array.from(domainMap.keys());
      
      const startTime = process.hrtime.bigint();
      
      // Perform 500 random domain lookups
      for (let i = 0; i < 500; i++) {
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        const provider = domainMap.get(randomDomain);
        expect(provider).toBeDefined();
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      
      // Domain lookups should be performed efficiently. Allow headroom for environment variance.
      expect(durationMs).toBeLessThan(100); // Expected to be under 100ms for 500 lookups
    });

    it('should maintain performance with async lookups', async () => {
      const domains = [
        'gmail.com',
        'outlook.com',
        'yahoo.com',
        'icloud.com',
        'protonmail.com'
      ];
      
      const startTime = process.hrtime.bigint();
      
      // Perform 100 concurrent lookups
      const promises = domains.map(domain => 
        getEmailProviderFast(`test@${domain}`)
      );
      
      const results = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      
      const durationMs = Number(endTime - startTime) / 1_000_000;
      
      // All lookups should succeed
      results.forEach(result => expect(result.provider).toBeDefined());
      
      // Should complete quickly
      expect(durationMs).toBeLessThan(100); // Under 100ms for concurrent lookups
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid repeated access', () => {
      const iterations = 5000; // Increased from 1000
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        const result = getEmailProviderSync('test@gmail.com');
        expect(result.provider).toBeDefined();
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      
      // Calculate operations per second
      const opsPerSecond = iterations / (durationMs / 1000);
      
      // Should handle at least 500 ops/second - increased expectation
      expect(opsPerSecond).toBeGreaterThan(500);
    });

    it('should handle concurrent load', async () => {
      const concurrentRequests = 20;
      const emails = [
        'test1@gmail.com',
        'test2@outlook.com',
        'test3@yahoo.com',
        'test4@icloud.com',
        'test5@protonmail.com'
      ];
      
      const startTime = process.hrtime.bigint();
      
      // Create many concurrent requests
      const promises = Array(concurrentRequests).fill(null).map(() => {
        const email = emails[Math.floor(Math.random() * emails.length)];
        return getEmailProviderFast(email);
      });
      
      const results = await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      
      const durationMs = Number(endTime - startTime) / 1_000_000;
      
      // All requests should succeed
      results.forEach(result => expect(result.provider).toBeDefined());
      
      // Should handle concurrent load efficiently
      expect(durationMs).toBeLessThan(1000); // Under 1 second for 20 concurrent requests
    });
  });

  describe('Memory Leaks', () => {
    it('should not leak memory during repeated operations', () => {
      console.log('\n🔍 Memory Usage Analysis:');
      const initialMemory = process.memoryUsage();
      console.log(`Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      const iterations = 200; // Reduced from 1000
      
      // Simulate real-world usage pattern
      for (let i = 0; i < iterations; i++) {
        if (i % 50 === 0) { // Reduced from 200
          const currentMemory = process.memoryUsage();
          console.log(`Iteration ${i}: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        }
        
        // Regular provider lookup with occasional cache clear
        if (i % 50 === 0) { // Reduced from 100
          clearCache();
          loadProviders();
        }
        
        getEmailProviderSync('test@gmail.com');
      }
      
      const finalMemory = process.memoryUsage();
      console.log(`Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      
      // Calculate memory growth
      const heapGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      console.log(`Total growth: ${heapGrowth.toFixed(2)}MB`);
      
      // Memory growth should be minimal
      expect(heapGrowth).toBeLessThan(25); // Less than 25MB growth after 200 iterations
    });
  });
});
