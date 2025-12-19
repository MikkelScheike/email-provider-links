/**
 * IDN (Internationalized Domain Names) utilities
 * Zero-dependency implementation for domain name handling
 */

const BASE = 36;
const INITIAL_N = 128;
const INITIAL_BIAS = 72;
const DAMP = 700;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DELIMITER = '-';

function adaptBias(delta: number, numPoints: number, firstTime: boolean): number {
  delta = firstTime ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
  delta += Math.floor(delta / numPoints);

  let k = 0;
  while (delta > ((BASE - TMIN) * TMAX) / 2) {
    delta = Math.floor(delta / (BASE - TMIN));
    k += BASE;
  }

  return k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
}

function digitToBasic(digit: number): number {
  return digit + 22 + 75 * Number(digit < 26);
}


function encode(str: string): string {
  const codePoints = Array.from(str).map(c => c.codePointAt(0)!);
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  let output = '';
  
  // Copy ASCII chars directly
  const basic = codePoints.filter(c => c < 0x80);
  let h = basic.length;
  let b = h;
  
  if (b > 0) {
    output = String.fromCodePoint(...basic);
  }
  
  if (b > 0) {
    output += DELIMITER;
  }

  while (h < codePoints.length) {
    let m = Number.MAX_SAFE_INTEGER;
    for (const c of codePoints) {
      if (c >= n && c < m) m = c;
    }

    delta += (m - n) * (h + 1);
    n = m;

    for (const c of codePoints) {
      if (c < n) {
        delta++;
      } else if (c === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          output += String.fromCodePoint(digitToBasic(t + (q - t) % (BASE - t)));
          q = Math.floor((q - t) / (BASE - t));
        }
        output += String.fromCodePoint(digitToBasic(q));
        bias = adaptBias(delta, h + 1, h === b);
        delta = 0;
        h++;
      }
    }
    delta++;
    n++;
  }

  return output;
}

/**
 * Convert domain to Punycode format
 * @param domain Domain name to convert
 * @returns Punycode encoded domain
 */
export function domainToPunycode(domain: string): string {
  // Split domain into labels
  return domain.toLowerCase().split('.').map(label => {
    // Check if label needs encoding (contains non-ASCII)
    if (!/[^\x00-\x7F]/.test(label)) {
      return label;
    }
    return 'xn--' + encode(label);
  }).join('.');
}

/**
 * Convert email address's domain to Punycode
 * @param email Email address to convert
 * @returns Email with Punycode encoded domain
 */


export function emailToPunycode(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local}@${domainToPunycode(domain)}`;
}

/**
 * Error codes for IDN validation
 * These can be used as keys for translation systems
 */
export enum IDNValidationError {
  MISSING_INPUT = 'MISSING_INPUT',
  EMAIL_TOO_LONG = 'EMAIL_TOO_LONG',
  MISSING_AT_SYMBOL = 'MISSING_AT_SYMBOL',
  LOCAL_PART_EMPTY = 'LOCAL_PART_EMPTY',
  LOCAL_PART_TOO_LONG = 'LOCAL_PART_TOO_LONG',
  LOCAL_PART_INVALID = 'LOCAL_PART_INVALID',
  DOMAIN_EMPTY = 'DOMAIN_EMPTY',
  DOMAIN_TOO_LONG = 'DOMAIN_TOO_LONG',
  DOMAIN_INVALID_FORMAT = 'DOMAIN_INVALID_FORMAT',
  MISSING_TLD = 'MISSING_TLD',
  NUMERIC_TLD = 'NUMERIC_TLD',
  INVALID_ENCODING = 'INVALID_ENCODING'
}

/**
 * Validates an email address according to international standards (IDNA)
 * This implementation follows RFC 5321, 5322, and 6530 standards for email addresses
 *
 * @param email The email address to validate
 * @returns Error information if validation fails, undefined if valid
 */
export function validateInternationalEmail(email: string): { 
  type: 'IDN_VALIDATION_ERROR'; 
  code: IDNValidationError;
  message: string; 
} | undefined {
  // Basic checks
  if (!email || typeof email !== 'string') {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.MISSING_INPUT,
      message: 'The email field cannot be empty'
    };
  }

  // Split into local and domain parts
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.MISSING_AT_SYMBOL,
      message: 'The email address must contain an @ symbol'
    };
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  // Check for max length - RFC 5321
  if (email.length > 254) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.EMAIL_TOO_LONG,
      message: 'The email address is too long'
    };
  }

  // Validate domain part
  if (domain.length === 0) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.DOMAIN_EMPTY,
      message: 'The domain part of the email cannot be empty'
    };
  }
  if (domain.length > 255) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.DOMAIN_TOO_LONG,
      message: 'The domain part of the email is too long'
    };
  }

  // Validate local part
  if (local.length === 0) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.LOCAL_PART_EMPTY,
      message: 'The username part of the email cannot be empty'
    };
  }
  if (local.length > 64) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.LOCAL_PART_TOO_LONG,
      message: 'The username part of the email is too long'
    };
  }

  // Check local part characters
  // Allows: letters, numbers, and !#$%&'*+-/=?^_`{|}~.
  // Dot can't be first, last, or consecutive
  if (!/^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~]([a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]*[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~])?$/.test(local) || local.includes('..')) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.LOCAL_PART_INVALID,
      message: 'The username contains invalid characters or dots in wrong places'
    };
  }

  // Check domain format (including IDN domains)
  try {
    // Check for lone surrogates and control characters
    if (/[\uD800-\uDFFF]/.test(domain) || /[\u0000-\u001F\u007F]/.test(domain)) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.INVALID_ENCODING,
        message: 'The domain contains invalid characters or encoding'
      };
    }

    // Disallow symbols and punctuation that cannot appear in DNS labels.
    // Allow letters/numbers/marks for IDN, plus dot separators and hyphens.
    if (/[^\p{L}\p{M}\p{N}.\-]/u.test(domain)) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.DOMAIN_INVALID_FORMAT,
        message: 'The domain format is invalid'
      };
    }

    // Convert to punycode to handle IDN
    const punycodeDomain = domainToPunycode(domain);
    
    // Check basic domain format
    // Allows: letters, numbers, hyphens (not first/last), dots separating labels
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(punycodeDomain)) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.DOMAIN_INVALID_FORMAT,
        message: 'The domain format is invalid'
      };
    }

    // Check if domain has at least one dot (TLD required)
    if (!punycodeDomain.includes('.')) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.MISSING_TLD,
        message: 'The email domain must include a top-level domain (like .com or .org)'
      };
    }

    // Check TLD is not all-numeric
    const tld = punycodeDomain.split('.').pop()!;
    if (/^[0-9]+$/.test(tld)) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.NUMERIC_TLD,
        message: 'The top-level domain cannot be all numbers'
      };
    }

  } catch (error) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.INVALID_ENCODING,
      message: 'The domain contains invalid characters or encoding'
    };
  }

  // If we get here, the email is valid
  return undefined;
}
