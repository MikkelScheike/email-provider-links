import {
  domainToPunycode,
  emailToPunycode,
  validateInternationalEmail,
  IDNValidationError
} from '../src/idn';

describe('IDN (Internationalized Domain Names) Utilities', () => {
  describe('domainToPunycode', () => {
    it('should handle ASCII domains unchanged', () => {
      expect(domainToPunycode('example.com')).toBe('example.com');
      expect(domainToPunycode('sub.example.com')).toBe('sub.example.com');
    });

    it('should convert IDN domains to punycode', () => {
      // German
      expect(domainToPunycode('müller.de')).toBe('xn--mller-kva.de');
      // Chinese
      expect(domainToPunycode('例子.com')).toBe('xn--fsqu00a.com');
      // Japanese
      expect(domainToPunycode('テスト.jp')).toBe('xn--zckzah.jp');
    });

    it('should handle mixed ASCII and IDN domains', () => {
      expect(domainToPunycode('sub.münich.de')).toBe('sub.xn--mnich-kva.de');
    });

    it('should convert to lowercase', () => {
      expect(domainToPunycode('Example.Com')).toBe('example.com');
    });
  });

  describe('emailToPunycode', () => {
    it('should handle ASCII emails unchanged', () => {
      expect(emailToPunycode('user@example.com')).toBe('user@example.com');
    });

    it('should convert IDN domains in emails', () => {
      expect(emailToPunycode('user@münchen.de')).toBe('user@xn--mnchen-3ya.de');
    });

    it('should preserve local part case', () => {
      expect(emailToPunycode('User.Name@example.com')).toBe('User.Name@example.com');
    });

    it('should handle invalid email format', () => {
      expect(emailToPunycode('invalid-email')).toBe('invalid-email');
    });
  });

  describe('validateInternationalEmail', () => {
    describe('Valid Email Addresses', () => {
      it('should validate correct email addresses', () => {
        expect(validateInternationalEmail('user@example.com')).toBeUndefined();
        expect(validateInternationalEmail('user@sub.example.com')).toBeUndefined();
        expect(validateInternationalEmail('user+tag@example.com')).toBeUndefined();
      });

      it('should validate international email addresses', () => {
        expect(validateInternationalEmail('user@münchen.de')).toBeUndefined();
      });
    });

    describe('Invalid Input Cases', () => {
      it('should handle null and undefined input', () => {
        const nullResult = validateInternationalEmail(null as any);
        expect(nullResult?.code).toBe(IDNValidationError.MISSING_INPUT);
        expect(nullResult?.message).toBe('The email field cannot be empty');

        const undefinedResult = validateInternationalEmail(undefined as any);
        expect(undefinedResult?.code).toBe(IDNValidationError.MISSING_INPUT);
      });

      it('should validate email length', () => {
        // Test local part length (max 64)
        const longLocal = 'a'.repeat(65);
        const result = validateInternationalEmail(`${longLocal}@example.com`);
        expect(result?.code).toBe(IDNValidationError.LOCAL_PART_TOO_LONG);
        expect(result?.message).toBe('The username part of the email is too long');

        // Test total email length (max 254)
        const tooLongEmail = `user@${'a'.repeat(246)}.com`;
        const tooLongResult = validateInternationalEmail(tooLongEmail);
        expect(tooLongResult?.code).toBe(IDNValidationError.EMAIL_TOO_LONG);
      });
    });

    describe('Local Part Validation', () => {
      it('should validate local part format', () => {
        // Test invalid characters
        const invalidChars = validateInternationalEmail('user[box]@example.com');
        expect(invalidChars?.code).toBe(IDNValidationError.LOCAL_PART_INVALID);

        // Test dot placement rules
        const consecutiveDots = validateInternationalEmail('user..name@example.com');
        expect(consecutiveDots?.code).toBe(IDNValidationError.LOCAL_PART_INVALID);

        const startDot = validateInternationalEmail('.user@example.com');
        expect(startDot?.code).toBe(IDNValidationError.LOCAL_PART_INVALID);

        const endDot = validateInternationalEmail('user.@example.com');
        expect(endDot?.code).toBe(IDNValidationError.LOCAL_PART_INVALID);
      });
    });

    describe('Domain Validation', () => {
      it('should validate domain format', () => {
        const noTld = validateInternationalEmail('user@domain');
        expect(noTld?.code).toBe(IDNValidationError.MISSING_TLD);

        const invalidFormat = validateInternationalEmail('user@-domain.com');
        expect(invalidFormat?.code).toBe(IDNValidationError.DOMAIN_INVALID_FORMAT);

        const numericTld = validateInternationalEmail('user@domain.123');
        expect(numericTld?.code).toBe(IDNValidationError.NUMERIC_TLD);

        // Correct domain
        expect(validateInternationalEmail('user@valid.com')).toBeUndefined();
      });

      it('should validate domain labels', () => {
        // Test invalid Punycode label
        const invalidPunycode = validateInternationalEmail('user@xn--example');
        expect(invalidPunycode?.code).toBe(IDNValidationError.MISSING_TLD);
      });

      it('should accept valid international email addresses', () => {
        expect(validateInternationalEmail('user.name@example.com')).toBeUndefined();
        expect(validateInternationalEmail("user!#$%&'*+-/=?^_`{|}~@example.com")).toBeUndefined();
      });

      it('should detect invalid UTF-16 encoding', () => {
        const result = validateInternationalEmail('user@\uDC00.com');
        expect(result?.code).toBe(IDNValidationError.INVALID_ENCODING);
        expect(result?.message).toBe('The domain contains invalid characters or encoding');
      });
    });

    describe('Special Cases', () => {
      it('should handle empty parts correctly', () => {
        const noLocal = validateInternationalEmail('@domain.com');
        expect(noLocal?.code).toBe(IDNValidationError.LOCAL_PART_EMPTY);

        const noDomain = validateInternationalEmail('user@');
        expect(noDomain?.code).toBe(IDNValidationError.DOMAIN_EMPTY);

        const noAt = validateInternationalEmail('userdomain.com');
        expect(noAt?.code).toBe(IDNValidationError.MISSING_AT_SYMBOL);
      });

      it('should validate domain length', () => {
        // Since the total email length (256) exceeds max email length (254),
        // this should trigger EMAIL_TOO_LONG instead of DOMAIN_TOO_LONG
        const longDomain = `user@${'a'.repeat(252)}.com`; // 252 + 4 (.com) = 256 chars
        const result = validateInternationalEmail(longDomain);
        expect(result?.code).toBe(IDNValidationError.EMAIL_TOO_LONG);
        expect(result?.message).toBe('The email address is too long');
      });
    });
  });
});
