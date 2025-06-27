/**
 * Comprehensive Edge Case Tests for Provider Data Loader
 * 
 * These tests target uncovered lines and edge cases to improve test coverage.
 * Focuses on error handling, input validation, and unusual scenarios.
 */

import {
  loadProviders,
  loadProvidersDebug,
  clearCache,
  getLoadingStats
} from '../src/loader';

describe('Provider Data Loader Edge Cases', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('Built-in data loading', () => {
    it('should load built-in provider data successfully', () => {
      const result = loadProviders();
      expect(result.providers).toBeDefined();
      expect(result.providers.length).toBeGreaterThan(0);
    });

    it('should load data without any parameters', () => {
      const result = loadProviders();
      expect(result.providers).toBeDefined();
      expect(result.domainMap).toBeDefined();
      expect(result.stats).toBeDefined();
    });
  });

  describe('Cache edge cases', () => {
    it('should return cached data on second call', () => {
      const first = loadProviders();
      const second = loadProviders();
      
      // Should be same instance
      expect(first.providers).toBe(second.providers);
    });

    it('should reload data when debug mode is enabled', () => {
      const first = loadProviders();
      const second = loadProvidersDebug();
      
      // Debug mode should reload
      expect(first.providers).not.toBe(second.providers);
    });

    it('should clear cache properly', () => {
      loadProviders();
      expect(getLoadingStats()).not.toBeNull();
      
      clearCache();
      expect(getLoadingStats()).toBeNull();
    });

    it('should build new cache after clearing', () => {
      const first = loadProviders();
      clearCache();
      const second = loadProviders();
      
      // Should be different instances after cache clear
      expect(first.providers).not.toBe(second.providers);
      expect(second.providers).toBeDefined();
    });
  });

  describe('Stats and metadata edge cases', () => {
    it('should return null stats when no data loaded', () => {
      clearCache();
      expect(getLoadingStats()).toBeNull();
    });

    it('should return accurate stats after loading', () => {
      const { providers, stats } = loadProviders();
      
      expect(stats.providerCount).toBe(providers.length);
      expect(stats.domainCount).toBeGreaterThan(0);
      expect(stats.loadTime).toBeGreaterThanOrEqual(0);
      expect(stats.fileSize).toBeGreaterThan(0);
    });

    it('should calculate domain count correctly', () => {
      const { providers, stats } = loadProviders();
      const actualDomainCount = providers.reduce((sum, p) => sum + p.domains.length, 0);
      
      expect(stats.domainCount).toBe(actualDomainCount);
    });
  });

  describe('Debug mode edge cases', () => {
    it('should produce debug output when enabled', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      loadProvidersDebug();
      
      expect(logSpy).toHaveBeenCalled();
      
      logSpy.mockRestore();
    });

    it('should always reload in debug mode', () => {
      // Load once in normal mode
      const normal = loadProviders();
      
      // Load again in debug mode
      const debug1 = loadProvidersDebug();
      const debug2 = loadProvidersDebug();
      
      // Debug loads should be different instances
      expect(debug1.providers).not.toBe(debug2.providers);
      expect(debug1.providers).not.toBe(normal.providers);
    });
  });

  describe('Performance edge cases', () => {
    it('should load data quickly', () => {
      const start = Date.now();
      loadProviders();
      const duration = Date.now() - start;
      
      // Should load reasonably quickly
      expect(duration).toBeLessThan(200);
    });

    it('should cache effectively for performance', () => {
      // Clear cache to ensure fresh first load
      clearCache();
      
      // First load (should be slower)
      const start1 = process.hrtime.bigint();
      loadProviders();
      const duration1 = Number(process.hrtime.bigint() - start1) / 1000000; // Convert to ms
      
      // Second load (cached, should be faster)
      const start2 = process.hrtime.bigint();
      loadProviders();
      const duration2 = Number(process.hrtime.bigint() - start2) / 1000000; // Convert to ms
      
      // Cached should be faster or equal (if both are very fast)
      expect(duration2).toBeLessThanOrEqual(duration1);
      // Both should complete within reasonable time
      expect(duration1).toBeLessThan(100);
      expect(duration2).toBeLessThan(50);
    });

    it('should handle multiple concurrent loads gracefully', async () => {
      clearCache();
      
      // Start multiple loads simultaneously
      const promises = Array(5).fill(null).map(() => 
        Promise.resolve(loadProviders())
      );
      
      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result.providers).toBeDefined();
        expect(result.providers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('loadProviders edge cases', () => {
    it('should return consistent results', () => {
      const first = loadProviders();
      const second = loadProviders();
      
      expect(first.providers).toBe(second.providers); // Cached
      expect(first.domainMap).toBe(second.domainMap); // Cached
      expect(first.stats).toBe(second.stats); // Cached
    });

    it('should have domain map with correct size', () => {
      const { providers, domainMap } = loadProviders();
      const expectedDomains = providers.reduce((sum, p) => sum + p.domains.length, 0);
      
      expect(domainMap.size).toBe(expectedDomains);
    });

    it('should provide valid domain lookups', () => {
      const { domainMap } = loadProviders();
      
      // Test known domains
      const gmail = domainMap.get('gmail.com');
      expect(gmail).toBeDefined();
      expect(gmail?.companyProvider).toBe('Gmail');
      
      const outlook = domainMap.get('outlook.com');
      expect(outlook).toBeDefined();
      expect(outlook?.companyProvider).toBe('Microsoft Outlook');
    });
  });

  describe('Built-in data integrity', () => {
    it('should have valid provider data structure', () => {
      const { providers } = loadProviders();
      
      expect(providers.length).toBeGreaterThan(90);
      
      providers.forEach(provider => {
        expect(provider).toHaveProperty('companyProvider');
        expect(provider).toHaveProperty('loginUrl');
        expect(provider).toHaveProperty('domains');
        expect(provider.loginUrl === null || typeof provider.loginUrl === 'string').toBe(true);
        expect(provider.loginUrl === null || typeof provider.loginUrl === 'string').toBe(true);
        expect(Array.isArray(provider.domains)).toBe(true);
      });
    });

    it('should have no duplicate domains', () => {
      const { providers } = loadProviders();
      const allDomains = providers.flatMap(p => p.domains);
      const uniqueDomains = new Set(allDomains);
      
      expect(allDomains.length).toBe(uniqueDomains.size);
    });

    it('should have valid URLs for all providers', () => {
      const { providers } = loadProviders();
      
      providers.forEach(provider => {
        if (provider.loginUrl !== null) {
          expect(provider.loginUrl).toMatch(/^https:\/\/.+/);
        }
      });
    });
  });
});
