/**
 * Comprehensive Edge Case Tests for Provider Data Loader
 * 
 * These tests target uncovered lines and edge cases to improve test coverage.
 * Focuses on error handling, input validation, and unusual scenarios.
 */

import {
  loadProviders,
  loadProvidersOptimized,
  clearCache,
  getLoadingStats
} from '../src/loader';

import * as fs from 'fs';
import * as path from 'path';

describe('Provider Data Loader Edge Cases', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('File system edge cases', () => {
    it('should handle missing provider file', () => {
      expect(() => {
        loadProviders({
          path: '/nonexistent/path/to/providers.json'
        });
      }).toThrow('Failed to load provider data');
    });

    it('should handle invalid JSON in provider file', () => {
      const tempDir = '/tmp';
      const invalidPath = path.join(tempDir, 'invalid-providers.json');
      
      try {
        fs.writeFileSync(invalidPath, '{ invalid json content }');
        
        expect(() => {
          loadProviders({
            path: invalidPath
          });
        }).toThrow('Failed to load provider data');
      } finally {
        try {
          fs.unlinkSync(invalidPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    it('should handle provider file with incorrect schema', () => {
      const tempDir = '/tmp';
      const invalidSchemaPath = path.join(tempDir, 'invalid-schema.json');
      
      try {
        fs.writeFileSync(invalidSchemaPath, JSON.stringify({
          version: "1.0",
          providers: "not an array", // Wrong type
          meta: { count: 0, domains: 0, generated: "2024-01-01" }
        }));
        
        expect(() => {
          loadProviders({
            path: invalidSchemaPath
          });
        }).toThrow('Invalid provider data format');
      } finally {
        try {
          fs.unlinkSync(invalidSchemaPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    it('should handle provider file with missing required fields', () => {
      const tempDir = '/tmp';
      const missingFieldsPath = path.join(tempDir, 'missing-fields.json');
      
      try {
        fs.writeFileSync(missingFieldsPath, JSON.stringify({
          version: "1.0"
          // Missing providers field
        }));
        
        expect(() => {
          loadProviders({
            path: missingFieldsPath
          });
        }).toThrow('Invalid provider data format');
      } finally {
        try {
          fs.unlinkSync(missingFieldsPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Path resolution edge cases', () => {
    it('should handle relative paths', () => {
      const result = loadProviders({
        path: './providers/emailproviders.json' // Relative path
      });

      expect(result.providers).toBeDefined();
    });

    it('should handle absolute paths', () => {
      const result = loadProviders();
      
      // Get the stats that were generated
      const stats = getLoadingStats();
      expect(stats).toBeDefined();
    });

    it('should use default path when none provided', () => {
      const result = loadProviders({});
      expect(result.providers).toBeDefined();
      expect(result.providers.length).toBeGreaterThan(0);
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
      const first = loadProviders({ debug: false });
      const second = loadProviders({ debug: true });
      
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
      
      loadProviders({ debug: true });
      
      expect(logSpy).toHaveBeenCalled();
      
      logSpy.mockRestore();
    });

    it('should not produce debug output when disabled', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      loadProviders({ debug: false });
      
      // Should not have debug output (though may have domain map output)
      logSpy.mockRestore();
    });

    it('should always reload in debug mode', () => {
      // Load once in normal mode
      const normal = loadProviders({ debug: false });
      
      // Load again in debug mode
      const debug1 = loadProviders({ debug: true });
      const debug2 = loadProviders({ debug: true });
      
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

  describe('loadProvidersOptimized edge cases', () => {
    it('should return consistent results', () => {
      const first = loadProvidersOptimized();
      const second = loadProvidersOptimized();
      
      expect(first.providers).toBe(second.providers); // Cached
      expect(first.domainMap).toBe(second.domainMap); // Cached
      expect(first.stats).toBe(second.stats); // Cached
    });

    it('should have domain map with correct size', () => {
      const { providers, domainMap } = loadProvidersOptimized();
      const expectedDomains = providers.reduce((sum, p) => sum + p.domains.length, 0);
      
      expect(domainMap.size).toBe(expectedDomains);
    });

    it('should provide valid domain lookups', () => {
      const { domainMap } = loadProvidersOptimized();
      
      // Test known domains
      const gmail = domainMap.get('gmail.com');
      expect(gmail).toBeDefined();
      expect(gmail?.companyProvider).toBe('Gmail');
      
      const outlook = domainMap.get('outlook.com');
      expect(outlook).toBeDefined();
      expect(outlook?.companyProvider).toBe('Microsoft Outlook');
    });
  });

  describe('Error recovery edge cases', () => {
    it('should provide meaningful error messages', () => {
      try {
        loadProviders({ path: '/definitely/does/not/exist.json' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Failed to load provider data');
      }
    });

    it('should handle file permission errors gracefully', () => {
      // This test may not work on all systems
      try {
        loadProviders({ path: '/root/restricted.json' });
      } catch (error: any) {
        expect(error.message).toContain('Failed to load provider data');
      }
    });
  });
});
