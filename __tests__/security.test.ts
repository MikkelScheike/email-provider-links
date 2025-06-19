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
} from '../src/security/url-validator';

import { 
  calculateHash,
  calculateFileHash,
  verifyProvidersIntegrity,
  verifyProvidersDataIntegrity,
  handleHashMismatch,
  recalculateHashes
} from '../src/security/hash-verifier';

import { 
  secureLoadProviders 
} from '../src/security/secure-loader';

import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('Security - URL Validation', () => {
  describe('validateEmailProviderUrl', () => {
    test('should allow valid HTTPS URLs from allowlisted domains', () => {
      const validUrls = [
        'https://mail.google.com/mail/',
        'https://outlook.office365.com',
        'https://login.yahoo.com',
        'https://mail.zoho.com',
        'https://www.fastmail.com'
      ];

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
  describe('secureLoadProviders', () => {
    const testProvidersPath = join(__dirname, 'test-secure-providers.json');
    const validTestData = {
      providers: [
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
      ]
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
      const result = secureLoadProviders(testProvidersPath, expectedHash);
      
      expect(result.success).toBe(true);
      expect(result.providers).toHaveLength(2);
      expect(result.securityReport.securityLevel).toBe('SECURE');
      expect(result.securityReport.hashVerification).toBe(true);
      expect(result.securityReport.urlValidation).toBe(true);
    });

    test('should detect hash mismatches', () => {
      const wrongHash = 'wrong_hash_value';
      const result = secureLoadProviders(testProvidersPath, wrongHash);
      
      expect(result.success).toBe(false);
      expect(result.securityReport.securityLevel).toBe('CRITICAL');
      expect(result.securityReport.hashVerification).toBe(false);
      expect(result.securityReport.issues.some(issue => 
        issue.includes('Hash verification failed')
      )).toBe(true);
    });

    test('should filter out invalid URLs', () => {
      const mixedTestData = {
        providers: [
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
        ]
      };

      writeFileSync(testProvidersPath, JSON.stringify(mixedTestData, null, 2));
      const expectedHash = calculateHash(JSON.stringify(mixedTestData, null, 2));
      
      const result = secureLoadProviders(testProvidersPath, expectedHash);
      
      expect(result.success).toBe(true);
      expect(result.providers).toHaveLength(1); // Only valid provider
      expect(result.providers[0].companyProvider).toBe('Gmail');
      expect(result.securityReport.securityLevel).toBe('WARNING');
      expect(result.securityReport.urlValidation).toBe(false);
    });

    test('should handle malformed JSON gracefully', () => {
      writeFileSync(testProvidersPath, '{ invalid json }');
      
      const result = secureLoadProviders(testProvidersPath, 'any_hash');
      
      expect(result.success).toBe(false);
      expect(result.securityReport.securityLevel).toBe('CRITICAL');
      expect(result.securityReport.issues.some(issue => 
        issue.includes('Failed to load providers file')
      )).toBe(true);
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

  test('should validate subdomain allowlist behavior', () => {
    // Should allow legitimate subdomains
    const validSubdomains = [
      'https://mail.gmail.com',
      'https://secure.outlook.office365.com',
      'https://login.mail.yahoo.com'
    ];

    validSubdomains.forEach(url => {
      const result = validateEmailProviderUrl(url);
      expect(result.isValid).toBe(true);
    });

    // Should reject suspicious subdomains
    const suspiciousSubdomains = [
      'https://fake.gmail.com.evil-site.com',
      'https://gmail.com.phishing-site.tk'
    ];

    suspiciousSubdomains.forEach(url => {
      const result = validateEmailProviderUrl(url);
      expect(result.isValid).toBe(false);
    });
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
  test('CRITICAL: production providers file must have correct hash', () => {
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
  
  test('CRITICAL: secure loader must pass with production file', () => {
    // This ensures the entire security system works with the real providers file
    const result = secureLoadProviders();
    
    expect(result.success).toBe(true);
    expect(result.securityReport.hashVerification).toBe(true);
    expect(result.securityReport.securityLevel).not.toBe('CRITICAL');
    expect(result.providers.length).toBeGreaterThan(60); // We should have 60+ providers
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

