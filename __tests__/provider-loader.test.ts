import { loadProviders, initializeSecurity, createSecurityMiddleware, clearCache } from '../src/provider-loader';
import path from 'path';
import { readFileSync } from 'fs';

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: vi.fn((...args: Parameters<typeof actual.readFileSync>) => actual.readFileSync(...args))
  };
});

describe('Provider Loader', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.VITEST;
    // Clear cache to ensure tests run independently
    clearCache();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('loadProviders', () => {
    it('should handle hash verification failure without logging', () => {
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = loadProviders(
        path.join(__dirname, '../providers/emailproviders.json'),
        'invalid_hash'
      );

      expect(result.securityReport.hashVerification).toBe(false);
      expect(result.securityReport.securityLevel).toBe('CRITICAL');
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should handle URL validation failures without logging', () => {
      // Mock console.warn
      const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create a temp file with invalid URLs
      const invalidProviders = {
        version: '1.0.0',
        providers: [{
          id: 'test',
          companyProvider: 'Test Provider',
          loginUrl: 'http://insecure-url.com', // Non-HTTPS URL
          domains: ['test.com'],
          type: 'public_provider' as const
        }],
        meta: {
          count: 1,
          domains: 1,
          generated: new Date().toISOString()
        }
      };
      
      // Mock readFileSync to return our invalid providers
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(invalidProviders));

      const result = loadProviders();

      expect(result.securityReport.urlValidation).toBe(false);
      expect(result.securityReport.invalidUrls).toBeGreaterThan(0);
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it('should suppress logging during tests', () => {
      // Set test environment
      process.env.NODE_ENV = 'test';
      
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Trigger both hash and URL validation failures
      const invalidProviders = {
        version: '1.0.0',
        providers: [{
          id: 'test',
          companyProvider: 'Test Provider',
          loginUrl: 'http://insecure-url.com',
          domains: ['test.com'],
          type: 'public_provider' as const
        }],
        meta: {
          count: 1,
          domains: 1,
          generated: new Date().toISOString()
        }
      };
      
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(invalidProviders));

      const result = loadProviders(undefined, 'invalid_hash');

      expect(result.securityReport.hashVerification).toBe(false);
      expect(result.securityReport.urlValidation).toBe(false);
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });
  });

  describe('Security Middleware', () => {
    it('should handle critical security issues', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const mockNext = vi.fn();
      const mockSecurityCallback = vi.fn();

      const middleware = createSecurityMiddleware({
        expectedHash: 'invalid_hash',
        onSecurityIssue: mockSecurityCallback
      });

      middleware({}, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Security validation failed'
      }));
      expect(mockSecurityCallback).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow custom provider getter', () => {
      const mockNext = vi.fn();
      const mockReq = {};
      const mockProviders = {
        success: true,
        providers: [],
        securityReport: {
          securityLevel: 'SECURE',
          hashVerification: true,
          urlValidation: true,
          totalProviders: 0,
          validUrls: 0,
          invalidUrls: 0,
          issues: []
        }
      };

      const middleware = createSecurityMiddleware({
        getProviders: () => mockProviders
      });

      middleware(mockReq, {}, mockNext);

      expect(mockReq).toHaveProperty('secureProviders');
      expect(mockReq).toHaveProperty('securityReport');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('initializeSecurity', () => {
    it('should generate and log security hashes', () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const hashes = initializeSecurity();

      expect(hashes).toBeDefined();
      expect(mockConsoleLog).toHaveBeenCalledWith('Generating security hashes for email providers...');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Security setup'));
    });
  });
});
