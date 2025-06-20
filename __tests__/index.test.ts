import {
  getEmailProviderSync,
  isValidEmail,
  extractDomain,
  getSupportedProviders,
  isEmailProviderSupported,
  EmailProvider,
  EmailProviderResult
} from '../src/index';

describe('Email Provider Links', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@gmail.com')).toBe(true);
      expect(isValidEmail('user.name@outlook.com')).toBe(true);
      expect(isValidEmail('test+tag@yahoo.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@invalid.com')).toBe(false);
      expect(isValidEmail('invalid@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from valid emails', () => {
      expect(extractDomain('test@gmail.com')).toBe('gmail.com');
      expect(extractDomain('USER@OUTLOOK.COM')).toBe('outlook.com');
      expect(extractDomain('test@yahoo.co.uk')).toBe('yahoo.co.uk');
    });

    it('should return null for invalid emails', () => {
      expect(extractDomain('invalid')).toBe(null);
      expect(extractDomain('invalid@')).toBe(null);
      expect(extractDomain('@invalid.com')).toBe(null);
    });
  });

  // Note: findEmailProvider is no longer a public API in v2.0
  // Domain lookup is now handled internally by getEmailProviderSync

  describe('getEmailProviderSync', () => {
    it('should return correct result for Gmail', () => {
      const result = getEmailProviderSync('user@gmail.com');
      expect(result.email).toBe('user@gmail.com');
      expect(result.provider?.companyProvider).toBe('Gmail');
      expect(result.loginUrl).toBe('https://mail.google.com/mail/');
    });

    it('should return correct result for Yahoo Mail', () => {
      const result = getEmailProviderSync('user@yahoo.com');
      expect(result.email).toBe('user@yahoo.com');
      expect(result.provider?.companyProvider).toBe('Yahoo Mail');
      expect(result.loginUrl).toBe('https://login.yahoo.com');
    });

    it('should return correct result for iCloud', () => {
      const result = getEmailProviderSync('user@icloud.com');
      expect(result.email).toBe('user@icloud.com');
      expect(result.provider?.companyProvider).toBe('iCloud Mail');
      expect(result.loginUrl).toBe('https://www.icloud.com/mail');
    });

    it('should handle unknown providers', () => {
      const result = getEmailProviderSync('user@unknown-domain.com');
      expect(result.email).toBe('user@unknown-domain.com');
      expect(result.provider).toBe(null);
      expect(result.loginUrl).toBe(null);
    });

    it('should handle invalid emails', () => {
      const result = getEmailProviderSync('invalid-email');
      expect(result.email).toBe('invalid-email');
      expect(result.provider).toBe(null);
      expect(result.loginUrl).toBe(null);
    });
  });

  describe('getSupportedProviders', () => {
    it('should return all supported providers', () => {
      const providers = getSupportedProviders();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some(p => p.companyProvider === 'Gmail')).toBe(true);
      expect(providers.some(p => p.companyProvider === 'Microsoft Outlook')).toBe(true);
      expect(providers.some(p => p.companyProvider === 'Yahoo Mail')).toBe(true);
    });

    it('should return a copy of the providers array', () => {
      const providers1 = getSupportedProviders();
      const providers2 = getSupportedProviders();
      expect(providers1).not.toBe(providers2); // Different array instances
      expect(providers1).toEqual(providers2); // Same content
    });
  });

  describe('isEmailProviderSupported', () => {
    it('should return true for supported providers', () => {
      expect(isEmailProviderSupported('user@gmail.com')).toBe(true);
      expect(isEmailProviderSupported('user@outlook.com')).toBe(true);
      expect(isEmailProviderSupported('user@yahoo.com')).toBe(true);
      expect(isEmailProviderSupported('user@protonmail.com')).toBe(true);
    });

    it('should return false for unsupported providers', () => {
      expect(isEmailProviderSupported('user@unknown-domain.com')).toBe(false);
      expect(isEmailProviderSupported('user@example.org')).toBe(false);
    });

    it('should return false for invalid emails', () => {
      expect(isEmailProviderSupported('invalid-email')).toBe(false);
      expect(isEmailProviderSupported('')).toBe(false);
    });
  });

  describe('Edge cases and real-world scenarios', () => {
    it('should handle emails with plus addressing', () => {
      const result = getEmailProviderSync('user+tag@gmail.com');
      expect(result.provider?.companyProvider).toBe('Gmail');
      expect(result.loginUrl).toBe('https://mail.google.com/mail/');
    });

    it('should handle emails with dots in username', () => {
      const result = getEmailProviderSync('first.last@outlook.com');
      expect(result.provider?.companyProvider).toBe('Microsoft Outlook');
      expect(result.loginUrl).toBe('https://outlook.office365.com');
    });

    it('should handle mixed case domains', () => {
      const result = getEmailProviderSync('user@Gmail.COM');
      expect(result.provider?.companyProvider).toBe('Gmail');
      expect(result.loginUrl).toBe('https://mail.google.com/mail/');
    });
  });

  describe('New Email Providers', () => {
    it('should detect Mailfence email provider', () => {
      const result = getEmailProviderSync('user@mailfence.com');
      expect(result.provider?.companyProvider).toBe('Mailfence');
      expect(result.loginUrl).toBe('https://mailfence.com');
    });

    it('should detect Neo.space email provider', () => {
      const result = getEmailProviderSync('user@neo.space');
      expect(result.provider?.companyProvider).toBe('Neo.space Email');
      expect(result.loginUrl).toBe('https://neo.space/mail');
    });

    it('should support email providers supported via DNS detection only', () => {
      const providers = getSupportedProviders();
      
      // Check that our new DNS-only providers are in the list
      const simplyEmail = providers.find(p => p.companyProvider === 'Simply.com Email');
      const oneEmail = providers.find(p => p.companyProvider === 'One.com Email');
      
      expect(simplyEmail).toBeDefined();
      expect(oneEmail).toBeDefined();
      
      // These should have empty domains arrays but custom detection patterns
      expect(simplyEmail!.domains).toEqual([]);
      expect(oneEmail!.domains).toEqual([]);
      expect(simplyEmail!.customDomainDetection).toBeDefined();
      expect(oneEmail!.customDomainDetection).toBeDefined();
    });

    it('should detect NetEase Mail provider', () => {
      const result126 = getEmailProviderSync('user@126.com');
      const result163 = getEmailProviderSync('user@163.com');
      
      expect(result126.provider?.companyProvider).toBe('NetEase Mail');
      expect(result163.provider?.companyProvider).toBe('NetEase Mail');
      expect(result126.loginUrl).toBe('https://mail.126.com');
    });

    it('should detect QQ Mail provider', () => {
      const result = getEmailProviderSync('user@qq.com');
      expect(result.provider?.companyProvider).toBe('QQ Mail');
      expect(result.loginUrl).toBe('https://mail.qq.com');
    });

    it('should detect Sina Mail provider', () => {
      const result = getEmailProviderSync('user@sina.com');
      expect(result.provider?.companyProvider).toBe('Sina Mail');
      expect(result.loginUrl).toBe('https://mail.sina.com.cn');
    });

    it('should detect Xtra Mail provider', () => {
      const result = getEmailProviderSync('user@xtra.co.nz');
      expect(result.provider?.companyProvider).toBe('Xtra Mail');
      expect(result.loginUrl).toBe('https://www.xtra.co.nz/email');
    });

    it('should detect Rediffmail provider', () => {
      const result = getEmailProviderSync('user@rediffmail.com');
      expect(result.provider?.companyProvider).toBe('Rediffmail');
      expect(result.loginUrl).toBe('https://mail.rediff.com');
    });

    it('should have FastMail and Tutanota with custom domain detection', () => {
      const providers = getSupportedProviders();
      
      const fastmail = providers.find(p => p.companyProvider === 'FastMail');
      const tutanota = providers.find(p => p.companyProvider === 'Tutanota');
      
      expect(fastmail).toBeDefined();
      expect(tutanota).toBeDefined();
      
      expect(fastmail!.customDomainDetection).toBeDefined();
      expect(tutanota!.customDomainDetection).toBeDefined();
      
      expect(fastmail!.customDomainDetection!.mxPatterns).toContain('messagingengine.com');
      expect(tutanota!.customDomainDetection!.mxPatterns).toContain('tutanota.de');
    });
  });
});

