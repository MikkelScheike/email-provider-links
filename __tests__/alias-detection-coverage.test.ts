/**
 * Additional Email Alias Detection Tests for Coverage
 * 
 * Focuses on testing uncovered normalization functions and edge cases
 * to achieve higher test coverage for the alias detection module.
 */

import {
  detectEmailAlias,
  normalizeEmail,
  getAliasCapabilities,
  generateAliases
} from '../src/alias-detection';

describe('Email Alias Detection - Coverage Tests', () => {
  
  describe('Provider-specific normalize functions', () => {
    test('should test Outlook normalize function directly', () => {
      const result = detectEmailAlias('user+test@outlook.com');
      expect(result.canonical).toBe('user@outlook.com');
      expect(result.isAlias).toBe(true);
    });

    test('should test Yahoo normalize function directly', () => {
      const result = detectEmailAlias('user+newsletter@yahoo.com');
      expect(result.canonical).toBe('user@yahoo.com');
      expect(result.isAlias).toBe(true);
    });

    test('should test FastMail normalize function', () => {
      const result = detectEmailAlias('user+work@fastmail.com');
      expect(result.canonical).toBe('user@fastmail.com');
      expect(result.isAlias).toBe(true);
    });

    test('should test ProtonMail normalize function', () => {
      const result = detectEmailAlias('user+secure@proton.me');
      expect(result.canonical).toBe('user@proton.me');
      expect(result.isAlias).toBe(true);
    });

    test('should test Tutanota normalize function', () => {
      const result = detectEmailAlias('user+private@tutanota.com');
      expect(result.canonical).toBe('user@tutanota.com');
      expect(result.isAlias).toBe(true);
    });

    test('should test Zoho normalize function', () => {
      const result = detectEmailAlias('user+business@zoho.com');
      expect(result.canonical).toBe('user@zoho.com');
      expect(result.isAlias).toBe(true);
    });

    test('should test iCloud normalize function', () => {
      const result = detectEmailAlias('user+apple@icloud.com');
      expect(result.canonical).toBe('user@icloud.com');
      expect(result.isAlias).toBe(true);
    });

    test('should test Mail.com normalize function', () => {
      const result = detectEmailAlias('user+test@mail.com');
      expect(result.canonical).toBe('user@mail.com');
      expect(result.isAlias).toBe(true);
    });

    test('should test Mail.ru normalize function', () => {
      const result = detectEmailAlias('user+test@mail.ru');
      expect(result.canonical).toBe('user@mail.ru');
      expect(result.isAlias).toBe(true);
    });

    test('should test Yandex normalize function', () => {
      const result = detectEmailAlias('user+test@yandex.com');
      expect(result.canonical).toBe('user@yandex.com');
      expect(result.isAlias).toBe(true);
    });
  });

  describe('Normalization edge cases', () => {
    test('should handle emails with no provider rule (coverage for lines 210-212)', () => {
      const result = detectEmailAlias('user@unknown-provider.xyz');
      expect(result.canonical).toBe('user@unknown-provider.xyz');
      expect(result.isAlias).toBe(false);
      expect(result.aliasType).toBe('none');
      expect(result.provider).toBeUndefined();
    });

    test('should handle provider-specific normalization without alias detection', () => {
      // Test a case where normalization happens without alias detection
      const result = detectEmailAlias('USER@aol.com');
      expect(result.canonical).toBe('user@aol.com'); // AOL just lowercases
      expect(result.isAlias).toBe(false); // AOL doesn't support aliases
      expect(result.provider).toBe('aol.com');
    });

    test('should test all provider domain variants', () => {
      // Test different domains for providers to hit normalize functions
      const testCases = [
        'user+test@hotmail.com',
        'user+test@live.com',
        'user+test@msn.com',
        'user+test@hotmail.co.uk',
        'user+test@live.jp',
        'user+test@yahoo.co.uk',
        'user+test@yahoo.fr',
        'user+test@ymail.com',
        'user+test@rocketmail.com',
        'user+test@fastmail.fm',
        'user+test@protonmail.com',
        'user+test@protonmail.ch',
        'user+test@pm.me',
        'user+test@tutanota.de',
        'user+test@tutamail.com',
        'user+test@tuta.io',
        'user+test@keemail.me',
        'user+test@tuta.com',
        'user+test@zohomail.com',
        'user+test@zoho.eu',
        'user+test@me.com',
        'user+test@mac.com',
        'user+test@yandex.ru'
      ];

      testCases.forEach(email => {
        const result = detectEmailAlias(email);
        expect(result.isAlias).toBe(true);
        expect(result.aliasType).toBe('plus');
        expect(result.aliasPart).toBe('test');
      });
    });

    test('should test AOL provider domains (no aliasing)', () => {
      const aolDomains = ['aol.com', 'love.com', 'ygm.com', 'games.com', 'wow.com', 'aim.com'];
      
      aolDomains.forEach(domain => {
        const result = detectEmailAlias(`user+test@${domain}`);
        expect(result.isAlias).toBe(false); // AOL doesn't support plus addressing
        expect(result.canonical).toBe(`user+test@${domain}`);
      });
    });
  });

  describe('Generate aliases coverage', () => {
    test('should handle providers without rule (coverage for unknown domains)', () => {
      const aliases = generateAliases('user@unknown.com', {
        plusAliases: ['test'],
        includeDotVariations: true
      });
      
      expect(aliases).toEqual(['user@unknown.com']);
    });

    test('should handle providers without plus addressing support', () => {
      const aliases = generateAliases('user@aol.com', {
        plusAliases: ['test', 'work']
      });
      
      expect(aliases).toEqual(['user@aol.com']); // AOL doesn't support plus addressing
    });

    test('should handle providers without dot variations support', () => {
      const aliases = generateAliases('user@outlook.com', {
        includeDotVariations: true,
        maxDotVariations: 3
      });
      
      expect(aliases).toEqual(['user@outlook.com']); // Outlook doesn't ignore dots
    });

    test('should test FastMail subdomain alias capability', () => {
      const capabilities = getAliasCapabilities('fastmail.com');
      expect(capabilities?.supportsSubdomainAlias).toBe(true);
    });

    test('should test all provider capabilities coverage', () => {
      const providers = [
        'gmail.com', 'googlemail.com',
        'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
        'yahoo.com', 'ymail.com', 'rocketmail.com',
        'fastmail.com', 'fastmail.fm',
        'proton.me', 'protonmail.com', 'pm.me',
        'tutanota.com', 'tuta.com',
        'zoho.com', 'zohomail.com',
        'icloud.com', 'me.com', 'mac.com',
        'mail.com',
        'aol.com', 'aim.com',
        'mail.ru',
        'yandex.com', 'yandex.ru'
      ];

      providers.forEach(provider => {
        const capabilities = getAliasCapabilities(provider);
        expect(capabilities).not.toBeNull();
        expect(capabilities?.domains).toContain(provider);
      });
    });
  });

  describe('Complex normalization scenarios', () => {
    test('should handle Gmail with both dots and plus (normalize function coverage)', () => {
      const result = detectEmailAlias('u.s.e.r+work@gmail.com');
      expect(result.canonical).toBe('user@gmail.com'); // Both dots and plus removed
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus'); // Plus takes precedence
    });

    test('should handle normalization when canonical differs from lowercase', () => {
      // Test the scenario where rule.normalize creates different result than just lowercasing
      const result = detectEmailAlias('User.Name+Tag@GMAIL.COM');
      expect(result.canonical).toBe('username@gmail.com'); // Gmail removes dots
      expect(result.isAlias).toBe(true);
      expect(result.original).toBe('User.Name+Tag@GMAIL.COM');
    });

    test('should test edge case where dots exist but username is unchanged after dot removal', () => {
      // This would hit the condition where baseUsername !== username
      const result = detectEmailAlias('user@gmail.com'); // No dots to remove
      expect(result.isAlias).toBe(false);
      expect(result.canonical).toBe('user@gmail.com');
    });

    test('should test provider-specific normalization fallback', () => {
      // Test emails that would use the normalize function but don't trigger alias detection
      const result = detectEmailAlias('SIMPLE@aol.com');
      expect(result.canonical).toBe('simple@aol.com'); // Just lowercase normalization
      expect(result.isAlias).toBe(false);
    });
  });

  describe('Edge cases for complete coverage', () => {
    test('should handle very short usernames for dot variations', () => {
      const aliases = generateAliases('a@gmail.com', {
        includeDotVariations: true,
        maxDotVariations: 5
      });
      
      expect(aliases).toEqual(['a@gmail.com']); // Too short for dot variations
    });

    test('should handle empty options in generateAliases', () => {
      const aliases = generateAliases('user@gmail.com');
      expect(aliases).toEqual(['user@gmail.com']); // No options provided
    });

    test('should handle maxDotVariations boundary conditions', () => {
      const aliases = generateAliases('verylongusername@gmail.com', {
        includeDotVariations: true,
        maxDotVariations: 0
      });
      
      // When maxDotVariations = 0, Math.min(0, username.length - 1) = 0, but loop doesn't run
      // Since no aliases generated, it returns the original email
      expect(aliases).toEqual(['verylongusername@gmail.com']);
    });

    test('should test normalize function with different email formats', () => {
      // Test all normalization functions with various inputs
      const testCases = [
        { email: 'user@outlook.com', expected: 'user@outlook.com' },
        { email: 'USER@OUTLOOK.COM', expected: 'user@outlook.com' },
        { email: 'user@yahoo.com', expected: 'user@yahoo.com' },
        { email: 'User@FastMail.COM', expected: 'user@fastmail.com' }
      ];

      testCases.forEach(({ email, expected }) => {
        const normalized = normalizeEmail(email);
        expect(normalized).toBe(expected);
      });
    });
  });
});
