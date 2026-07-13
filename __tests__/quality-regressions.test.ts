/**
 * Regression tests for quality-review fixes:
 * - public_provider MX/TXT preservation
 * - DNS hostname suffix matching
 * - process-wide DNS rate limiting
 */

import { loadProviders, clearCache } from '../src/provider-loader';
import {
  hostnameMatchesPattern,
  createConcurrentDNSDetector,
  resetDnsRateLimiter,
  setDnsRateLimit
} from '../src/concurrent-dns';

describe('Quality review regressions', () => {
  beforeEach(() => {
    clearCache();
    resetDnsRateLimiter();
    setDnsRateLimit(10);
    delete process.env.FORCE_DNS_RATE_LIMIT;
  });

  afterEach(() => {
    resetDnsRateLimiter();
    setDnsRateLimit(10);
    delete process.env.FORCE_DNS_RATE_LIMIT;
  });

  describe('public_provider MX/TXT preservation', () => {
    it('keeps MX patterns for public providers that host custom domains', () => {
      const { providers, success } = loadProviders();
      expect(success).toBe(true);

      const proton = providers.find(p => p.companyProvider === 'ProtonMail');
      expect(proton).toBeDefined();
      expect(proton!.type).toBe('public_provider');
      expect(proton!.customDomainDetection?.mxPatterns?.length).toBeGreaterThan(0);

      const fastmail = providers.find(p => p.companyProvider === 'FastMail');
      if (fastmail) {
        expect(fastmail.customDomainDetection?.mxPatterns?.length).toBeGreaterThan(0);
      }

      const withMx = providers.filter(p => p.customDomainDetection?.mxPatterns?.length);
      expect(withMx.length).toBeGreaterThan(14);
    });
  });

  describe('hostnameMatchesPattern', () => {
    it('matches exact hosts and DNS suffixes', () => {
      expect(hostnameMatchesPattern('aspmx.l.google.com', 'google.com')).toBe(true);
      expect(hostnameMatchesPattern('aspmx.l.google.com', 'aspmx.l.google.com')).toBe(true);
      expect(hostnameMatchesPattern('google.com', 'google.com')).toBe(true);
    });

    it('rejects substring false positives', () => {
      expect(hostnameMatchesPattern('mail.notgoogle.com', 'google.com')).toBe(false);
      expect(hostnameMatchesPattern('notgoogle.com', 'google.com')).toBe(false);
      expect(hostnameMatchesPattern('aspmx.evil.com', 'aspmx')).toBe(false);
      expect(hostnameMatchesPattern('mail.protonmail.ch', 'mail')).toBe(false);
    });
  });

  describe('DNS rate limiting', () => {
    it('enforces the configured per-minute limit when forced in tests', async () => {
      process.env.FORCE_DNS_RATE_LIMIT = '1';
      setDnsRateLimit(2);
      resetDnsRateLimiter();

      const detector = createConcurrentDNSDetector([]);

      await expect(detector.detectProvider('example-a.test')).resolves.toBeDefined();
      await expect(detector.detectProvider('example-b.test')).resolves.toBeDefined();
      await expect(detector.detectProvider('example-c.test')).rejects.toThrow(/Rate limit exceeded/);
    });
  });

  describe('DNS result caching', () => {
    it('returns cached results for repeated domain lookups', async () => {
      const { detectProviderConcurrent } = require('../src/concurrent-dns');
      const providers: never[] = [];

      const first = await detectProviderConcurrent('cache-test.example', providers, { timeout: 50 });
      const second = await detectProviderConcurrent('cache-test.example', providers, { timeout: 50 });

      expect(second).toBe(first);
    });
  });
});
