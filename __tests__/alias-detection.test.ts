import { detectEmailAlias, normalizeEmail } from '../src/alias-detection';
import { clearCache } from '../src/loader';

// Mock provider data
const mockProviders = {
  "version": "2.0",
  "providers": [
    {
      "id": "gmail",
      "companyProvider": "Gmail",
      "loginUrl": "https://mail.google.com/mail/",
      "domains": ["gmail.com"],
      "type": "public_provider",
      "alias": {
        "plus": { "ignore": true, "strip": true },
        "dots": { "ignore": true, "strip": true },
        "case": { "ignore": true, "strip": true }
      },
      "mx": ["aspmx.l.google.com"],
      "txt": ["v=spf1 include:_spf.google.com"]
    },
    {
      "id": "outlook",
      "companyProvider": "Microsoft Outlook",
      "loginUrl": "https://outlook.office365.com",
      "domains": ["outlook.com"],
      "type": "public_provider",
      "alias": {
        "plus": { "ignore": true, "strip": true },
        "dots": { "ignore": false },
        "case": { "ignore": true, "strip": true }
      },
      "mx": ["outlook-com.olc.protection.outlook.com"],
      "txt": ["v=spf1 include:spf.protection.outlook.com"]
    },
    {
      "id": "yahoo",
      "companyProvider": "Yahoo Mail",
      "loginUrl": "https://login.yahoo.com",
      "domains": ["yahoo.com"],
      "type": "public_provider",
      "alias": {
        "plus": { "ignore": true, "strip": true },
        "dots": { "ignore": false },
        "case": { "ignore": true, "strip": true }
      },
      "mx": ["mta7.am0.yahoodns.net"],
      "txt": ["v=spf1 include:spf.protection.yahoo.com"]
    },
    {
      "id": "aol",
      "companyProvider": "AOL Mail",
      "loginUrl": "https://mail.aol.com",
      "domains": ["aol.com"],
      "type": "public_provider",
      "alias": {
        "plus": { "ignore": false },
        "dots": { "ignore": false },
        "case": { "ignore": true, "strip": true }
      },
      "mx": ["mx.aol.com"],
      "txt": ["v=spf1 include:spf.protection.aol.com"]
    },
    {
      "id": "test_no_case",
      "companyProvider": "Test Provider - No Case",
      "loginUrl": "https://test-no-case.com",
      "domains": ["test-no-case.com"],
      "type": "public_provider",
      "alias": {
        "dots": { "ignore": false, "strip": false },
        "plus": { "ignore": true, "strip": true }
      }
    },
    {
      "id": "test_no_dots",
      "companyProvider": "Test Provider - No Dots",
      "loginUrl": "https://test-no-dots.com",
      "domains": ["test-no-dots.com"],
      "type": "public_provider",
      "alias": {
        "plus": { "ignore": true, "strip": true },
        "case": { "ignore": true, "strip": true }
      }
    },
    {
      "id": "test_no_plus",
      "companyProvider": "Test Provider - No Plus",
      "loginUrl": "https://test-no-plus.com",
      "domains": ["test-no-plus.com"],
      "type": "public_provider",
      "alias": {
        "dots": { "ignore": false, "strip": false },
        "case": { "ignore": true, "strip": true }
      }
    },
    {
      "id": "test_only_dots",
      "companyProvider": "Test Provider - Only Dots",
      "loginUrl": "https://test-only-dots.com",
      "domains": ["test-only-dots.com"],
      "type": "public_provider",
      "alias": {
        "dots": { "ignore": false, "strip": false }
      }
    }
  ]
};

// Mock the provider loading
jest.mock('../src/loader', () => ({
  ...jest.requireActual('../src/loader'),
  loadProviders: () => ({
    providers: mockProviders.providers,
    domainMap: new Map(mockProviders.providers.map(p => [p.domains[0], p])),
    stats: { fileSize: 0, loadTime: 0, providerCount: 4, domainCount: 4 }
  })
}));

describe('Email Alias Detection', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('Plus addressing', () => {
  it('should detect plus addressing when enabled', () => {
      const result = detectEmailAlias('user+tag@gmail.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('tag');
      expect(result.canonical).toBe('user@gmail.com');
    });

    it('should preserve plus sign when plus addressing is disabled', () => {
      const result = detectEmailAlias('user+tag@none.test');
      expect(result.isAlias).toBe(false);
      expect(result.canonical).toBe('user+tag@none.test');
    });

    it('should handle multiple plus signs', () => {
      const result = detectEmailAlias('user+tag+more@gmail.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('tag+more');
expect(result.canonical).toBe('user@gmail.com');
    });

    it('should handle empty plus alias', () => {
      const result = detectEmailAlias('user+@gmail.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('');
expect(result.canonical).toBe('user@gmail.com');
    });
  });

  describe('Dots addressing', () => {
    it('should detect dot variations when enabled', () => {
      const result = detectEmailAlias('u.s.e.r@gmail.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('dot');
      expect(result.aliasPart).toBe('u.s.e.r');
expect(result.canonical).toBe('user@gmail.com');
    });

    it('should preserve dots when dot addressing is disabled', () => {
      const result = detectEmailAlias('u.s.e.r@none.test');
      expect(result.isAlias).toBe(false);
      expect(result.canonical).toBe('u.s.e.r@none.test');
    });

    it('should handle consecutive dots', () => {
      const result = detectEmailAlias('u..s...e....r@gmail.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('dot');
expect(result.canonical).toBe('user@gmail.com');
    });
  });

  describe('Combined plus and dots', () => {
    it('should handle both plus and dots when enabled', () => {
      const result = detectEmailAlias('u.s.e.r+tag@gmail.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('tag');
expect(result.canonical).toBe('user@gmail.com');
    });

    it('should handle dots in username part after plus', () => {
      const result = detectEmailAlias('user+t.a.g@gmail.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('t.a.g');
expect(result.canonical).toBe('user@gmail.com');
    });
  });

  describe('Edge cases', () => {
    it('should handle unknown providers', () => {
      const result = detectEmailAlias('user+tag@unknown.test');
      expect(result.isAlias).toBe(false);
      expect(result.canonical).toBe('user+tag@unknown.test');
    });

    it('should handle invalid email formats', () => {
      expect(() => detectEmailAlias('invalid')).toThrow('Invalid email format');
      expect(() => detectEmailAlias('user@')).toThrow('Invalid email format');
      expect(() => detectEmailAlias('@domain.test')).toThrow('Invalid email format');
    });

    it('should handle special characters in username', () => {
      const result = detectEmailAlias('user-name_123+tag@gmail.com');
      expect(result.isAlias).toBe(true);
expect(result.canonical).toBe('user-name_123@gmail.com');
    });

// Missing Alias Properties Tests
  describe('Provider without case property', () => {
    it('should handle dots and plus but ignore case sensitivity', () => {
      const result = detectEmailAlias('User.Name+Tag@test-no-case.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('tag');  // Alias part is also lowercase for consistency
      expect(result.canonical).toBe('user.name@test-no-case.com'); // Canonical form is always lowercase
    });
  });

  describe('Provider without dots property', () => {
    it('should handle plus and case but preserve dots', () => {
      const result = detectEmailAlias('User.Name+Tag@test-no-dots.com');
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('tag');  // Alias part is also lowercase for consistency
      expect(result.canonical).toBe('user.name@test-no-dots.com'); // Canonical form is always lowercase
    });
  });

  describe('Provider without plus property', () => {
    it('should handle dots and case but preserve plus', () => {
      const result = detectEmailAlias('User.Name+Tag@test-no-plus.com');
      expect(result.isAlias).toBe(false);
      expect(result.canonical).toBe('user.name+tag@test-no-plus.com'); // Case should be lowercased by default in canonical form
    });
  });

  describe('Provider with only dots property', () => {
    it('should only handle dots configuration', () => {
      const result = detectEmailAlias('User.Name+Tag@test-only-dots.com');
      expect(result.isAlias).toBe(false);
      expect(result.canonical).toBe('user.name+tag@test-only-dots.com'); // Canonical form is always lowercase
    });
  });
  });

  describe('Normalization', () => {
    it('should always lowercase the canonical form', () => {
      const result = detectEmailAlias('USER+TAG@gmail.com');
expect(result.canonical).toBe('user@gmail.com');
    });

    it('should preserve the original email', () => {
      const result = detectEmailAlias('User.Name+Tag@gmail.com');
expect(result.original).toBe('User.Name+Tag@gmail.com');
      expect(result.canonical).toBe('username@gmail.com');
    });
  });

  describe('Email matching', () => {
    it('should match emails with plus aliases', () => {
      const base = 'user@gmail.com';
      const alias = 'user+tag@gmail.com';
      const normalized1 = normalizeEmail(base);
      const normalized2 = normalizeEmail(alias);
      expect(normalized1).toBe(normalized2);
    });

    it('should match emails with dot aliases', () => {
      const base = 'user@gmail.com';
      const alias = 'u.s.e.r@gmail.com';
      const normalized1 = normalizeEmail(base);
      const normalized2 = normalizeEmail(alias);
      expect(normalized1).toBe(normalized2);
    });

    it('should match emails with both plus and dots', () => {
      const base = 'user@gmail.com';
      const alias = 'u.s.e.r+tag@gmail.com';
      const normalized1 = normalizeEmail(base);
      const normalized2 = normalizeEmail(alias);
      expect(normalized1).toBe(normalized2);
    });

    it('should not match different email addresses', () => {
      const email1 = normalizeEmail('user1@gmail.com');
      const email2 = normalizeEmail('user2@gmail.com');
      expect(email1).not.toBe(email2);
    });
  });
});
