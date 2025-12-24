import {
  getEmailProvider,
  getEmailProviderSync,
  normalizeEmail,
  emailsMatch,
  EmailProviderResult,
  Config
} from '../src/api';

describe('Email Provider API Tests', () => {
  describe('getEmailProvider (async)', () => {
    it('should detect Gmail successfully', async () => {
      const result = await getEmailProvider('user@gmail.com');
      
      expect(result.provider).not.toBeNull();
      expect(result.provider?.companyProvider).toBe('Gmail');
      expect(result.provider?.loginUrl).toBe('https://mail.google.com/mail/');
      expect(result.detectionMethod).toBe('domain_match');
      expect(result.error).toBeUndefined();
    });

    it('should detect Microsoft Outlook successfully', async () => {
      const result = await getEmailProvider('user@outlook.com');
      
      expect(result.provider).not.toBeNull();
      expect(result.provider?.companyProvider).toBe('Microsoft Outlook');
      expect(result.provider?.loginUrl).toBe('https://outlook.office365.com');
      expect(result.detectionMethod).toBe('domain_match');
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid email with rich error context', async () => {
      const result = await getEmailProvider('invalid-email');
      
      expect(result.provider).toBeNull();
      expect('loginUrl' in result).toBe(false); // Simplified response doesn't have top-level loginUrl
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('INVALID_EMAIL');
      expect(result.error?.message).toBe('Invalid email format');
    });

    it('should handle empty email with error context', async () => {
      const result = await getEmailProvider('');
      
      expect(result.provider).toBeNull();
      expect('loginUrl' in result).toBe(false); // Simplified response doesn't have top-level loginUrl
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('INVALID_EMAIL');
      expect(result.error?.message).toBe('Email address is required and must be a string');
    });

    it('should handle non-string input with error context', async () => {
      const result = await getEmailProvider(null as any);
      
      expect(result.provider).toBeNull();
      expect('loginUrl' in result).toBe(false); // Simplified response doesn't have top-level loginUrl
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('INVALID_EMAIL');
      expect(result.error?.message).toBe('Email address is required and must be a string');
    });

    it('should handle unknown domain with error context', async () => {
      const result = await getEmailProvider('user@completely-unknown-domain-12345.com');
      
      expect(result.provider).toBeNull();
      expect('loginUrl' in result).toBe(false); // Simplified response doesn't have top-level loginUrl
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('UNKNOWN_DOMAIN');
      expect(result.error?.message).toContain('No email provider found for domain');
    }, 10000);

    it('should detect business domains via DNS', async () => {
      // This test might be flaky depending on network, but let's try microsoft.com
      const result = await getEmailProvider('user@microsoft.com');
      
      // Should either detect Microsoft 365 or provide error context
      if (result.provider) {
        expect(result.provider.companyProvider).toBe('Microsoft 365 (Business)');
        expect(result.detectionMethod).toBe('mx_record');
      } else {
        expect(result.error).toBeDefined();
        expect(['DNS_TIMEOUT', 'UNKNOWN_DOMAIN', 'NETWORK_ERROR']).toContain(result.error?.type);
      }
    }, 10000);

    it('should handle custom timeout parameter', async () => {
      const result = await getEmailProvider('user@gmail.com', 1000);
      
      expect(result.provider).not.toBeNull();
      expect(result.provider?.companyProvider).toBe('Gmail');
    });
  });

  describe('getEmailProviderSync (synchronous)', () => {
    it('should detect Gmail successfully', () => {
      const result = getEmailProviderSync('user@gmail.com');
      
      expect(result.provider).not.toBeNull();
      expect(result.provider?.companyProvider).toBe('Gmail');
      expect(result.provider?.loginUrl).toBe('https://mail.google.com/mail/');
      expect(result.detectionMethod).toBe('domain_match');
      expect(result.error).toBeUndefined();
    });

    it('should detect Yahoo Mail successfully', () => {
      const result = getEmailProviderSync('user@yahoo.com');
      
      expect(result.provider).not.toBeNull();
      expect(result.provider?.companyProvider).toBe('Yahoo Mail');
      expect(result.provider?.loginUrl).toBe('https://login.yahoo.com');
      expect(result.detectionMethod).toBe('domain_match');
      expect(result.error).toBeUndefined();
    });

    it('should handle invalid email with error context', () => {
      const result = getEmailProviderSync('invalid-email');
      
      expect(result.provider).toBeNull();
      expect('loginUrl' in result).toBe(false); // Simplified response doesn't have top-level loginUrl
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('INVALID_EMAIL');
      expect(result.error?.message).toBe('Invalid email format');
    });

    it('should handle unknown domain with specific sync error', () => {
      const result = getEmailProviderSync('user@unknown-domain.com');
      
      expect(result.provider).toBeNull();
      expect('loginUrl' in result).toBe(false); // Simplified response doesn't have top-level loginUrl
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('UNKNOWN_DOMAIN');
      expect(result.error?.message).toContain('sync mode - business domains not supported');
    });

    it('should handle empty string with error context', () => {
      const result = getEmailProviderSync('');
      
      expect(result.provider).toBeNull();
      expect(result.error?.type).toBe('INVALID_EMAIL');
    });
  });

  describe('normalizeEmail', () => {
    it('should normalize Gmail addresses correctly', () => {
      expect(normalizeEmail('U.S.E.R+work@GMAIL.COM')).toBe('user@gmail.com');
      expect(normalizeEmail('user+newsletter@gmail.com')).toBe('user@gmail.com');
      expect(normalizeEmail('u.s.e.r@gmail.com')).toBe('user@gmail.com');
    });

    it('should normalize Outlook addresses correctly', () => {
      expect(normalizeEmail('user+newsletter@outlook.com')).toBe('user@outlook.com');
      expect(normalizeEmail('USER@OUTLOOK.COM')).toBe('user@outlook.com');
    });

    it('should handle case normalization', () => {
      expect(normalizeEmail('USER@GMAIL.COM')).toBe('user@gmail.com');
      expect(normalizeEmail('User@Yahoo.Com')).toBe('user@yahoo.com');
    });
  });

  describe('emailsMatch', () => {
    it('should match Gmail aliases correctly', () => {
      expect(emailsMatch('user@gmail.com', 'u.s.e.r@gmail.com')).toBe(true);
      expect(emailsMatch('user@gmail.com', 'user+work@gmail.com')).toBe(true);
      expect(emailsMatch('user@gmail.com', 'U.S.E.R+newsletter@GMAIL.COM')).toBe(true);
    });

    it('should match Outlook aliases correctly', () => {
      expect(emailsMatch('user@outlook.com', 'user+work@outlook.com')).toBe(true);
      expect(emailsMatch('user@outlook.com', 'USER@OUTLOOK.COM')).toBe(true);
    });

    it('should not match different users', () => {
      expect(emailsMatch('user@gmail.com', 'other@gmail.com')).toBe(false);
      expect(emailsMatch('user@gmail.com', 'user@yahoo.com')).toBe(false);
    });

    it('should handle invalid emails gracefully', () => {
      expect(emailsMatch('invalid-email', 'user@gmail.com')).toBe(false);
      expect(emailsMatch('user@gmail.com', 'invalid-email')).toBe(false);
      expect(emailsMatch('invalid-email', 'also-invalid')).toBe(false);
    });
  });

  describe('Config constants', () => {
    it('should have correct configuration values', () => {
      expect(Config.DEFAULT_DNS_TIMEOUT).toBe(5000);
      expect(Config.MAX_DNS_REQUESTS_PER_MINUTE).toBe(10);
expect(Config.SUPPORTED_PROVIDERS_COUNT).toBe(130);
      expect(Config.SUPPORTED_DOMAINS_COUNT).toBe(218);
    });
  });

  describe('Error handling consistency', () => {
    it('should return consistent error structure', async () => {
      const asyncResult = await getEmailProvider('invalid-email');
      const syncResult = getEmailProviderSync('invalid-email');
      
      expect(asyncResult.error?.type).toBe('INVALID_EMAIL');
      expect(syncResult.error?.type).toBe('INVALID_EMAIL');
      expect(asyncResult.error?.message).toBe('Invalid email format');
      expect(syncResult.error?.message).toBe('Invalid email format');
    });

    it('should provide detailed error messages', async () => {
      const emptyResult = await getEmailProvider('');
      const invalidResult = await getEmailProvider('not-an-email');
      const unknownResult = await getEmailProvider('user@completely-unknown-domain.com');
      
      expect(emptyResult.error?.message).toContain('required');
      expect(invalidResult.error?.message).toContain('Invalid email format');
      expect(unknownResult.error?.message).toContain('No email provider found');
    }, 10000);
  });

  describe('Result interface compliance', () => {
    it('should return all required fields', async () => {
      const result = await getEmailProvider('user@gmail.com');
      
      // Required fields (simplified response)
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('email');
      expect(result.provider).toHaveProperty('loginUrl');
      
      // Optional fields should be defined when applicable
      expect(result).toHaveProperty('detectionMethod');
      expect(result.detectionMethod).toBeDefined();
    });

    it('should include email in all results', async () => {
      const valid = await getEmailProvider('user@gmail.com');
      const invalid = await getEmailProvider('invalid-email');
      
      expect(valid.email).toBe('user@gmail.com');
      expect(invalid.email).toBe('invalid-email');
    });
  });

  describe('Advanced error handling and edge cases', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.restoreAllMocks();
    });

    it('should handle rate limiting errors', async () => {
      // Reset the modules to ensure clean mock state
      jest.resetModules();
      
      // Mock the dependency to simulate rate limiting
      jest.doMock('../src/concurrent-dns', () => ({
        detectProviderConcurrent: jest.fn().mockRejectedValueOnce(
          new Error('Rate limit exceeded. Try again in 60 seconds')
        )
      }));
      
      // Re-import the function after mocking
      const { getEmailProvider } = require('../src/index');
      
      const result = await getEmailProvider('user@microsoft.com');
      expect(result.error?.type).toBe('RATE_LIMITED');
      expect(result.error?.retryAfter).toBe(60);
      
      // Clear mock
      jest.dontMock('../src/concurrent-dns');
    });

    it('should handle DNS timeout errors', async () => {
      // Reset the modules to ensure clean mock state
      jest.resetModules();
      
      // Mock the dependency to simulate timeout
      jest.doMock('../src/concurrent-dns', () => ({
        detectProviderConcurrent: jest.fn().mockRejectedValueOnce(
          new Error('timeout')
        )
      }));
      
      // Re-import the function after mocking
      const { getEmailProvider } = require('../src/index');
      
      const result = await getEmailProvider('user@microsoft.com', 2000);
      expect(result.error?.type).toBe('DNS_TIMEOUT');
      expect(result.error?.message).toContain('2000ms');
      
      // Clear mock
      jest.dontMock('../src/concurrent-dns');
    });

    it('should handle proxy service detection', async () => {
      // Reset the modules to ensure clean mock state
      jest.resetModules();
      
      // Mock the dependencies
      jest.doMock('../src/concurrent-dns', () => ({
        detectProviderConcurrent: jest.fn().mockResolvedValueOnce({
          provider: null,
          proxyService: 'Cloudflare',
          detectionMethod: 'proxy_detected',
          timing: { mx: 100, txt: 100, total: 200 },
          confidence: 0.9
        })
      }));
      
      // Re-import the function after mocking
      const { getEmailProvider } = require('../src/index');
      
      const result = await getEmailProvider('user@microsoft.com', { extended: true });
      expect(result.proxyService).toBe('Cloudflare');
      expect(result.detectionMethod).toBe('proxy_detected');
      
      // Clear mock
      jest.dontMock('../src/concurrent-dns');
    });

    it('should handle network errors gracefully', async () => {
      // Reset the modules to ensure clean mock state
      jest.resetModules();
      
      // Mock the dependencies
      jest.doMock('../src/concurrent-dns', () => ({
        detectProviderConcurrent: jest.fn().mockRejectedValueOnce(
          new Error('Network error')
        )
      }));
      
      // Re-import the function after mocking
      const { getEmailProvider } = require('../src/index');
      
      const result = await getEmailProvider('user@microsoft.com');
      expect(result.error?.type).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network error');
      
      // Clear mock
      jest.dontMock('../src/concurrent-dns');
    });

    it('should handle various invalid email formats', () => {
      // Test null input
      expect(getEmailProviderSync(null as any).error?.type).toBe('INVALID_EMAIL');
      expect(getEmailProviderSync(null as any).error?.message).toBe('Email address is required and must be a string');
      
      // Test undefined input
      expect(getEmailProviderSync(undefined as any).error?.type).toBe('INVALID_EMAIL');
      expect(getEmailProviderSync(undefined as any).error?.message).toBe('Email address is required and must be a string');
      
      // Test non-string input
      expect(getEmailProviderSync(42 as any).error?.type).toBe('INVALID_EMAIL');
      expect(getEmailProviderSync(42 as any).error?.message).toBe('Email address is required and must be a string');
      
      // Test empty string
      expect(getEmailProviderSync('').error?.type).toBe('INVALID_EMAIL');
      expect(getEmailProviderSync('').error?.message).toBe('Email address is required and must be a string');
      
      // Test invalid email with no domain part
      expect(getEmailProviderSync('test@').error?.type).toBe('INVALID_EMAIL');
      expect(getEmailProviderSync('test@').error?.message).toBe('Invalid email format');
    });
  });

  describe('Performance and reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const emails = [
        'user1@gmail.com',
        'user2@outlook.com',
        'user3@yahoo.com',
        'user4@proton.me'
      ];
      
      const results = await Promise.all(
        emails.map(email => getEmailProvider(email))
      );
      
      results.forEach((result, index) => {
        expect(result.email).toBe(emails[index]);
        expect(result.provider).not.toBeNull();
      });
    });

    it('should be fast for known domains', async () => {
      const start = Date.now();
      await getEmailProvider('user@gmail.com');
      const duration = Date.now() - start;
      
      // Should be fast for known domains (domain lookup, not DNS)
      expect(duration).toBeLessThan(100);
    });

    it('should handle synchronous calls efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        getEmailProviderSync(`user${i}@gmail.com`);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
