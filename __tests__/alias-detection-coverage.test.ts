/**
 * Additional Email Alias Detection Tests for Coverage
 * 
 * Focuses on testing uncovered normalization functions and edge cases
 * to achieve higher test coverage for the alias detection module.
 */

import {
  detectEmailAlias,
  normalizeEmail
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

describe('Error handling and edge cases', () => {
    test('should handle invalid email parts in Gmail rule', () => {
      expect(() => detectEmailAlias('us er@gmail.com')).toThrow('Invalid email format');
    });

    test('should handle malformed email parts in provider rules', () => {
      // Test cases that should all fail validation
      const testCases = [
        '@gmail.com',
        'user@',
        ' @gmail.com',
        'user@ ',
        'user@domain@extra.com'
      ];

      testCases.forEach(email => {
        expect(() => detectEmailAlias(email)).toThrow('Invalid email format');
      });
    });

    test('should handle edge case emails for each provider', () => {
      // Valid emails that should not throw but might need special handling
      const testCases = [
        { email: 'user.name@outlook.com', expected: 'user.name@outlook.com' },
        { email: 'user-name@yahoo.com', expected: 'user-name@yahoo.com' },
        { email: 'user_name@protonmail.com', expected: 'user_name@protonmail.com' },
      ];

      testCases.forEach(({ email, expected }) => {
        const result = detectEmailAlias(email);
        expect(result.canonical).toBe(expected.toLowerCase());
        expect(result.isAlias).toBe(false);
      });
    });

    test('should handle provider-specific normalization without alias', () => {
      const providers = [
        'outlook.com', 'yahoo.com', 'fastmail.com', 'proton.me',
        'tutanota.com', 'zoho.com', 'icloud.com', 'mail.com',
        'mail.ru', 'yandex.com'
      ];

      providers.forEach(provider => {
        const email = `user.name@${provider}`;
        const result = detectEmailAlias(email);
        expect(result.canonical).toBe(email.toLowerCase());
        // Should not detect as alias since no plus sign
        expect(result.isAlias).toBe(provider === 'gmail.com');
      });
    });
  });

  describe('Additional normalization tests', () => {
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

    test('should handle emails with complex patterns', () => {
      // Test complex email patterns for additional coverage
      const testCases = [
        { email: 'User.Name@gmail.com', expected: 'username@gmail.com' },
        { email: 'user+test+more@proton.me', expected: 'user@proton.me' },
        { email: 'USER+WORK@TUTANOTA.COM', expected: 'user@tutanota.com' }
      ];

      testCases.forEach(({ email, expected }) => {
        const normalized = normalizeEmail(email);
        expect(normalized).toBe(expected);
      });
    });
  });
});
