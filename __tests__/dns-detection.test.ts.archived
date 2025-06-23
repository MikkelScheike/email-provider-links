import {
  detectProviderByDNS,
  getEmailProviderLinkWithDNS,
  getSupportedProviders,
  DNSDetectionResult,
  EmailProviderResult,
  EmailProvider,
  RateLimit
} from '../src/index';

describe('DNS-based Provider Detection', () => {
  beforeEach(() => {
    // Reset rate limiter for each test to avoid interference
    const limiter = RateLimit.getCurrentLimiter();
    (limiter as any).requestTimestamps = [];
  });
  describe('detectProviderByDNS', () => {
    it('should detect Microsoft 365 from MX records', async () => {
      // Test with microsoft.com which should have outlook.com MX records
      const result: DNSDetectionResult = await detectProviderByDNS('microsoft.com');
      
      expect(result.provider).not.toBeNull();
      expect(result.provider?.companyProvider).toBe('Microsoft 365 (Business)');
      expect(result.detectionMethod).toBe('mx_record');
    }, 10000); // Increase timeout for DNS lookup

    it('should return null for unknown domains', async () => {
      // Test with a domain that doesn't use known email providers
      const result: DNSDetectionResult = await detectProviderByDNS('example.com');
      
      expect(result.provider).toBeNull();
      expect(result.detectionMethod).toBeNull();
    }, 10000);

    it('should handle DNS lookup failures gracefully', async () => {
      // Test with an invalid domain
      const result: DNSDetectionResult = await detectProviderByDNS('invalid-domain-that-does-not-exist.invalid');
      
      expect(result.provider).toBeNull();
      expect(result.detectionMethod).toBeNull();
    }, 10000);
  });

  describe('getEmailProviderLinkWithDNS', () => {
    it('should use standard domain matching first', async () => {
      const result: EmailProviderResult = await getEmailProviderLinkWithDNS('user@gmail.com');
      
      expect(result.provider?.companyProvider).toBe('Gmail');
      expect(result.detectionMethod).toBe('domain_match');
      expect(result.loginUrl).toBe('https://mail.google.com/mail/');
    });

    it('should fall back to DNS detection for custom domains', async () => {
      // Test with Microsoft's domain which should detect via MX records
      const result: EmailProviderResult = await getEmailProviderLinkWithDNS('user@microsoft.com');
      
      expect(result.provider?.companyProvider).toBe('Microsoft 365 (Business)');
      expect(result.detectionMethod).toBe('mx_record');
      expect(result.loginUrl).toBe('https://outlook.office365.com');
    }, 10000);

    it('should handle invalid emails', async () => {
      const result: EmailProviderResult = await getEmailProviderLinkWithDNS('invalid-email');
      
      expect(result.provider).toBeNull();
      expect(result.loginUrl).toBeNull();
      expect(result.detectionMethod).toBeUndefined();
    });

    it('should handle unknown domains gracefully', async () => {
      const result: EmailProviderResult = await getEmailProviderLinkWithDNS('user@unknown-domain.example');
      
      expect(result.provider).toBeNull();
      expect(result.loginUrl).toBeNull();
      expect(result.detectionMethod).toBeUndefined();
    }, 10000);
  });

  describe('DNS Detection Patterns', () => {
    it('should have valid detection patterns for business providers', () => {
      // This test verifies that our DNS detection patterns are properly configured
      const providers = getSupportedProviders();
      
      const businessProviders = providers.filter((p: EmailProvider) => p.customDomainDetection);
      
      expect(businessProviders.length).toBeGreaterThan(0);
      
      businessProviders.forEach((provider: EmailProvider) => {
        expect(provider.customDomainDetection).toBeDefined();
        
        // Each provider should have at least MX or TXT patterns
        const hasPatterns = 
          (provider.customDomainDetection!.mxPatterns && provider.customDomainDetection!.mxPatterns.length > 0) ||
          (provider.customDomainDetection!.txtPatterns && provider.customDomainDetection!.txtPatterns.length > 0);
        
        expect(hasPatterns).toBe(true);
      });
    });

    it('should have Microsoft 365 detection patterns', () => {
      const providers = getSupportedProviders();
      
      const microsoft365 = providers.find((p: EmailProvider) => p.companyProvider === 'Microsoft 365 (Business)');
      
      expect(microsoft365).toBeDefined();
      expect(microsoft365!.customDomainDetection).toBeDefined();
      expect(microsoft365!.customDomainDetection!.mxPatterns).toContain('outlook.com');
      expect(microsoft365!.customDomainDetection!.mxPatterns).toContain('protection.outlook.com');
    });

    it('should have Google Workspace detection patterns', () => {
      const providers = getSupportedProviders();
      
      const googleWorkspace = providers.find((p: EmailProvider) => p.companyProvider === 'Google Workspace');
      
      expect(googleWorkspace).toBeDefined();
      expect(googleWorkspace!.customDomainDetection).toBeDefined();
      expect(googleWorkspace!.customDomainDetection!.mxPatterns).toContain('google.com');
      expect(googleWorkspace!.customDomainDetection!.mxPatterns).toContain('aspmx.l.google.com');
    });

    it('should have Simply.com Email detection patterns', () => {
      const providers = getSupportedProviders();
      
      const simplyEmail = providers.find((p: EmailProvider) => p.companyProvider === 'Simply.com Email');
      
      expect(simplyEmail).toBeDefined();
      expect(simplyEmail!.customDomainDetection).toBeDefined();
      expect(simplyEmail!.customDomainDetection!.mxPatterns).toContain('spamfilter.io');
      expect(simplyEmail!.customDomainDetection!.txtPatterns).toContain('include:spf.key-systems.net');
    });

    it('should have One.com Email detection patterns', () => {
      const providers = getSupportedProviders();
      
      const oneEmail = providers.find((p: EmailProvider) => p.companyProvider === 'One.com Email');
      
      expect(oneEmail).toBeDefined();
      expect(oneEmail!.customDomainDetection).toBeDefined();
      expect(oneEmail!.customDomainDetection!.mxPatterns).toContain('one.com');
      expect(oneEmail!.customDomainDetection!.txtPatterns).toContain('include:_spf.one.com');
    });

    it('should have Mailfence detection patterns', () => {
      const providers = getSupportedProviders();
      
      const mailfence = providers.find((p: EmailProvider) => p.companyProvider === 'Mailfence');
      
      expect(mailfence).toBeDefined();
      expect(mailfence!.domains).toContain('mailfence.com');
      expect(mailfence!.customDomainDetection).toBeDefined();
      expect(mailfence!.customDomainDetection!.mxPatterns).toContain('mailfence.com');
    });

    it('should have Neo.space Email detection patterns', () => {
      const providers = getSupportedProviders();
      
      const neoSpace = providers.find((p: EmailProvider) => p.companyProvider === 'Neo.space Email');
      
      expect(neoSpace).toBeDefined();
      expect(neoSpace!.domains).toContain('neo.space');
      expect(neoSpace!.customDomainDetection).toBeDefined();
      expect(neoSpace!.customDomainDetection!.mxPatterns).toContain('neo.space');
    });

    it('should have ProtonMail detection patterns', () => {
      const providers = getSupportedProviders();
      
      const protonmail = providers.find((p: EmailProvider) => p.companyProvider === 'ProtonMail');
      
      expect(protonmail).toBeDefined();
      expect(protonmail!.domains).toContain('proton.me');
      expect(protonmail!.customDomainDetection).toBeDefined();
      expect(protonmail!.customDomainDetection!.mxPatterns).toContain('protonmail.ch');
      expect(protonmail!.customDomainDetection!.mxPatterns).toContain('mail.protonmail.ch');
      expect(protonmail!.customDomainDetection!.txtPatterns).toContain('v=spf1 include:_spf.protonmail.ch');
    });

    it('should have FastMail detection patterns', () => {
      const providers = getSupportedProviders();
      
      const fastmail = providers.find((p: EmailProvider) => p.companyProvider === 'FastMail');
      
      expect(fastmail).toBeDefined();
      expect(fastmail!.domains).toContain('fastmail.com');
      expect(fastmail!.customDomainDetection).toBeDefined();
      expect(fastmail!.customDomainDetection!.mxPatterns).toContain('messagingengine.com');
      expect(fastmail!.customDomainDetection!.txtPatterns).toContain('v=spf1 include:spf.messagingengine.com');
    });

    it('should have Tutanota detection patterns', () => {
      const providers = getSupportedProviders();
      
      const tutanota = providers.find((p: EmailProvider) => p.companyProvider === 'Tutanota');
      
      expect(tutanota).toBeDefined();
      expect(tutanota!.domains).toContain('tutanota.com');
      expect(tutanota!.customDomainDetection).toBeDefined();
      expect(tutanota!.customDomainDetection!.mxPatterns).toContain('tutanota.de');
      expect(tutanota!.customDomainDetection!.mxPatterns).toContain('mail.tutanota.de');
    });
  });

  describe('Proxy Detection', () => {
    it('should detect Cloudflare proxy and return no provider', async () => {
      // Test with a domain that uses Cloudflare MX records
      const result = await detectProviderByDNS('digitalhabitat.io');
      
      expect(result.detectionMethod).toBe('proxy_detected');
      expect(result.proxyService).toBe('Cloudflare');
      expect(result.provider).toBeNull();
    }, 10000);

    it('should handle proxy detection in email provider function', async () => {
      const result = await getEmailProviderLinkWithDNS('user@digitalhabitat.io');
      
      expect(result.detectionMethod).toBe('proxy_detected');
      expect(result.proxyService).toBe('Cloudflare');
      expect(result.provider).toBeNull();
      expect(result.loginUrl).toBeNull();
    }, 10000);

    it('should not detect proxy for regular email providers', async () => {
      const result = await detectProviderByDNS('microsoft.com');
      
      // Should detect Microsoft 365, not proxy
      expect(result.detectionMethod).toBe('mx_record');
      expect(result.proxyService).toBeUndefined();
      expect(result.provider).not.toBeNull();
      expect(result.provider?.companyProvider).toBe('Microsoft 365 (Business)');
    }, 10000);
  });

  describe('Timeout Configuration', () => {
    it('should respect custom timeout for detectProviderByDNS', async () => {
      const start = Date.now();
      const result = await detectProviderByDNS('nonexistent-domain-12345.com', 1000);
      const duration = Date.now() - start;
      
      // Should complete within reasonable time (allowing for some overhead)
      expect(duration).toBeLessThan(3000);
      expect(result.provider).toBeNull();
    }, 5000);

    it('should respect custom timeout for getEmailProviderLinkWithDNS', async () => {
      const start = Date.now();
      const result = await getEmailProviderLinkWithDNS('user@nonexistent-domain-12345.com', 1000);
      const duration = Date.now() - start;
      
      // Should complete within reasonable time (allowing for some overhead)
      expect(duration).toBeLessThan(3000);
      expect(result.provider).toBeNull();
    }, 5000);

    it('should use default timeout when not specified', async () => {
      // This test just ensures the default timeout path works
      const result = await detectProviderByDNS('google.com');
      expect(result).toBeDefined();
      expect(result.provider?.companyProvider).toBe('Google Workspace');
    }, 10000);

    it('should handle very short timeout gracefully', async () => {
      const result = await detectProviderByDNS('google.com', 1); // 1ms timeout
      // Should either succeed quickly or timeout gracefully
      expect(result).toBeDefined();
      expect(typeof result.provider === 'object' || result.provider === null).toBe(true);
    }, 5000);
  });
});

