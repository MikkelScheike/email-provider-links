import { normalizeEmail, emailsMatch } from '../src/alias-detection';

describe('Email Normalization', () => {
describe('Input validation', () => {
    it('should handle empty or invalid input', () => {
      expect(() => normalizeEmail('')).toThrow();
      expect(() => normalizeEmail('invalid')).toThrow();
      expect(() => normalizeEmail('user@')).toThrow();
      expect(() => normalizeEmail('@domain.com')).toThrow();
    });
  });

  describe('Gmail normalization', () => {
    it('should strip plus addressing', () => {
      expect(normalizeEmail('user+tag@gmail.com')).toBe('user@gmail.com');
      expect(normalizeEmail('user+anything@gmail.com')).toBe('user@gmail.com');
      expect(normalizeEmail('user+@gmail.com')).toBe('user@gmail.com');
      expect(normalizeEmail('user+tag+more@gmail.com')).toBe('user@gmail.com');
    });

    it('should strip dots', () => {
      expect(normalizeEmail('user.name@gmail.com')).toBe('username@gmail.com');
      expect(normalizeEmail('u.s.e.r@gmail.com')).toBe('user@gmail.com');
      expect(normalizeEmail('user..name@gmail.com')).toBe('username@gmail.com');
      expect(normalizeEmail('u...s...e...r@gmail.com')).toBe('user@gmail.com');
    });

    it('should handle both plus and dots', () => {
      expect(normalizeEmail('user.name+tag@gmail.com')).toBe('username@gmail.com');
      expect(normalizeEmail('u.s.e.r+anything@gmail.com')).toBe('user@gmail.com');
      expect(normalizeEmail('user+tag.with.dots@gmail.com')).toBe('user@gmail.com');
    });

    it('should be case insensitive', () => {
      expect(normalizeEmail('User.Name+Tag@Gmail.com')).toBe('username@gmail.com');
      expect(normalizeEmail('USER+ANYTHING@gmail.com')).toBe('user@gmail.com');
    });
  });

  describe('Outlook normalization', () => {
    it('should strip plus addressing but preserve dots', () => {
      expect(normalizeEmail('user.name+tag@outlook.com')).toBe('user.name@outlook.com');
      expect(normalizeEmail('user+anything@outlook.com')).toBe('user@outlook.com');
      expect(normalizeEmail('user.name+@outlook.com')).toBe('user.name@outlook.com');
    });

    it('should preserve dots', () => {
      expect(normalizeEmail('user.name@outlook.com')).toBe('user.name@outlook.com');
      expect(normalizeEmail('u.s.e.r@outlook.com')).toBe('u.s.e.r@outlook.com');
    });

    it('should be case insensitive', () => {
      expect(normalizeEmail('User.Name@Outlook.com')).toBe('user.name@outlook.com');
      expect(normalizeEmail('USER+TAG@outlook.com')).toBe('user@outlook.com');
    });
  });

  describe('AOL normalization', () => {
    it('should preserve everything except case', () => {
      expect(normalizeEmail('User.Name+Tag@aol.com')).toBe('user.name+tag@aol.com');
      expect(normalizeEmail('USER+TEST@aol.com')).toBe('user+test@aol.com');
      expect(normalizeEmail('U.S.E.R@aol.com')).toBe('u.s.e.r@aol.com');
    });
  });
  });

  describe('Email matching', () => {
    describe('Gmail', () => {
      it('should match all alias variations', () => {
        // Plus variations
        expect(emailsMatch('user@gmail.com', 'user+tag@gmail.com')).toBe(true);
        expect(emailsMatch('user+tag1@gmail.com', 'user+tag2@gmail.com')).toBe(true);
        
        // Dot variations
        expect(emailsMatch('user.name@gmail.com', 'username@gmail.com')).toBe(true);
        expect(emailsMatch('u.s.e.r@gmail.com', 'user@gmail.com')).toBe(true);
        
        // Mixed variations
        expect(emailsMatch('user.name+tag@gmail.com', 'username@gmail.com')).toBe(true);
        expect(emailsMatch('u.s.e.r+anything@gmail.com', 'user@gmail.com')).toBe(true);
        
        // Case variations
        expect(emailsMatch('User.Name+Tag@Gmail.com', 'username@gmail.com')).toBe(true);
      });
    });

    describe('Outlook', () => {
      it('should match plus variations but preserve dots', () => {
        // Plus variations match
        expect(emailsMatch('user@outlook.com', 'user+tag@outlook.com')).toBe(true);
        expect(emailsMatch('user+tag1@outlook.com', 'user+tag2@outlook.com')).toBe(true);
        
        // Dots are preserved (different addresses)
        expect(emailsMatch('user.name@outlook.com', 'username@outlook.com')).toBe(false);
        expect(emailsMatch('u.s.e.r@outlook.com', 'user@outlook.com')).toBe(false);
        
        // Case insensitive
        expect(emailsMatch('User@outlook.com', 'user+tag@outlook.com')).toBe(true);
      });
    });

    describe('AOL', () => {
      it('should only match exact addresses (except case)', () => {
        // Case insensitive
        expect(emailsMatch('User@aol.com', 'user@aol.com')).toBe(true);
        expect(emailsMatch('USER@aol.com', 'user@aol.com')).toBe(true);
        
        // Everything else preserved (different addresses)
        expect(emailsMatch('user.name@aol.com', 'username@aol.com')).toBe(false);
        expect(emailsMatch('user+tag@aol.com', 'user@aol.com')).toBe(false);
        expect(emailsMatch('u.s.e.r@aol.com', 'user@aol.com')).toBe(false);
      });
    });

    describe('Different domains', () => {
      it('should never match across different domains', () => {
        expect(emailsMatch('user@gmail.com', 'user@outlook.com')).toBe(false);
        expect(emailsMatch('user.name@outlook.com', 'user.name@gmail.com')).toBe(false);
        expect(emailsMatch('user+tag@gmail.com', 'user+tag@aol.com')).toBe(false);
      });
    });
});
