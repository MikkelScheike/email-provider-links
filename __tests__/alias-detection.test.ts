/**
 * Email Alias Detection Test Suite
 * 
 * Tests for email aliasing functionality including plus addressing,
 * dot variations, and provider-specific normalization.
 */

import {
  detectEmailAlias,
  normalizeEmail,
  emailsMatch,
  AliasDetectionResult
} from '../src/alias-detection';

describe('Email Alias Detection', () => {
  describe('detectEmailAlias', () => {
    test('should detect Gmail plus addressing', () => {
      const result = detectEmailAlias('user+test@gmail.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('test');
      expect(result.canonical).toBe('user@gmail.com');
      expect(result.provider).toBe('gmail.com');
      expect(result.original).toBe('user+test@gmail.com');
    });

    test('should detect Gmail dot variations', () => {
      const result = detectEmailAlias('u.s.e.r@gmail.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('dot');
      expect(result.aliasPart).toBe('u.s.e.r');
      expect(result.canonical).toBe('user@gmail.com');
      expect(result.provider).toBe('gmail.com');
    });

    test('should handle Gmail combined plus and dot addressing', () => {
      const result = detectEmailAlias('u.s.e.r+test@gmail.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus'); // Plus takes precedence
      expect(result.aliasPart).toBe('test');
      expect(result.canonical).toBe('user@gmail.com'); // Both dots and plus removed
    });

    test('should detect Outlook plus addressing', () => {
      const result = detectEmailAlias('user+test@outlook.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('test');
      expect(result.canonical).toBe('user@outlook.com');
      expect(result.provider).toBe('outlook.com');
    });

    test('should not detect dot variations for Outlook', () => {
      const result = detectEmailAlias('u.s.e.r@outlook.com');
      
      expect(result.isAlias).toBe(false);
      expect(result.aliasType).toBe('none');
      expect(result.canonical).toBe('u.s.e.r@outlook.com');
    });

    test('should detect Yahoo plus addressing', () => {
      const result = detectEmailAlias('user+newsletter@yahoo.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('newsletter');
      expect(result.canonical).toBe('user@yahoo.com');
    });

    test('should detect ProtonMail plus addressing', () => {
      const result = detectEmailAlias('user+work@proton.me');
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('work');
      expect(result.canonical).toBe('user@proton.me');
    });

    test('should not detect aliases for AOL', () => {
      const result = detectEmailAlias('user+test@aol.com');
      
      expect(result.isAlias).toBe(false);
      expect(result.aliasType).toBe('none');
      expect(result.canonical).toBe('user+test@aol.com');
    });

    test('should handle unknown providers', () => {
      const result = detectEmailAlias('user+test@unknown-provider.com');
      
      expect(result.isAlias).toBe(false);
      expect(result.aliasType).toBe('none');
      expect(result.canonical).toBe('user+test@unknown-provider.com');
      expect(result.provider).toBeUndefined();
    });

    test('should normalize case for all emails', () => {
      const result = detectEmailAlias('USER@GMAIL.COM');
      
      expect(result.canonical).toBe('user@gmail.com');
      expect(result.original).toBe('USER@GMAIL.COM');
    });

    test('should throw error for invalid email', () => {
      expect(() => detectEmailAlias('invalid-email')).toThrow('Invalid email format');
      expect(() => detectEmailAlias('user@')).toThrow('Invalid email format');
      expect(() => detectEmailAlias('@domain.com')).toThrow('Invalid email format');
    });

    test('should handle emails with multiple plus signs', () => {
      const result = detectEmailAlias('user+test+more@gmail.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('test+more'); // Everything after first + is alias part
      expect(result.canonical).toBe('user@gmail.com');
    });

    test('should handle empty plus alias', () => {
      const result = detectEmailAlias('user+@gmail.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasType).toBe('plus');
      expect(result.aliasPart).toBe('');
      expect(result.canonical).toBe('user@gmail.com');
    });
  });

  describe('normalizeEmail', () => {
    test('should normalize Gmail addresses', () => {
      expect(normalizeEmail('u.s.e.r+test@gmail.com')).toBe('user@gmail.com');
      expect(normalizeEmail('USER+TEST@GMAIL.COM')).toBe('user@gmail.com');
      expect(normalizeEmail('user@gmail.com')).toBe('user@gmail.com');
    });

    test('should normalize Outlook addresses', () => {
      expect(normalizeEmail('user+test@outlook.com')).toBe('user@outlook.com');
      expect(normalizeEmail('u.s.e.r@outlook.com')).toBe('u.s.e.r@outlook.com'); // Dots preserved
    });

    test('should handle unknown providers', () => {
      expect(normalizeEmail('user@unknown.com')).toBe('user@unknown.com');
      expect(normalizeEmail('USER@UNKNOWN.COM')).toBe('user@unknown.com');
    });
  });

  describe('emailsMatch', () => {
    test('should match Gmail aliases', () => {
      expect(emailsMatch('user@gmail.com', 'u.s.e.r@gmail.com')).toBe(true);
      expect(emailsMatch('user@gmail.com', 'user+test@gmail.com')).toBe(true);
      expect(emailsMatch('u.s.e.r+test@gmail.com', 'user@gmail.com')).toBe(true);
    });

    test('should match Outlook aliases', () => {
      expect(emailsMatch('user@outlook.com', 'user+test@outlook.com')).toBe(true);
      expect(emailsMatch('u.s.e.r@outlook.com', 'u.s.e.r+test@outlook.com')).toBe(true);
    });

    test('should not match different providers', () => {
      expect(emailsMatch('user@gmail.com', 'user@outlook.com')).toBe(false);
    });

    test('should not match different base usernames', () => {
      expect(emailsMatch('user1@gmail.com', 'user2@gmail.com')).toBe(false);
    });

    test('should handle invalid emails gracefully', () => {
      expect(emailsMatch('invalid-email', 'user@gmail.com')).toBe(false);
      expect(emailsMatch('user@gmail.com', 'invalid-email')).toBe(false);
    });

    test('should match case insensitively', () => {
      expect(emailsMatch('USER@GMAIL.COM', 'user@gmail.com')).toBe(true);
    });
  });




  describe('Edge Cases', () => {
    test('should handle emails with special characters in username', () => {
      const result = detectEmailAlias('user-name_123+test@gmail.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.canonical).toBe('user-name_123@gmail.com');
    });

    test('should handle international domains', () => {
      const result = detectEmailAlias('user+test@yandex.ru');
      
      expect(result.isAlias).toBe(true);
      expect(result.canonical).toBe('user@yandex.ru');
    });

    test('should handle subdomain variations', () => {
      const result = detectEmailAlias('user@mail.yahoo.com');
      
      // Should normalize based on Yahoo rules if detected
      expect(result.canonical).toBe('user@mail.yahoo.com');
    });

    test('should handle emails with numbers', () => {
      const result = detectEmailAlias('user123+test@gmail.com');
      
      expect(result.isAlias).toBe(true);
      expect(result.canonical).toBe('user123@gmail.com');
    });

    test('should handle very long aliases', () => {
      const longAlias = 'a'.repeat(100);
      const result = detectEmailAlias(`user+${longAlias}@gmail.com`);
      
      expect(result.isAlias).toBe(true);
      expect(result.aliasPart).toBe(longAlias);
      expect(result.canonical).toBe('user@gmail.com');
    });
  });

});
