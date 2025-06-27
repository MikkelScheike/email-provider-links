import { secureLoadProviders, initializeSecurity, createSecurityMiddleware } from '../src/secure-loader';
import path from 'path';

describe('Secure Loader', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('secureLoadProviders', () => {
    it('should handle hash verification failure with logging', () => {
      // Mock console.error
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger hash verification failure
      const result = secureLoadProviders(
        path.join(__dirname, '../providers/emailproviders.json'),
        'invalid_hash'
      );

      expect(result.securityReport.hashVerification).toBe(false);
      expect(result.securityReport.securityLevel).toBe('CRITICAL');
      expect(mockConsoleError).toHaveBeenCalledWith('🚨 SECURITY WARNING: Hash verification failed!');
      expect(mockConsoleError).toHaveBeenCalledTimes(5); // All error messages
    });

    it('should handle URL validation failures with logging', () => {
      // Mock console.warn
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create a temp file with invalid URLs
      const invalidProviders = {
        providers: [{
          companyProvider: 'Test Provider',
          loginUrl: 'http://insecure-url.com', // Non-HTTPS URL
          domains: ['test.com']
        }]
      };
      
      // Mock readFileSync to return our invalid providers
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(JSON.stringify(invalidProviders));

      const result = secureLoadProviders();

      expect(result.securityReport.urlValidation).toBe(false);
      expect(result.securityReport.invalidUrls).toBeGreaterThan(0);
      expect(mockConsoleWarn).toHaveBeenCalled();
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('URL validation issues found'));
    });

    it('should suppress logging during tests', () => {
      // Set test environment
      process.env.NODE_ENV = 'test';
      
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Trigger both hash and URL validation failures
      const invalidProviders = {
        providers: [{
          companyProvider: 'Test Provider',
          loginUrl: 'http://insecure-url.com',
          domains: ['test.com']
        }]
      };
      
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(JSON.stringify(invalidProviders));

      const result = secureLoadProviders(undefined, 'invalid_hash');

      expect(result.securityReport.hashVerification).toBe(false);
      expect(result.securityReport.urlValidation).toBe(false);
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });
  });

  describe('Security Middleware', () => {
    it('should handle critical security issues', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      const mockSecurityCallback = jest.fn();

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
      const mockNext = jest.fn();
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
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const hashes = initializeSecurity();

      expect(hashes).toBeDefined();
      expect(mockConsoleLog).toHaveBeenCalledWith('🔐 Generating security hashes for email providers...');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Security Setup Instructions'));
    });
  });
});
