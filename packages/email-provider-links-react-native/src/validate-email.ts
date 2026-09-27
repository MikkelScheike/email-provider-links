import { domainToPunycode } from './punycode';

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

export interface IdnValidationFailure {
  type: 'IDN_VALIDATION_ERROR';
  code: IDNValidationError;
  message: string;
}

/**
 * Same structural checks as the Node library's validateInternationalEmail.
 * Punycode conversion uses the Hermes-safe `punycode` package instead of node:url.
 */
export function validateInternationalEmail(email: string): IdnValidationFailure | undefined {
  if (!email || typeof email !== 'string') {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.MISSING_INPUT,
      message: 'The email field cannot be empty'
    };
  }

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

  if (email.length > 254) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.EMAIL_TOO_LONG,
      message: 'The email address is too long'
    };
  }

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

  if (!/^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~]([a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]*[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~])?$/.test(local) || local.includes('..')) {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.LOCAL_PART_INVALID,
      message: 'The username contains invalid characters or dots in wrong places'
    };
  }

  try {
    if (/[\uD800-\uDFFF]/.test(domain) || /[\u0000-\u001F\u007F]/.test(domain)) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.INVALID_ENCODING,
        message: 'The domain contains invalid characters or encoding'
      };
    }

    if (/[^\p{L}\p{M}\p{N}.\-]/u.test(domain)) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.DOMAIN_INVALID_FORMAT,
        message: 'The domain format is invalid'
      };
    }

    const punycodeDomain = domainToPunycode(domain);

    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(punycodeDomain)) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.DOMAIN_INVALID_FORMAT,
        message: 'The domain format is invalid'
      };
    }

    if (!punycodeDomain.includes('.')) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.MISSING_TLD,
        message: 'The email domain must include a top-level domain (like .com or .org)'
      };
    }

    const tld = punycodeDomain.split('.').pop() ?? '';
    if (/^[0-9]+$/.test(tld)) {
      return {
        type: 'IDN_VALIDATION_ERROR',
        code: IDNValidationError.NUMERIC_TLD,
        message: 'The top-level domain cannot be all numbers'
      };
    }
  } catch {
    return {
      type: 'IDN_VALIDATION_ERROR',
      code: IDNValidationError.INVALID_ENCODING,
      message: 'The domain contains invalid characters or encoding'
    };
  }

  return undefined;
}
