import { domainToPunycode, emailToPunycode } from '../src/idn';

describe('IDN utilities', () => {
  describe('domainToPunycode', () => {
    test('converts non-ASCII domain to punycode', () => {
      expect(domainToPunycode('bücher.example')).toBe('xn--bcher-kva.example');
      expect(domainToPunycode('ドメイン.example')).toBe('xn--eckwd4c7c.example');
    });

    test('leaves ASCII-only domains unchanged', () => {
      expect(domainToPunycode('example.com')).toBe('example.com');
      expect(domainToPunycode('sub.example.com')).toBe('sub.example.com');
    });

    test('handles mixed ASCII and non-ASCII domains', () => {
      expect(domainToPunycode('test.bücher.example')).toBe('test.xn--bcher-kva.example');
    });

    test('converts to lowercase', () => {
      expect(domainToPunycode('EXAMPLE.com')).toBe('example.com');
    });
  });

  describe('emailToPunycode', () => {
    test('converts non-ASCII email domains to punycode', () => {
      expect(emailToPunycode('user@bücher.example')).toBe('user@xn--bcher-kva.example');
      expect(emailToPunycode('test@ドメイン.example')).toBe('test@xn--eckwd4c7c.example');
    });

    test('leaves ASCII-only email addresses unchanged', () => {
      expect(emailToPunycode('user@example.com')).toBe('user@example.com');
    });

    test('preserves local part case sensitivity', () => {
      expect(emailToPunycode('User.Name@example.com')).toBe('User.Name@example.com');
    });

    test('handles invalid email addresses', () => {
      expect(emailToPunycode('invalidemail')).toBe('invalidemail');
    });
  });
});
