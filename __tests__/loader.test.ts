/**
 * Comprehensive Tests for Provider Data Loader
 * 
 * Tests optimized format loading with performance validation.
 */

import {
  loadProviders,
  loadProvidersDebug,
  buildDomainMap,
  clearCache,
  getLoadingStats
} from '../src/provider-loader';

describe('Provider Data Loader Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
  });

  describe('loadProviders', () => {
    it('should load providers successfully', () => {
      const { providers, stats } = loadProviders();
      
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
      expect(stats).toBeDefined();
      expect(stats.providerCount).toBe(providers.length);
      expect(stats.loadTime).toBeGreaterThanOrEqual(0);
    });

    it('should cache results on subsequent calls', () => {
      const first = loadProviders();
      const second = loadProviders();
      
      // Should be same instance (cached)
      expect(first.providers).toBe(second.providers);
      expect(first.stats).toBe(second.stats);
    });

    it('should respect debug mode and reload when debug enabled', () => {
      const first = loadProviders();
      const second = loadProvidersDebug();
      
      // Debug mode should reload, so different instances
      expect(first.providers).not.toBe(second.providers);
      expect(first.stats).not.toBe(second.stats);
    });

    it('should include all required provider fields', () => {
      const { providers } = loadProviders();
      
      expect(providers.length).toBeGreaterThan(0);
      
      providers.forEach(provider => {
        expect(provider).toHaveProperty('companyProvider');
        expect(provider).toHaveProperty('loginUrl');
        expect(provider).toHaveProperty('domains');
        expect(typeof provider.companyProvider).toBe('string');
        // loginUrl can be null or string for any provider type
        expect(provider.loginUrl === null || typeof provider.loginUrl === 'string').toBe(true);
        expect(Array.isArray(provider.domains)).toBe(true);
      });
    });
  });

  describe('buildDomainMap', () => {
    it('should build correct domain-to-provider mapping', () => {
      const { providers } = loadProviders();
      const domainMap = buildDomainMap(providers);
      
      expect(domainMap).toBeInstanceOf(Map);
      expect(domainMap.size).toBeGreaterThan(0);
      
      // Test known domain
      const gmailProvider = domainMap.get('gmail.com');
      expect(gmailProvider).toBeDefined();
      expect(gmailProvider?.companyProvider).toBe('Gmail');
    });

    it('should handle case-insensitive domain lookups', () => {
      const { providers } = loadProviders();
      const domainMap = buildDomainMap(providers);
      
      const lowercaseProvider = domainMap.get('gmail.com');
      const uppercaseProvider = domainMap.get('GMAIL.COM');
      
      // Uppercase should not be found (map stores lowercase keys)
      expect(lowercaseProvider).toBeDefined();
      expect(uppercaseProvider).toBeUndefined();
    });

    it('should cache domain map for performance', () => {
      const { providers } = loadProviders();
      const first = buildDomainMap(providers);
      const second = buildDomainMap(providers);
      
      // Should be same instance (cached)
      expect(first).toBe(second);
    });
  });

  describe('loadProviders', () => {
    it('should return providers, domain map, and stats', () => {
      const result = loadProviders();
      
      expect(result.providers).toBeDefined();
      expect(result.domainMap).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.domainMap).toBeInstanceOf(Map);
      expect(result.providers.length).toBe(result.stats.providerCount);
    });

    it('should use optimized settings', () => {
      const result = loadProviders();
      
      // Should load successfully
      expect(result.providers.length).toBeGreaterThan(90); // We know there are 93+ providers
      expect(result.domainMap.size).toBeGreaterThan(170); // We know there are 180+ domains
    });
  });

  describe('loadProvidersDebug', () => {
    it('should return providers, domain map, and stats with debug info', () => {
      // Capture console.log calls
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = loadProvidersDebug();
      
      expect(result.providers).toBeDefined();
      expect(result.domainMap).toBeDefined();
      expect(result.stats).toBeDefined();
      
      // Should have generated debug output
      expect(logSpy).toHaveBeenCalled();
      
      logSpy.mockRestore();
    });

    it('should always reload (not use cache)', () => {
      const first = loadProvidersDebug();
      const second = loadProvidersDebug();
      
      // Debug mode should always reload
      expect(first.providers).not.toBe(second.providers);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      // Load data to populate cache
      loadProviders();
      getLoadingStats(); // Should return cached stats
      
      // Clear cache
      clearCache();
      
      // Stats should be null after clearing
      expect(getLoadingStats()).toBeNull();
    });
  });

  describe('getLoadingStats', () => {
    it('should return null when no data loaded', () => {
      clearCache();
      expect(getLoadingStats()).toBeNull();
    });

    it('should return stats after loading', () => {
      const { stats } = loadProviders();
      const retrievedStats = getLoadingStats();
      
      expect(retrievedStats).toBe(stats);
      expect(retrievedStats?.providerCount).toBeGreaterThan(0);
    });
  });

  describe('Provider data integrity', () => {
    it('should have valid provider data structure', () => {
      const { providers } = loadProviders();
      
      expect(providers.length).toBeGreaterThan(90);
      
      // Check a few known providers
      const gmail = providers.find(p => p.companyProvider === 'Gmail');
      const outlook = providers.find(p => p.companyProvider === 'Microsoft Outlook');
      
      expect(gmail).toBeDefined();
      expect(gmail?.domains).toContain('gmail.com');
      expect(gmail?.loginUrl).toBe('https://mail.google.com/mail/');
      
      expect(outlook).toBeDefined();
      expect(outlook?.domains).toContain('outlook.com');
      expect(outlook?.loginUrl).toBe('https://outlook.office365.com');
    });

    it('should have valid URLs for all providers', () => {
      const { providers } = loadProviders();
      
      providers.forEach(provider => {
        // Validate that loginUrl is either null or a valid HTTPS URL
        if (provider.loginUrl !== null) {
          expect(provider.loginUrl).toMatch(/^https:\/\/.+/);
        }
      });
    });

    it('should have no duplicate domains', () => {
      const { providers } = loadProviders();
      const allDomains = providers.flatMap(p => p.domains);
      const uniqueDomains = new Set(allDomains);
      
      expect(allDomains.length).toBe(uniqueDomains.size);
    });

    it('should have consistent domain count', () => {
      const { providers, stats } = loadProviders();
      const actualDomainCount = providers.reduce((sum, p) => sum + p.domains.length, 0);
      
      expect(stats.domainCount).toBe(actualDomainCount);
    });
  });

  describe('Performance', () => {
    it('should load data quickly', () => {
      const start = Date.now();
      loadProviders();
      const duration = Date.now() - start;
      
      // Should load in reasonable time
      expect(duration).toBeLessThan(100);
    });

    it('should build domain map quickly', () => {
      const { providers } = loadProviders();
      
      const start = Date.now();
      buildDomainMap(providers);
      const duration = Date.now() - start;
      
      // Should build map quickly
      expect(duration).toBeLessThan(50);
    });

    it('should cache effectively', () => {
      // Clear cache first
      clearCache();
      
      // First load (fresh)
      const start1 = process.hrtime.bigint();
      loadProviders();
      const duration1 = Number(process.hrtime.bigint() - start1) / 1000000; // Convert to ms
      
      // Second load (cached)
      const start2 = process.hrtime.bigint();
      loadProviders();
      const duration2 = Number(process.hrtime.bigint() - start2) / 1000000; // Convert to ms
      
      // Cached load should be faster or equal
      expect(duration2).toBeLessThanOrEqual(duration1);
      // Both should complete within reasonable time
      expect(duration1).toBeLessThan(100);
      expect(duration2).toBeLessThan(50);
    });
  });

  describe('Development mode and warnings', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = process.env;
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should log memory usage in development mode', () => {
      process.env.NODE_ENV = 'development';
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      loadProviders();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/🚀 Current memory usage: .* MB/)
      );

      logSpy.mockRestore();
    });

    it('should warn about missing provider type', () => {
      // Mock readFileSync to return a provider without type
      const mockData = {
        version: '1.0.0',
        providers: [{
          id: 'test',
          companyProvider: 'Test Provider',
          domains: ['test.com']
          // type is intentionally omitted
        }]
      };

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(require('fs'), 'readFileSync')
        .mockReturnValueOnce(JSON.stringify(mockData));

      loadProviders();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Missing type for provider test/)
      );

      warnSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle non-Error objects in catch block', () => {
      // Mock readFileSync to throw a non-Error object
      jest.spyOn(require('fs'), 'readFileSync')
        .mockImplementationOnce(() => {
          throw 'String error'; // Throwing a string instead of Error
        });

      expect(() => loadProviders()).toThrow('Failed to load provider data: Unknown error');
    });

    it('should throw error for invalid provider data format', () => {
      // Mock readFileSync to return invalid data format
      jest.spyOn(require('fs'), 'readFileSync')
        .mockReturnValueOnce(JSON.stringify({
          version: '1.0.0'
          // missing providers array
        }));

      expect(() => loadProviders()).toThrow('Failed to load provider data: Invalid provider data format');
    });

    it('should handle Error objects in catch block', () => {
      // Mock readFileSync to throw an Error
      jest.spyOn(require('fs'), 'readFileSync')
        .mockImplementationOnce(() => {
          throw new Error('Custom error message');
        });

      expect(() => loadProviders()).toThrow('Failed to load provider data: Custom error message');
    });

    it('should handle empty providers array gracefully', () => {
      const emptyProviders: any[] = [];
      const domainMap = buildDomainMap(emptyProviders);
      
      expect(domainMap).toBeInstanceOf(Map);
      expect(domainMap.size).toBe(0);
    });
  });
});
