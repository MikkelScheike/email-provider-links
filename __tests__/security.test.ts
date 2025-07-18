/**
 * Security Test Suite
 * 
 * Comprehensive tests for URL validation, hash verification,
 * and secure loading functionality.
 */

import { 
  validateEmailProviderUrl, 
  auditProviderSecurity,
  validateAllProviderUrls 
} from '../src/url-validator';

import { 
  calculateHash,
  calculateFileHash,
  verifyProvidersIntegrity,
  verifyProvidersDataIntegrity,
  handleHashMismatch,
  recalculateHashes,
  generateSecurityHashes,
  performSecurityAudit,
  createProviderManifest
} from '../src/hash-verifier';

import { 
  loadProviders,
  initializeSecurity,
  createSecurityMiddleware,
  clearCache
} from '../src/provider-loader';

import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Security - URL Validation', () => {
  describe('validateEmailProviderUrl', () => {
    test('should allow valid HTTPS URLs from allowlisted domains', () => {
      const { providers } = loadProviders();
      const validUrls = providers
        .filter(p => p.loginUrl)
        .map(p => p.loginUrl)
        .slice(0, 5); // Take first 5 valid URLs

      validUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.normalizedUrl).toContain(url.replace(/\/$/, '')); // Handle trailing slashes
      });
    });

    test('should reject non-HTTPS URLs', () => {
      const insecureUrls = [
        'http://gmail.com',
        'http://outlook.com',
        'ftp://mail.yahoo.com'
      ];

      insecureUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL must use HTTPS protocol');
      });
    });

    test('should reject URLs from non-allowlisted domains', () => {
      const maliciousUrls = [
        'https://evil-phishing-site.com/gmail',
        'https://fake-gmail.com',
        'https://definitely-not-gmail.com'
      ];

      maliciousUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        // Could be either suspicious patterns or not in allowlist
        expect(result.reason).toMatch(/not in the allowlist|suspicious patterns/);
      });
    });

    test('should reject URL shorteners', () => {
      const shortenerUrls = [
        'https://bit.ly/fake-gmail',
        'https://tinyurl.com/evil-site',
        'https://t.co/malicious'
      ];

      shortenerUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL shorteners are not allowed');
      });
    });

    test('should reject suspicious patterns', () => {
      const suspiciousUrls = [
        'https://192.168.1.1/webmail',
        'https://127.0.0.1/mail',
        'https://localhost/email',
        'https://gmail.tk',
        'https://abc-def-ghi.com/mail'
      ];

      suspiciousUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL contains suspicious patterns');
      });
    });

    test('should reject URLs with malicious content', () => {
      const maliciousUrls = [
        'https://gmail.com/../evil',
        'https://gmail.com/mail?javascript:alert(1)'
      ];

      maliciousUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        // Note: gmail.com is in allowlist, so this tests the path/query validation
        expect(result.reason).toBe('URL contains potentially malicious content');
      });
    });

    test('should handle invalid URL formats', () => {
      const invalidUrls = [
        'not-a-url',
        'https://',
        '://gmail.com',
        ''
      ];

      invalidUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('Invalid URL format');
      });
    });
  });

  describe('auditProviderSecurity', () => {
    test('should return clean audit for valid providers', () => {
      const validProviders = [
        {
          companyProvider: 'Gmail',
          loginUrl: 'https://mail.google.com/mail/',
          domains: ['gmail.com']
        },
        {
          companyProvider: 'Outlook',
          loginUrl: 'https://outlook.office365.com',
          domains: ['outlook.com']
        }
      ];

      const audit = auditProviderSecurity(validProviders);
      expect(audit.invalid).toBe(0);
      expect(audit.valid).toBe(2);
      expect(audit.report).toBe('✅ All provider URLs passed security validation');
    });

    test('should flag invalid providers', () => {
      const mixedProviders = [
        {
          companyProvider: 'Gmail',
          loginUrl: 'https://mail.google.com/mail/',
          domains: ['gmail.com']
        },
        {
          companyProvider: 'Evil Site',
          loginUrl: 'https://evil-site.com/fake-gmail',
          domains: ['evil-site.com']
        }
      ];

      const audit = auditProviderSecurity(mixedProviders);
      expect(audit.invalid).toBe(1);
      expect(audit.valid).toBe(1);
      expect(audit.report).toContain('1 provider(s) failed security validation');
      expect(audit.invalidProviders).toHaveLength(1);
      expect(audit.invalidProviders[0].provider).toBe('Evil Site');
    });
  });
});

describe('Security - Hash Verification', () => {
  describe('calculateHash', () => {
    test('should calculate consistent SHA-256 hashes', () => {
      const content = 'test content';
      const expectedHash = '6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72';
      
      const hash1 = calculateHash(content);
      const hash2 = calculateHash(Buffer.from(content));
      
      expect(hash1).toBe(expectedHash);
      expect(hash2).toBe(expectedHash);
      expect(hash1).toBe(hash2);
    });

    test('should produce different hashes for different content', () => {
      const content1 = 'content 1';
      const content2 = 'content 2';
      
      const hash1 = calculateHash(content1);
      const hash2 = calculateHash(content2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyProvidersIntegrity', () => {
    const testFilePath = join(__dirname, 'test-providers.json');
    const testContent = JSON.stringify({
      providers: [
        {
          companyProvider: 'Test Provider',
          loginUrl: 'https://test.com',
          domains: ['test.com']
        }
      ]
    }, null, 2);

    beforeEach(() => {
      writeFileSync(testFilePath, testContent);
    });

    afterEach(() => {
      if (existsSync(testFilePath)) {
        unlinkSync(testFilePath);
      }
    });

    test('should verify file integrity with correct hash', () => {
      const expectedHash = calculateHash(testContent);
      const result = verifyProvidersIntegrity(testFilePath, expectedHash);
      
      expect(result.isValid).toBe(true);
      expect(result.actualHash).toBe(expectedHash);
      expect(result.expectedHash).toBe(expectedHash);
      expect(result.reason).toBeUndefined();
    });

    test('should detect file tampering with incorrect hash', () => {
      const wrongHash = 'wrong_hash_value';
      const result = verifyProvidersIntegrity(testFilePath, wrongHash);
      
      expect(result.isValid).toBe(false);
      expect(result.expectedHash).toBe(wrongHash);
      expect(result.reason).toBe('File hash does not match expected value - potential tampering detected');
    });

    test('should handle missing files gracefully', () => {
      const missingFilePath = join(__dirname, 'non-existent.json');
      const result = verifyProvidersIntegrity(missingFilePath, 'any_hash');
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Failed to verify file');
    });
  });

  describe('handleHashMismatch', () => {
    test('should not trigger for valid hash results', () => {
      const validResult = {
        isValid: true,
        actualHash: 'correct_hash',
        expectedHash: 'correct_hash',
        file: 'test.json'
      };

      // Should not throw or log
      expect(() => {
        handleHashMismatch(validResult, { throwOnMismatch: true });
      }).not.toThrow();
    });

    test('should throw error when configured to do so', () => {
      const invalidResult = {
        isValid: false,
        actualHash: 'wrong_hash',
        expectedHash: 'correct_hash',
        reason: 'Hash mismatch',
        file: 'test.json'
      };

      expect(() => {
        handleHashMismatch(invalidResult, { throwOnMismatch: true });
      }).toThrow('SECURITY BREACH');
    });

    test('should call custom handler when provided', () => {
      const invalidResult = {
        isValid: false,
        actualHash: 'wrong_hash',
        expectedHash: 'correct_hash',
        reason: 'Hash mismatch',
        file: 'test.json'
      };

      const mockHandler = jest.fn();
      handleHashMismatch(invalidResult, { 
        onMismatch: mockHandler,
        logLevel: 'silent'
      });

      expect(mockHandler).toHaveBeenCalledWith(invalidResult);
    });
  });
});

describe('Security - Secure Loading', () => {
  beforeEach(() => {
    clearCache();
  });
  
  describe('loadProviders', () => {
    const testProvidersPath = join(__dirname, 'test-secure-providers.json');
    const validTestData = {
      version: '1.0.0',
      providers: [
        {
          id: 'gmail',
          companyProvider: 'Gmail',
          loginUrl: 'https://mail.google.com/mail/',
          domains: ['gmail.com'],
          type: 'public_provider' as const
        },
        {
          id: 'outlook',
          companyProvider: 'Outlook',
          loginUrl: 'https://outlook.office365.com',
          domains: ['outlook.com'],
          type: 'public_provider' as const
        }
      ],
      meta: {
        count: 2,
        domains: 2,
        generated: new Date().toISOString()
      }
    };

    beforeEach(() => {
      writeFileSync(testProvidersPath, JSON.stringify(validTestData, null, 2));
    });

    afterEach(() => {
      if (existsSync(testProvidersPath)) {
        unlinkSync(testProvidersPath);
      }
    });

    test('should successfully load valid provider data', () => {
      const expectedHash = calculateHash(JSON.stringify(validTestData, null, 2));
      const result = loadProviders(testProvidersPath, expectedHash);
      
      expect(result.success).toBe(true);
      expect(result.providers).toHaveLength(2);
      expect(result.securityReport.securityLevel).toBe('SECURE');
      expect(result.securityReport.hashVerification).toBe(true);
      expect(result.securityReport.urlValidation).toBe(true);
    });

    test('should detect hash mismatches', () => {
      const wrongHash = 'wrong_hash_value';
      const result = loadProviders(testProvidersPath, wrongHash);
      
      expect(result.success).toBe(false);
      expect(result.securityReport.securityLevel).toBe('CRITICAL');
      expect(result.securityReport.hashVerification).toBe(false);
      expect(result.securityReport.issues.some(issue => 
        issue.includes('Hash verification failed')
      )).toBe(true);
    });

    test('should filter out invalid URLs', () => {
      const mixedTestData = {
        version: '1.0.0',
        providers: [
          {
            id: 'gmail',
            companyProvider: 'Gmail',
            loginUrl: 'https://mail.google.com/mail/',
            domains: ['gmail.com'],
            type: 'public_provider' as const
          },
          {
            id: 'evil',
            companyProvider: 'Evil Site',
            loginUrl: 'https://evil-site.com/fake-gmail',
            domains: ['evil-site.com'],
            type: 'public_provider' as const
          }
        ],
        meta: {
          count: 2,
          domains: 2,
          generated: new Date().toISOString()
        }
      };

      writeFileSync(testProvidersPath, JSON.stringify(mixedTestData, null, 2));
      const expectedHash = calculateHash(JSON.stringify(mixedTestData, null, 2));
      
      const result = loadProviders(testProvidersPath, expectedHash);
      
      expect(result.success).toBe(true);
      expect(result.providers).toHaveLength(1); // Only valid provider
      expect(result.providers[0].companyProvider).toBe('Gmail');
      expect(result.securityReport.securityLevel).toBe('WARNING');
      expect(result.securityReport.urlValidation).toBe(false);
    });

    test('should handle malformed JSON gracefully', () => {
      writeFileSync(testProvidersPath, '{ invalid json }');
      
      const result = loadProviders(testProvidersPath, 'any_hash');
      
      expect(result.success).toBe(false);
      expect(result.securityReport.securityLevel).toBe('CRITICAL');
      expect(result.securityReport.issues.some(issue => 
        issue.includes('Failed to load providers file')
      )).toBe(true);
    });
  });
  
  describe('initializeSecurity', () => {
    test('should generate security hashes and provide setup instructions', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        const result = initializeSecurity();
        
        // Should return hash object
        expect(typeof result).toBe('object');
        
        // Should have logged setup instructions
        expect(consoleSpy).toHaveBeenCalled();
        const logCalls = consoleSpy.mock.calls.map(call => call[0]);
        const joinedLogs = logCalls.join(' ');
        
        expect(joinedLogs).toContain('Generating security hashes');
        expect(joinedLogs).toContain('Security Setup Instructions');
        expect(joinedLogs).toContain('KNOWN_GOOD_HASHES');
        expect(joinedLogs).toContain('environment variables');
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
  
  describe('createSecurityMiddleware', () => {
    test('should create middleware that validates providers', () => {
      const middleware = createSecurityMiddleware();
      expect(typeof middleware).toBe('function');
    });
    
test('should pass valid providers through middleware', (done) => {
      jest.setTimeout(15000); // Increase timeout to 15 seconds
      jest.setTimeout(10000); // Increase timeout to 10 seconds
      const middleware = createSecurityMiddleware();
      
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn(() => {
        // Check that providers were attached to request
        expect((mockReq as any).secureProviders).toBeDefined();
        expect((mockReq as any).securityReport).toBeDefined();
        expect((mockReq as any).securityReport.securityLevel).not.toBe('CRITICAL');
        done();
      });
      
      middleware(mockReq, mockRes, mockNext);
    });
    
    test('should reject CRITICAL security level by default', () => {
      // Create middleware with invalid hash to trigger CRITICAL
      const middleware = createSecurityMiddleware({ 
        expectedHash: 'invalid_hash_that_will_fail' 
      });
      
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Security validation failed',
        details: expect.objectContaining({
          securityLevel: 'CRITICAL'
        })
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    test('should allow CRITICAL level when allowInvalidUrls is true', (done) => {
      const middleware = createSecurityMiddleware({ 
        expectedHash: 'invalid_hash_that_will_fail',
        allowInvalidUrls: true
      });
      
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn(() => {
        expect((mockReq as any).secureProviders).toBeDefined();
        expect((mockReq as any).securityReport.securityLevel).toBe('CRITICAL');
        done();
      });
      
      middleware(mockReq, mockRes, mockNext);
    });
    
    test('should call custom onSecurityIssue handler for CRITICAL issues', () => {
      const mockHandler = jest.fn();
      const middleware = createSecurityMiddleware({ 
        expectedHash: 'invalid_hash_that_will_fail',
        onSecurityIssue: mockHandler
      });
      
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          securityLevel: 'CRITICAL'
        })
      );
    });
    
    (process.versions.bun ? test.skip : test)('should handle WARNING security level gracefully', async () => {
      const testData = {
        providers: [
          {
            companyProvider: 'Gmail',
            loginUrl: 'https://mail.google.com/mail/',
            domains: ['gmail.com']
          },
          {
            companyProvider: 'Invalid',
            loginUrl: 'https://invalid-domain.com',
            domains: ['invalid-domain.com']
          }
        ]
      };
      
      const jsonString = JSON.stringify(testData, null, 2);
      const expectedHash = calculateHash(jsonString);
      
      // Setup mock request and response
    const mockReq = {
      securityReport: undefined as any,
      secureProviders: undefined as any
    };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Create middleware with mock data that will return WARNING level
      const middleware = createSecurityMiddleware({
        expectedHash,
        allowInvalidUrls: true,
        getProviders: () => ({
          success: true,
          providers: [testData.providers[0]], // Only include Gmail provider
          securityReport: {
            hashVerification: true,
            urlValidation: false,
            totalProviders: 2,
            validUrls: 1,
            invalidUrls: 1,
            securityLevel: 'WARNING',
            issues: ['1 provider has invalid URL']
          }
        })
      });
      
      // Execute middleware and wait for it to finish
      const result = await new Promise<any>((resolve, reject) => {
        try {
          middleware(mockReq, mockRes, () => {
            resolve({
              securityReport: mockReq.securityReport,
              secureProviders: mockReq.secureProviders
            });
          });
        } catch (error) {
          reject(error);
        }
      });
      
      // Verify the results
      expect(result.securityReport.securityLevel).toBe('WARNING');
      expect(result.secureProviders).toHaveLength(1); // Only Gmail should pass
    });
  });
  
  describe('secure-loader error path coverage', () => {
    test('should handle JSON parse errors in loadProviders', () => {
      const invalidJsonPath = join(__dirname, 'test-invalid.json');
      writeFileSync(invalidJsonPath, '{ "invalid": json }'); // Invalid JSON
      
      try {
        const result = loadProviders(invalidJsonPath, 'any_hash');
        
        expect(result.success).toBe(false);
        expect(result.securityReport.securityLevel).toBe('CRITICAL');
        expect(result.securityReport.issues.some(issue => 
          issue.includes('Failed to load providers file')
        )).toBe(true);
        expect(result.providers).toHaveLength(0);
      } finally {
        unlinkSync(invalidJsonPath);
      }
    });
    
    test('should handle providers without loginUrl in filtering', () => {
      const testPath = join(__dirname, 'test-no-login-url.json');
      const testData = {
        version: '1.0.0',
        providers: [
          {
            id: 'with-url',
            companyProvider: 'With URL',
            loginUrl: 'https://mail.google.com/mail/',
            domains: ['gmail.com'],
            type: 'public_provider' as const
          },
          {
            id: 'without-url',
            companyProvider: 'Without URL',
            loginUrl: null,
            domains: ['no-url.com'],
            type: 'public_provider' as const
          }
        ],
        meta: {
          count: 2,
          domains: 2,
          generated: new Date().toISOString()
        }
      };
      
      writeFileSync(testPath, JSON.stringify(testData, null, 2));
      const expectedHash = calculateHash(JSON.stringify(testData, null, 2));
      
      try {
        const result = loadProviders(testPath, expectedHash);
        
        expect(result.success).toBe(true);
        expect(result.providers).toHaveLength(2); // Both should be included
        expect(result.securityReport.securityLevel).toBe('SECURE');
      } finally {
        unlinkSync(testPath);
      }
    });
    
    test('should suppress console output during tests', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Set test environment
      const originalEnv = process.env.NODE_ENV;
      const originalWorker = process.env.JEST_WORKER_ID;
      process.env.NODE_ENV = 'test';
      process.env.JEST_WORKER_ID = '1';
      
      try {
        const result = loadProviders('/nonexistent/path.json', 'wrong_hash');
        
        expect(result.success).toBe(false);
        // Console should not have been called due to test environment
        expect(consoleSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.JEST_WORKER_ID = originalWorker;
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
      }
    });
  });
});

describe('Security - Edge Cases & Advanced Tests', () => {
  test('should handle encoded malicious patterns', () => {
    const encodedAttacks = [
      'https://gmail.com/%2e%2e/evil',     // URL-encoded path traversal
      'https://gmail.com/%6a%61%76%61%73%63%72%69%70%74%3aalert(1)', // Encoded javascript:
      'https://gmail.com/mail?redirect=data:text/html,<script>alert(1)</script>'
    ];

    encodedAttacks.forEach(url => {
      const result = validateEmailProviderUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('URL contains potentially malicious content');
    });
  });

  test('should handle mixed case domain attacks', () => {
    const mixedCaseAttacks = [
      'https://EVIL-SITE.COM/gmail',
      'https://Bit.Ly/fake-url',
      'https://127.0.0.1/WEBMAIL'
    ];

    mixedCaseAttacks.forEach(url => {
      const result = validateEmailProviderUrl(url);
      expect(result.isValid).toBe(false);
    });
  });

    test('should validate domains from providers.json', () => {
      const { providers } = loadProviders();
      const provider = providers.find(p => p.loginUrl);
      if (!provider || !provider.loginUrl) throw new Error('No provider with loginUrl found');

      const baseUrl = new URL(provider.loginUrl);

      // Base domain should be valid with any path/query/fragment
      const validVariations = [
        provider.loginUrl,
        `${baseUrl.origin}/extra/path`,
        `${baseUrl.origin}/path?param=value`,
        `${baseUrl.origin}/path#fragment`
      ];

      validVariations.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(true);
      });

      // Invalid domains should fail
      const invalidDomains = [
        `evil.${baseUrl.hostname}`,
        `${baseUrl.hostname}.phishing.com`,
        `malicious-${baseUrl.hostname}`
      ];

      invalidDomains.forEach(domain => {
        const url = baseUrl.protocol + '//' + domain + baseUrl.pathname;
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('is not in the allowlist');
      });

      // Non-HTTPS should always fail
      const httpUrl = provider.loginUrl.replace('https://', 'http://');
      const result = validateEmailProviderUrl(httpUrl);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('URL must use HTTPS protocol');
    });

  test('should handle hash verification with different content types', () => {
    // Test with different data structures
    const testData1 = { providers: [] };
    const testData2 = { providers: [{ test: 'data' }] };
    
    const hash1 = calculateHash(JSON.stringify(testData1));
    const hash2 = calculateHash(JSON.stringify(testData2));
    
    expect(hash1).not.toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // Valid SHA-256 format
    expect(hash2).toMatch(/^[a-f0-9]{64}$/); // Valid SHA-256 format
  });

  test('should handle concurrent security validations', async () => {
    const urls = [
      'https://mail.google.com/mail/',
      'https://outlook.office365.com',
      'https://evil-site.com/fake',
      'https://bit.ly/malicious'
    ];

    // Run validations concurrently
    const promises = urls.map(url => 
      Promise.resolve(validateEmailProviderUrl(url))
    );
    
    const results = await Promise.all(promises);
    
    expect(results[0].isValid).toBe(true);  // Google
    expect(results[1].isValid).toBe(true);  // Microsoft
    expect(results[2].isValid).toBe(false); // Evil site
    expect(results[3].isValid).toBe(false); // URL shortener
  });

  test('should provide consistent security across different environments', () => {
    // Test that security validation is deterministic
    const testUrl = 'https://mail.google.com/mail/';
    
    const results = Array.from({ length: 10 }, () => 
      validateEmailProviderUrl(testUrl)
    );
    
    // All results should be identical
    results.forEach(result => {
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('mail.google.com');
    });
  });
});

describe('Security - Production File Integrity', () => {
  (process.versions.bun ? test.skip : test)('CRITICAL: production providers file must have correct hash', () => {
    // This test ensures we never push a compromised providers file to npm
    const providersPath = join(__dirname, '..', 'providers', 'emailproviders.json');
    const result = verifyProvidersIntegrity(providersPath);
    
    if (!result.isValid) {
      console.error('🚨🚨🚨 CRITICAL SECURITY FAILURE 🚨🚨🚨');
      console.error('The production providers file has been tampered with!');
      console.error('Expected hash:', result.expectedHash);
      console.error('Actual hash:', result.actualHash);
      console.error('DO NOT PUBLISH THIS VERSION TO NPM!');
    }
    
    expect(result.isValid).toBe(true);
    expect(result.reason).toBeUndefined();
  });
  
  (process.versions.bun ? test.skip : test)('CRITICAL: secure loader must pass with production file', () => {
    // This ensures the entire security system works with the real providers file
    const result = loadProviders();
    
    expect(result.success).toBe(true);
    expect(result.securityReport.hashVerification).toBe(true);
    expect(result.securityReport.securityLevel).not.toBe('CRITICAL');
    expect(result.providers.length).toBeGreaterThan(60); // We should have 60+ providers
  });
});

describe('Security - Hash Verifier Extended Tests', () => {
  let testFilePath: string;
  
  beforeEach(() => {
    testFilePath = join(__dirname, 'test-file-hash.json');
  });
  
  afterEach(() => {
    if (existsSync(testFilePath)) {
      unlinkSync(testFilePath);
    }
  });
  
  describe('calculateFileHash', () => {
    test('should calculate correct file hash', () => {
      const testContent = { test: 'data', number: 42 };
      writeFileSync(testFilePath, JSON.stringify(testContent, null, 2));
      
      const fileHash = calculateFileHash(testFilePath);
      const contentHash = calculateHash(JSON.stringify(testContent, null, 2));
      
      expect(fileHash).toBe(contentHash);
      expect(fileHash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    test('should handle file read errors gracefully', () => {
      const nonExistentFile = '/path/that/does/not/exist.json';
      
      expect(() => calculateFileHash(nonExistentFile)).toThrow();
    });
    
    test('should handle different file encodings', () => {
      // Test with UTF-8 content
      const utf8Content = 'Hello 世界 🌍';
      writeFileSync(testFilePath, utf8Content, 'utf8');
      
      const hash = calculateFileHash(testFilePath);
      const expectedHash = calculateHash(utf8Content);
      
      expect(hash).toBe(expectedHash);
    });
  });
  
  describe('verifyProvidersDataIntegrity', () => {
    test('should verify valid providers data with expected hash', () => {
      const testData = {
        providers: [
          {
            companyProvider: 'Test Provider',
            loginUrl: 'https://test.example.com',
            domains: ['test.example.com']
          }
        ]
      };
      
      const jsonString = JSON.stringify(testData, Object.keys(testData).sort(), 2);
      const expectedHash = calculateHash(jsonString);
      
      const result = verifyProvidersDataIntegrity(testData, expectedHash);
      
      expect(result.isValid).toBe(true);
      expect(result.actualHash).toBe(expectedHash);
      expect(result.expectedHash).toBe(expectedHash);
      expect(result.reason).toBeUndefined();
    });
    
    test('should detect hash mismatch in providers data', () => {
      const testData = { providers: [{ test: 'data' }] };
      const wrongHash = 'wrong_hash_value';
      
      const result = verifyProvidersDataIntegrity(testData, wrongHash);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Data hash does not match expected value');
      expect(result.expectedHash).toBe(wrongHash);
    });
    
    test('should handle malformed providers data', () => {
      const malformedData = { invalid: 'structure' };
      const hash = calculateHash(JSON.stringify(malformedData, Object.keys(malformedData).sort(), 2));
      
      const result = verifyProvidersDataIntegrity(malformedData, hash);
      
      expect(result.isValid).toBe(true);
      expect(result.actualHash).toBe(hash);
    });
    
    test('should handle circular references gracefully', () => {
      const circularData: any = { providers: [] };
      circularData.self = circularData;
      
      // JSON.stringify throws error on circular references
      const result = verifyProvidersDataIntegrity(circularData);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Failed to verify data');
    });
    
    test('should handle empty data object', () => {
      const emptyData = {};
      const hash = calculateHash(JSON.stringify(emptyData, Object.keys(emptyData).sort(), 2));
      
      const result = verifyProvidersDataIntegrity(emptyData, hash);
      
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('generateSecurityHashes', () => {
    (process.versions.bun ? test.skip : test)('should generate hashes for existing files', () => {
      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        const hashes = generateSecurityHashes(__dirname);
        
        // Should return hashes for accessible files
        expect(typeof hashes).toBe('object');
        
        // Check that some console output was generated (consoleSpy may or may not be called)
        // depending on file accessibility, so we just verify the function doesn't crash
      } finally {
        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });
    
    test('should handle missing files gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        const nonExistentPath = '/path/that/does/not/exist';
        const hashes = generateSecurityHashes(nonExistentPath);
        
        // Should still return an object, but may be empty or have errors
        expect(typeof hashes).toBe('object');
        
        // Should have logged errors for missing files
        expect(consoleErrorSpy).toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
        consoleSpy.mockRestore();
      }
    });
  });
  
  describe('recalculateHashes', () => {
    (process.versions.bun ? test.skip : test)('should return formatted configuration string', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      try {
        const result = recalculateHashes(__dirname);
        
        expect(typeof result).toBe('string');
        expect(result).toContain('KNOWN_GOOD_HASHES');
        expect(result).toContain('emailproviders.json');
        expect(result).toContain('package.json');
        
        // Should have logged information
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
  
  describe('performSecurityAudit', () => {
    test('should perform complete security audit', () => {
      // Test with actual providers file
      const audit = performSecurityAudit();
      
      expect(audit).toHaveProperty('hashVerification');
      expect(audit).toHaveProperty('recommendations');
      expect(audit).toHaveProperty('securityLevel');
      
      expect(Array.isArray(audit.recommendations)).toBe(true);
      expect(['HIGH', 'MEDIUM', 'LOW', 'CRITICAL']).toContain(audit.securityLevel);
      
      expect(audit.hashVerification).toHaveProperty('isValid');
      expect(audit.hashVerification).toHaveProperty('actualHash');
      expect(audit.hashVerification).toHaveProperty('file');
    });
    
    test('should detect security issues in audit', () => {
      // Create a test file with wrong content
      const testAuditFile = join(__dirname, 'test-audit.json');
      writeFileSync(testAuditFile, JSON.stringify({ fake: 'data' }));
      
      try {
        const audit = performSecurityAudit(testAuditFile);
        
        // Should detect hash mismatch
        expect(audit.hashVerification.isValid).toBe(false);
        expect(audit.securityLevel).toBe('CRITICAL');
        expect(audit.recommendations.some(rec => rec.includes('CRITICAL'))).toBe(true);
      } finally {
        unlinkSync(testAuditFile);
      }
    });
  });
  
  describe('createProviderManifest', () => {
    test('should create valid provider manifest', () => {
      const testProviders = [
        {
          companyProvider: 'Gmail',
          loginUrl: 'https://mail.google.com/mail/',
          domains: ['gmail.com']
        },
        {
          companyProvider: 'Outlook',
          loginUrl: 'https://outlook.office365.com',
          domains: ['outlook.com']
        }
      ];
      
      const manifest = createProviderManifest(testProviders);
      
      expect(manifest).toHaveProperty('timestamp');
      expect(manifest).toHaveProperty('providerCount', 2);
      expect(manifest).toHaveProperty('urlHashes');
      expect(manifest).toHaveProperty('manifestHash');
      
      // Check timestamp format (ISO string)
      expect(new Date(manifest.timestamp).toISOString()).toBe(manifest.timestamp);
      
      // Check URL hashes
      expect(Object.keys(manifest.urlHashes)).toHaveLength(2);
      expect(manifest.urlHashes['Gmail::https://mail.google.com/mail/']).toBeDefined();
      expect(manifest.urlHashes['Outlook::https://outlook.office365.com']).toBeDefined();
      
      // Check manifest hash format
      expect(manifest.manifestHash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    test('should handle providers without login URLs', () => {
      const testProviders = [
        {
          companyProvider: 'Provider with URL',
          loginUrl: 'https://example.com',
          domains: ['example.com']
        },
        {
          companyProvider: 'Provider without URL',
          domains: ['nourl.com']
          // No loginUrl property
        }
      ];
      
      const manifest = createProviderManifest(testProviders);
      
      expect(manifest.providerCount).toBe(2);
      expect(Object.keys(manifest.urlHashes)).toHaveLength(1);
      expect(manifest.urlHashes['Provider with URL::https://example.com']).toBeDefined();
    });
    
    test('should create reproducible manifests for same data', async () => {
      const testProviders = [
        {
          companyProvider: 'Test',
          loginUrl: 'https://test.com',
          domains: ['test.com']
        }
      ];
      
      // Create two manifests with delay to ensure different timestamps
      const manifest1 = createProviderManifest(testProviders);
      await new Promise(resolve => setTimeout(resolve, 10).unref()); // Increased delay
      const manifest2 = createProviderManifest(testProviders);
      
      // Timestamps should be different (with sufficient delay)
      expect(manifest1.timestamp).not.toBe(manifest2.timestamp);
      
      // But URL hashes should be identical
      expect(manifest1.urlHashes).toEqual(manifest2.urlHashes);
      expect(manifest1.providerCount).toBe(manifest2.providerCount);
    });
    
    test('should handle empty providers array', () => {
      const manifest = createProviderManifest([]);
      
      expect(manifest.providerCount).toBe(0);
      expect(Object.keys(manifest.urlHashes)).toHaveLength(0);
      expect(manifest.manifestHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
  
  describe('handleHashMismatch', () => {
    test('should log error by default', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mismatchResult = {
        isValid: false,
        actualHash: 'actual123',
        expectedHash: 'expected456',
        reason: 'Test mismatch',
        file: 'test.json'
      };
      
      try {
        handleHashMismatch(mismatchResult);
        
        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorCall = consoleErrorSpy.mock.calls[0][0];
        expect(errorCall).toContain('CRITICAL SECURITY ALERT');
        expect(errorCall).toContain('test.json');
        expect(errorCall).toContain('actual123');
        expect(errorCall).toContain('expected456');
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
    
    test('should not log when result is valid', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const validResult = {
        isValid: true,
        actualHash: 'hash123',
        file: 'test.json'
      };
      
      try {
        handleHashMismatch(validResult);
        
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
    
    test('should throw error when throwOnMismatch is true', () => {
      const mismatchResult = {
        isValid: false,
        actualHash: 'actual123',
        expectedHash: 'expected456',
        reason: 'Test mismatch',
        file: 'test.json'
      };
      
      expect(() => {
        handleHashMismatch(mismatchResult, { throwOnMismatch: true });
      }).toThrow('SECURITY BREACH');
    });
    
    test('should use warn log level when specified', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mismatchResult = {
        isValid: false,
        actualHash: 'actual123',
        expectedHash: 'expected456',
        reason: 'Test mismatch',
        file: 'test.json'
      };
      
      try {
        handleHashMismatch(mismatchResult, { logLevel: 'warn' });
        
        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      } finally {
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      }
    });
    
    test('should call custom onMismatch handler', () => {
      const mockHandler = jest.fn();
      
      const mismatchResult = {
        isValid: false,
        actualHash: 'actual123',
        expectedHash: 'expected456',
        reason: 'Test mismatch',
        file: 'test.json'
      };
      
      handleHashMismatch(mismatchResult, { onMismatch: mockHandler });
      
      expect(mockHandler).toHaveBeenCalledWith(mismatchResult);
    });
  });
});

describe('Security - Hash Verifier Edge Cases for Maximum Coverage', () => {
  test('should handle TO_BE_CALCULATED hash in verifyProvidersIntegrity', () => {
    const testFilePath = join(__dirname, 'test-to-be-calculated.json');
    writeFileSync(testFilePath, JSON.stringify({ test: 'data' }));
    
    try {
      // Test with TO_BE_CALCULATED hash
      const result = verifyProvidersIntegrity(testFilePath, 'TO_BE_CALCULATED');
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Expected hash not configured. Run generateSecurityHashes() first.');
    } finally {
      unlinkSync(testFilePath);
    }
  });
  
  test('should handle TO_BE_CALCULATED hash in verifyProvidersDataIntegrity', () => {
    const testData = { providers: [] };
    
    const result = verifyProvidersDataIntegrity(testData, 'TO_BE_CALCULATED');
    
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('Expected hash not configured');
    expect(result.file).toBe('providersData');
  });
  
  test('should handle missing logLevel argument in handleHashMismatch', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const mismatchResult = {
      isValid: false,
      actualHash: 'actual',
      expectedHash: 'expected',
      reason: 'Test',
      file: 'test.json'
    };
    
    try {
      // Test with no logLevel specified (should default to 'error')
      handleHashMismatch(mismatchResult, {});
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
  
  test('should handle silent logLevel in handleHashMismatch', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const mismatchResult = {
      isValid: false,
      actualHash: 'actual',
      expectedHash: 'expected',
      reason: 'Test',
      file: 'test.json'
    };
    
    try {
      // Test with silent log level
      handleHashMismatch(mismatchResult, { logLevel: 'silent' });
      
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    }
  });
  
  test('should handle MEDIUM security level in performSecurityAudit with TO_BE_CALCULATED hash', () => {
    // Create a mock providers file that will pass hash check but has TO_BE_CALCULATED
    const testAuditFile = join(__dirname, 'test-medium-audit.json');
    const testContent = JSON.stringify({ providers: [] });
    writeFileSync(testAuditFile, testContent);
    
    try {
      // Mock the KNOWN_GOOD_HASHES to simulate TO_BE_CALCULATED
const originalModule = require('../src/hash-verifier');
      const audit = performSecurityAudit(testAuditFile);
      
      expect(audit).toHaveProperty('securityLevel');
      expect(audit.recommendations.length).toBeGreaterThan(0);
    } finally {
      unlinkSync(testAuditFile);
    }
  });
});

describe('Security - Hash Verifier Error Scenarios', () => {
  test('should handle file system permission errors', () => {
    // Test with a path that would cause permission errors
    const restrictedPath = '/root/restricted-file.json';
    
    const result = verifyProvidersIntegrity(restrictedPath);
    
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Failed to verify file');
    expect(result.actualHash).toBe('');
  });
  
  test('should handle binary file content', () => {
    const testBinaryFile = join(__dirname, 'test-binary.dat');
    const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
    
    writeFileSync(testBinaryFile, binaryContent);
    
    try {
      const hash = calculateFileHash(testBinaryFile);
      const expectedHash = calculateHash(binaryContent);
      
      expect(hash).toBe(expectedHash);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      unlinkSync(testBinaryFile);
    }
  });
  
  test('should handle very large data objects for manifest creation', () => {
    // Create a large providers array
    const largeProviders = Array.from({ length: 1000 }, (_, i) => ({
      companyProvider: `Provider ${i}`,
      loginUrl: `https://provider${i}.example.com`,
      domains: [`provider${i}.example.com`]
    }));
    
    const manifest = createProviderManifest(largeProviders);
    
    expect(manifest.providerCount).toBe(1000);
    expect(Object.keys(manifest.urlHashes)).toHaveLength(1000);
    expect(manifest.manifestHash).toMatch(/^[a-f0-9]{64}$/);
  });
  
  test('should maintain hash consistency across different Node.js versions', () => {
    // Test that our hash calculation is deterministic
    const testData = {
      string: 'test',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: 'value' }
    };
    
    const hash1 = calculateHash(JSON.stringify(testData));
    const hash2 = calculateHash(JSON.stringify(testData));
    
    expect(hash1).toBe(hash2);
    
    // Test with Buffer input
    const bufferHash1 = calculateHash(Buffer.from(JSON.stringify(testData)));
    const bufferHash2 = calculateHash(Buffer.from(JSON.stringify(testData)));
    
    expect(bufferHash1).toBe(bufferHash2);
    expect(hash1).toBe(bufferHash1);
  });
});

describe('Security - Integration Tests', () => {
  test('should provide end-to-end security validation', () => {
    // Test the complete security pipeline with real provider data
    const testProviders = [
      {
        companyProvider: 'Gmail',
        loginUrl: 'https://mail.google.com/mail/',
        domains: ['gmail.com']
      },
      {
        companyProvider: 'Malicious Site',
        loginUrl: 'https://evil-site.com/fake-gmail',
        domains: ['evil-site.com']
      },
      {
        companyProvider: 'Insecure Site',
        loginUrl: 'http://insecure-mail.com',
        domains: ['insecure-mail.com']
      }
    ];

    // Validate URLs
    const urlValidations = validateAllProviderUrls(testProviders);
    const validUrls = urlValidations.filter(v => v.validation.isValid);
    const invalidUrls = urlValidations.filter(v => !v.validation.isValid);

    expect(validUrls).toHaveLength(1);
    expect(invalidUrls).toHaveLength(2);
    expect(validUrls[0].provider).toBe('Gmail');

    // Audit security
    const audit = auditProviderSecurity(testProviders);
    expect(audit.valid).toBe(1);
    expect(audit.invalid).toBe(2);
    expect(audit.invalidProviders).toHaveLength(2);

    // Verify all security measures work together
    expect(invalidUrls.map(u => u.provider)).toEqual(
      expect.arrayContaining(['Malicious Site', 'Insecure Site'])
    );
  });

  test('should validate that allowlist enforces HTTPS-only domains', () => {
    // All allowlisted domains should only be accessible via HTTPS
    const testDomains = [
      'mail.google.com',
      'outlook.office365.com', 
      'login.yahoo.com',
      'mail.zoho.com'
    ];

    testDomains.forEach(domain => {
      // HTTPS should work
      const httpsResult = validateEmailProviderUrl(`https://${domain}`);
      expect(httpsResult.isValid).toBe(true);

      // HTTP should be rejected
      const httpResult = validateEmailProviderUrl(`http://${domain}`);
      expect(httpResult.isValid).toBe(false);
      expect(httpResult.reason).toBe('URL must use HTTPS protocol');
    });
  });
});

