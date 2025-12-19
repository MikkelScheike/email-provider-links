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
} from '../src/url-validator';

// Mock the provider loader
jest.mock('../src/provider-loader', () => ({
  ...jest.requireActual('../src/provider-loader'),
  loadProviders: jest.fn().mockImplementation(() => ({
    success: true,
    providers: [
      {
        companyProvider: 'Gmail',
        loginUrl: 'https://mail.google.com/mail/',
        domains: ['gmail.com'],
        type: 'public_provider',
        alias: {
          plus: { ignore: true, strip: true },
          dots: { ignore: true, strip: true },
          case: { ignore: true, strip: true }
        }
      }
    ],
    securityReport: {
      hashVerification: true,
      urlValidation: true,
      totalProviders: 1,
      validUrls: 1,
      invalidUrls: 0,
      securityLevel: 'SECURE',
      issues: []
    }
  }))
}));

import { loadProviders } from '../src/provider-loader';

describe('URL Validator - Coverage Tests', () => {
  describe('validateEmailProviderUrl - Edge Cases', () => {
    it('should handle malformed URLs that cannot be decoded (line ~164)', () => {
      // Test URL with invalid URL encoding that throws during decodeURIComponent
      const malformedUrl = 'https://gmail.com/%GG%GG%GG';
      const result = validateEmailProviderUrl(malformedUrl || '');
      
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

    it('should only allow exact URLs from provider data', () => {
      const { providers } = loadProviders();
      const provider = providers.find(p => p.loginUrl);
      if (!provider || !provider.loginUrl) throw new Error('No provider with loginUrl found');

      // Exact match should work
      const result = validateEmailProviderUrl(provider.loginUrl);
      expect(result.isValid).toBe(true);
      expect(result.domain).toBeDefined();
      expect(result.normalizedUrl).toBeDefined();

// Non-allowlisted domains should fail
      const baseUrl = new URL(provider.loginUrl);
      const invalidDomains = [
        `fake.${baseUrl.hostname}`,
        `${baseUrl.hostname}.phishing.com`,
        `evil-${baseUrl.hostname}`
      ];

      invalidDomains.forEach(domain => {
        const url = baseUrl.protocol + '//' + domain + baseUrl.pathname;
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('is not in the allowlist');
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
      
      expect(results).toHaveLength(3); // All providers, including those without loginUrl
      expect(results[0].provider).toBe('Gmail');
      expect(results[0].validation.isValid).toBe(true);
      expect(results[1].provider).toBe('Evil Provider');
      expect(results[1].validation.isValid).toBe(false);
      expect(results[2].provider).toBe('No URL Provider');
      expect(results[2].validation.isValid).toBe(false);
      expect(results[2].validation.reason).toBe('No URL provided');
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
          loginUrl: 'https://mail.google.com/mail/',
          domains: ['gmail.com'],
          type: 'public_provider',
          alias: {
            plus: { ignore: true, strip: true },
            dots: { ignore: true, strip: true },
            case: { ignore: true, strip: true }
          }
        },
        {
          companyProvider: 'Evil Provider',
          loginUrl: 'https://evil-site.com/mail',
          domains: ['evil-site.com'],
          type: 'public_provider',
          alias: {
            plus: { ignore: true, strip: true },
            dots: { ignore: true, strip: true },
            case: { ignore: true, strip: true }
          }
        },
        {
          companyProvider: 'Shortener Provider',
          loginUrl: 'https://bit.ly/fake-gmail',
          domains: ['bit.ly'],
          type: 'public_provider',
          alias: {
            plus: { ignore: true, strip: true },
            dots: { ignore: true, strip: true },
            case: { ignore: true, strip: true }
          }
        }
      ];

      const audit = auditProviderSecurity(mixedProviders);
      
      expect(audit.total).toBe(3);
      expect(audit.valid).toBe(1);
      expect(audit.invalid).toBe(2);
      expect(audit.invalidProviders).toHaveLength(2);
      expect(typeof audit.report).toBe('string');
      expect((audit.report as string).includes('provider(s) failed security validation')).toBe(true);
    });

    it('should handle providers without URLs', () => {
      const providersWithoutUrls = [
        {
          companyProvider: 'No URL Provider',
          loginUrl: undefined,
          domains: ['nourl.com'],
          type: 'public_provider',
          alias: {
            plus: { ignore: true, strip: true },
            dots: { ignore: true, strip: true },
            case: { ignore: true, strip: true }
          }
        },
        {
          companyProvider: 'Empty URL Provider',
          loginUrl: '',
          domains: ['emptyurl.com'],
          type: 'public_provider',
          alias: {
            plus: { ignore: true, strip: true },
            dots: { ignore: true, strip: true },
            case: { ignore: true, strip: true }
          }
        }
      ];

      const audit = auditProviderSecurity(providersWithoutUrls);
      
      expect(audit.total).toBe(2);
      expect(audit.valid).toBe(0);
      expect(audit.invalid).toBe(2);
      expect(audit.invalidProviders).toHaveLength(2);
      expect(audit.report).toContain('2 provider(s) failed security validation');
    });
  });

  describe('Additional URL parsing edge cases', () => {
    it('should handle URLs with unusual but valid characters', () => {
      // Use actual provider URLs from the data
      const { providers } = loadProviders();
      const validUrls = providers
        .filter(p => p.loginUrl && p.loginUrl.includes('https://'))
        .map(p => p.loginUrl)
        .slice(0, 3);  // Take first 3 valid URLs

      validUrls.forEach(url => {
        const result = validateEmailProviderUrl(url);
        expect(result.isValid).toBe(true);
      });
    });

    it('should normalize URLs properly', () => {
      const { providers } = loadProviders();
      const provider = providers.find(p => p.loginUrl);
      if (!provider || !provider.loginUrl) throw new Error('No provider with loginUrl found');
      
      const testUrl = provider.loginUrl.toUpperCase();
      const result = validateEmailProviderUrl(testUrl);
      
      expect(result.isValid).toBe(true);
      expect(result.domain).toBe(new URL(provider.loginUrl).hostname);
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
