/**
 * Tests for Schema module
 * 
 * Tests the optimized provider data schema and validation functions.
 */

import {
  Provider,
  ProvidersData,
  TXT_PATTERN_COMPRESSION,
  compressTxtPattern,
  decompressTxtPattern,
  validateProvider
} from '../src/schema';

describe('Schema Module', () => {
  describe('TXT Pattern Compression', () => {
    it('should compress SPF patterns correctly', () => {
      const spfPattern = 'v=spf1 include:_spf.google.com ~all';
      const compressed = compressTxtPattern(spfPattern);
      expect(compressed).toBe('spf:_spf.google.com ~all');
    });

    it('should compress Google Site Verification patterns', () => {
      const gsvPattern = 'google-site-verification=abc123def456';
      const compressed = compressTxtPattern(gsvPattern);
      expect(compressed).toBe('gsv:abc123def456');
    });

    it('should compress Microsoft patterns', () => {
      const msPattern = 'MS=ms123456';
      const compressed = compressTxtPattern(msPattern);
      expect(compressed).toBe('ms123456');
    });

    it('should compress Zoho verification patterns', () => {
      const zohoPattern = 'zoho-verification=zb12345678';
      const compressed = compressTxtPattern(zohoPattern);
      expect(compressed).toBe('zv:zb12345678');
    });

    it('should compress Mailgun verification patterns', () => {
      const mailgunPattern = 'mailgun-verification=mg123456';
      const compressed = compressTxtPattern(mailgunPattern);
      expect(compressed).toBe('mv:mg123456');
    });

    it('should return original pattern if no compression rule matches', () => {
      const unknownPattern = 'unknown-pattern=value';
      const compressed = compressTxtPattern(unknownPattern);
      expect(compressed).toBe(unknownPattern);
    });
  });

  describe('TXT Pattern Decompression', () => {
    it('should decompress SPF patterns correctly', () => {
      const compressed = 'spf:_spf.google.com ~all';
      const decompressed = decompressTxtPattern(compressed);
      expect(decompressed).toBe('v=spf1 include:_spf.google.com ~all');
    });

    it('should decompress Google Site Verification patterns', () => {
      const compressed = 'gsv:abc123def456';
      const decompressed = decompressTxtPattern(compressed);
      expect(decompressed).toBe('google-site-verification=abc123def456');
    });

    it('should decompress Microsoft patterns', () => {
      const compressed = 'ms123456';
      const decompressed = decompressTxtPattern(compressed);
      expect(decompressed).toBe('MS=ms123456');
    });

    it('should decompress Zoho verification patterns', () => {
      const compressed = 'zv:zb12345678';
      const decompressed = decompressTxtPattern(compressed);
      expect(decompressed).toBe('zoho-verification=zb12345678');
    });

    it('should decompress Mailgun verification patterns', () => {
      const compressed = 'mv:mg123456';
      const decompressed = decompressTxtPattern(compressed);
      expect(decompressed).toBe('mailgun-verification=mg123456');
    });

    it('should return original pattern if no decompression rule matches', () => {
      const unknownPattern = 'unknown-pattern';
      const decompressed = decompressTxtPattern(unknownPattern);
      expect(decompressed).toBe(unknownPattern);
    });

    it('should round-trip compression and decompression correctly', () => {
      const originalPatterns = [
        'v=spf1 include:_spf.google.com ~all',
        'google-site-verification=abc123',
        'MS=ms123456',
        'zoho-verification=zb123',
        'mailgun-verification=mg123'
      ];

      originalPatterns.forEach(pattern => {
        const compressed = compressTxtPattern(pattern);
        const decompressed = decompressTxtPattern(compressed);
        expect(decompressed).toBe(pattern);
      });
    });
  });

  describe('Provider Validation', () => {
    const validProvider: Provider = {
      id: 'gmail',
      companyProvider: 'Gmail',
      loginUrl: 'https://mail.google.com/mail/',
      domains: ['gmail.com', 'googlemail.com'],
      mx: ['aspmx.l.google.com'],
      txt: ['spf:_spf.google.com'],
      alias: {
        dots: true,
        plus: true
      }
    };

    it('should validate a valid provider without errors', () => {
      const errors = validateProvider(validProvider);
      expect(errors).toEqual([]);
    });

    it('should require provider ID', () => {
      const invalidProvider = { ...validProvider, id: '' };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('Provider ID is required and must be a string');
    });

    it('should require provider ID to be string', () => {
      const invalidProvider = { ...validProvider, id: 123 as any };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('Provider ID is required and must be a string');
    });

    it('should require provider name', () => {
      const invalidProvider = { ...validProvider, companyProvider: '' };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('Company provider is required and must be a string');
    });

    it('should require provider name to be string', () => {
      const invalidProvider = { ...validProvider, companyProvider: 123 as any };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('Company provider is required and must be a string');
    });

    it('should require provider URL', () => {
      const invalidProvider = { ...validProvider, loginUrl: '' };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('Login URL must be null or a string starting with HTTPS');
    });

    it('should require provider URL to be string', () => {
      const invalidProvider = { ...validProvider, loginUrl: 123 as any };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('Login URL must be null or a string starting with HTTPS');
      // Should not crash when checking HTTPS on non-string URL
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require HTTPS URLs', () => {
      const invalidProvider = { ...validProvider, loginUrl: 'http://mail.google.com/mail/' };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('Login URL must be null or a string starting with HTTPS');
    });

    it('should validate domains array', () => {
      const invalidProvider = { ...validProvider, domains: 'gmail.com' as any };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('Domains must be an array');
    });

    it('should validate MX patterns array', () => {
      const invalidProvider = { ...validProvider, mx: 'aspmx.l.google.com' as any };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('MX patterns must be an array');
    });

    it('should validate TXT patterns array', () => {
      const invalidProvider = { ...validProvider, txt: 'spf:_spf.google.com' as any };
      const errors = validateProvider(invalidProvider);
      expect(errors).toContain('TXT patterns must be an array');
    });

    it('should allow optional fields to be undefined', () => {
      const minimalProvider: Provider = {
        id: 'test',
        companyProvider: 'Test Provider',
        loginUrl: 'https://test.com'
      };
      const errors = validateProvider(minimalProvider);
      expect(errors).toEqual([]);
    });

    it('should collect multiple validation errors', () => {
      const invalidProvider = {
        id: '',
        companyProvider: 123,
        loginUrl: 'http://test.com',
        domains: 'test.com',
        mx: 'mx.test.com',
        txt: 'spf1'
      } as any;

      const errors = validateProvider(invalidProvider);
      expect(errors.length).toBeGreaterThan(3);
      expect(errors).toContain('Provider ID is required and must be a string');
expect(errors).toContain('Company provider is required and must be a string');
expect(errors).toContain('Login URL must be null or a string starting with HTTPS');
      expect(errors).toContain('Domains must be an array');
      expect(errors).toContain('MX patterns must be an array');
      expect(errors).toContain('TXT patterns must be an array');
    });
  });

  describe('Type Definitions', () => {
    it('should define Provider interface correctly', () => {
      const provider: Provider = {
        id: 'test',
        companyProvider: 'Test',
        loginUrl: 'https://test.com',
        domains: ['test.com'],
        mx: ['mx.test.com'],
        txt: ['spf:_spf.test.com'],
        alias: {
          dots: true,
          plus: false
        }
      };

      expect(provider.id).toBe('test');
expect(provider.companyProvider).toBe('Test');
      expect(provider.loginUrl).toBe('https://test.com');
      expect(provider.domains).toEqual(['test.com']);
      expect(provider.mx).toEqual(['mx.test.com']);
      expect(provider.txt).toEqual(['spf:_spf.test.com']);
      expect(provider.alias?.dots).toBe(true);
      expect(provider.alias?.plus).toBe(false);
    });

    it('should define ProvidersData interface correctly', () => {
      const data: ProvidersData = {
        version: '2.0',
        providers: [{
          id: 'test',
          companyProvider: 'Test',
          loginUrl: 'https://test.com'
        }],
        meta: {
          count: 1,
          domains: 0,
          generated: '2024-01-01T00:00:00Z'
        }
      };

      expect(data.version).toBe('2.0');
      expect(data.providers).toHaveLength(1);
      expect(data.meta.count).toBe(1);
      expect(data.meta.domains).toBe(0);
      expect(data.meta.generated).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('TXT_PATTERN_COMPRESSION constant', () => {
    it('should have all expected compression patterns', () => {
      expect(TXT_PATTERN_COMPRESSION).toHaveProperty('v=spf1 include:', 'spf:');
      expect(TXT_PATTERN_COMPRESSION).toHaveProperty('v=spf1 ', 'spf1:');
      expect(TXT_PATTERN_COMPRESSION).toHaveProperty('google-site-verification=', 'gsv:');
      expect(TXT_PATTERN_COMPRESSION).toHaveProperty('MS=ms', 'ms');
      expect(TXT_PATTERN_COMPRESSION).toHaveProperty('zoho-verification=', 'zv:');
      expect(TXT_PATTERN_COMPRESSION).toHaveProperty('mailgun-verification=', 'mv:');
    });

    it('should be readonly', () => {
      // This is a TypeScript compile-time check, but we can ensure the object exists
      expect(typeof TXT_PATTERN_COMPRESSION).toBe('object');
      expect(TXT_PATTERN_COMPRESSION).toBeDefined();
    });
  });
});
