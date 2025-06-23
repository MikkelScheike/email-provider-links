/**
 * URL Validator Coverage Tests
 * 
 * Additional tests to cover uncovered lines in url-validator.ts
 * Lines 154, 228, 236 and other edge cases
 */

import {
  validateEmailProviderUrl,
  validateAllProviderUrls,
  auditProviderSecurity
} from '../src/security/url-validator';

describe('URL Validator - Coverage Tests', () => {
  describe('validateEmailProviderUrl - Edge Cases', () => {
    it('should handle malformed URLs that cannot be decoded (line ~164)', () => {
      // Test URL with invalid URL encoding that throws during decodeURIComponent
      const malformedUrl = 'https://gmail.com/%GG%GG%GG';
      const result = validateEmailProviderUrl(malformedUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('URL contains potentially malicious content');
      expect(result.domain).toBe('unknown');
    });

    it('should detect URL shorteners (line 228)', () => {
      // Test URL shortener domains that should be rejected
      const shortenerUrls = [
        'https://bit.ly/fake-gmail',
        'https://tinyurl.com/malicious-link',
        'https://t.co/suspicious',
        'https://short.link/phishing',
        'https://ow.ly/badlink',
        'https://is.gd/danger',
        'https://buff.ly/evil'
      ];

      shortenerUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL shorteners are not allowed');
      });
    });

    it('should reject non-allowlisted domains (line 236)', () => {
      // Test domains that are not in the allowlist
      const nonAllowlistedUrls = [
        'https://evil-phishing-site.com/gmail',
        'https://fake-google.com/mail',
        'https://not-in-allowlist.com/email'
      ];

      nonAllowlistedUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        // Could be rejected for allowlist or suspicious patterns
        expect(result.reason).toMatch(/(is not in the allowlist|URL contains suspicious patterns)/);
      });
    });

    it('should detect suspicious TLD patterns', () => {
      const suspiciousTlds = [
        'https://fake-gmail.tk/login',
        'https://phishing.ml/mail',
        'https://scam.ga/webmail',
        'https://evil.cf/email'
      ];

      suspiciousTlds.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL contains suspicious patterns');
      });
    });

    it('should detect IP address patterns', () => {
      const ipUrls = [
        'https://192.168.1.1/webmail',
        'https://10.0.0.1/email',
        'https://172.16.0.1/mail',
        'https://127.0.0.1/login'
      ];

      ipUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL contains suspicious patterns');
      });
    });

    it('should detect localhost patterns', () => {
      const localhostUrls = [
        'https://localhost/webmail',
        'https://LOCALHOST/mail',
        'https://LocalHost/email'
      ];

      localhostUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL contains suspicious patterns');
      });
    });

    it('should detect random subdomain patterns', () => {
      const randomSubdomains = [
        'https://abc-def-123.evil.com/mail',
        'https://xyz-890-ghi.phishing.tk/login'
      ];

      randomSubdomains.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL contains suspicious patterns');
      });
    });

    it('should handle subdomain allowlist matching', () => {
      // Test that subdomains of allowed domains are accepted
      const subdomainUrls = [
        'https://secure.outlook.office365.com/mail',
        'https://accounts.google.com/signin',
        'https://mail.yahoo.com/login'
      ];

      subdomainUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.domain).toBeDefined();
        expect(result.normalizedUrl).toBeDefined();
      });
    });

    it('should detect encoded path traversal attacks', () => {
      const pathTraversalUrls = [
        'https://mail.google.com/../../../etc/passwd',
        'https://outlook.office365.com/mail%2e%2e%2fetc%2fpasswd',
        'https://mail.yahoo.com/login%2e%2e%2f%2e%2e%2fconfig'
      ];

      pathTraversalUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL contains potentially malicious content');
      });
    });

    it('should detect JavaScript injection in URLs', () => {
      const jsInjectionUrls = [
        'https://mail.google.com/mail?javascript:alert(1)',
        'https://outlook.office365.com/login?javascript=malicious',
        'https://mail.yahoo.com/webmail?param=data:text/html,malicious'
      ];

      jsInjectionUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toBe('URL contains potentially malicious content');
      });
    });

    it('should handle URL constructor errors gracefully', () => {
      const invalidUrls = [
        'not-a-url-at-all',
        'htp://missing-t.com',
        'https://',
        ''
      ];

      invalidUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toMatch(/(Invalid URL format|URL must use HTTPS protocol)/);
      });
    });
  });

  describe('validateAllProviderUrls', () => {
    it('should validate all providers with loginUrl', () => {
      const providers = [
        {
          companyProvider: 'Gmail',
          loginUrl: 'https://mail.google.com/mail/'
        },
        {
          companyProvider: 'Evil Provider',
          loginUrl: 'https://evil-site.com/mail'
        },
        {
          companyProvider: 'No URL Provider'
          // No loginUrl
        }
      ];

      const results = validateAllProviderUrls(providers);
      
      expect(results).toHaveLength(2); // Only providers with loginUrl
      expect(results[0].provider).toBe('Gmail');
      expect(results[0].validation.isValid).toBe(true);
      expect(results[1].provider).toBe('Evil Provider');
      expect(results[1].validation.isValid).toBe(false);
    });

    it('should handle providers without companyProvider field', () => {
      const providers = [
        {
          loginUrl: 'https://mail.google.com/mail/'
          // No companyProvider field
        }
      ];

      const results = validateAllProviderUrls(providers);
      
      expect(results).toHaveLength(1);
      expect(results[0].provider).toBe('Unknown');
      expect(results[0].validation.isValid).toBe(true);
    });

    it('should handle empty providers array', () => {
      const results = validateAllProviderUrls([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('auditProviderSecurity', () => {
    it('should return clean audit for all valid providers', () => {
      const validProviders = [
        {
          companyProvider: 'Gmail',
          loginUrl: 'https://mail.google.com/mail/'
        },
        {
          companyProvider: 'Outlook',
          loginUrl: 'https://outlook.office365.com'
        }
      ];

      const audit = auditProviderSecurity(validProviders);
      
      expect(audit.total).toBe(2);
      expect(audit.valid).toBe(2);
      expect(audit.invalid).toBe(0);
      expect(audit.invalidProviders).toHaveLength(0);
      expect(audit.report).toBe('✅ All provider URLs passed security validation');
    });

    it('should flag invalid providers in audit', () => {
      const mixedProviders = [
        {
          companyProvider: 'Gmail',
          loginUrl: 'https://mail.google.com/mail/'
        },
        {
          companyProvider: 'Evil Provider',
          loginUrl: 'https://evil-site.com/mail'
        },
        {
          companyProvider: 'Shortener Provider',
          loginUrl: 'https://bit.ly/fake-gmail'
        }
      ];

      const audit = auditProviderSecurity(mixedProviders);
      
      expect(audit.total).toBe(3);
      expect(audit.valid).toBe(1);
      expect(audit.invalid).toBe(2);
      expect(audit.invalidProviders).toHaveLength(2);
      expect(audit.report).toBe('⚠️  2 provider(s) failed security validation');
    });

    it('should handle providers without URLs', () => {
      const providersWithoutUrls = [
        {
          companyProvider: 'No URL Provider'
          // No loginUrl
        }
      ];

      const audit = auditProviderSecurity(providersWithoutUrls);
      
      expect(audit.total).toBe(0);
      expect(audit.valid).toBe(0);
      expect(audit.invalid).toBe(0);
      expect(audit.report).toBe('✅ All provider URLs passed security validation');
    });
  });

  describe('Additional URL parsing edge cases', () => {
    it('should handle URLs with unusual but valid characters', () => {
      const validUrls = [
        'https://mail.google.com/mail/u/0/',
        'https://outlook.office365.com/mail/inbox',
        'https://mail.yahoo.com/d/folders/1'
      ];

      validUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(true);
      });
    });

    it('should normalize URLs properly', () => {
      const testUrl = 'https://MAIL.GOOGLE.COM/MAIL/';
      const result = validateEmailProviderUrl(testUrl);
      
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('mail.google.com');
      expect(result.normalizedUrl).toBeDefined();
    });

    it('should handle URLs with ports', () => {
      // Most email providers don't use custom ports, but test edge case
      const urlWithPort = 'https://evil-site.com:8080/mail';
      const result = validateEmailProviderUrl(urlWithPort);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('is not in the allowlist');
    });
  });
});
