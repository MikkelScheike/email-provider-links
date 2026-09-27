import { normalizeEmail } from './alias';
import { domainToPunycode } from './punycode';
import { getDomainMap } from './providers';
import type { LookupResult, SimplifiedProvider } from './types';
import { IDNValidationError, validateInternationalEmail } from './validate-email';

function simplifyProvider(provider: {
  companyProvider: string;
  loginUrl: string | null;
  type: SimplifiedProvider['type'];
} | null): SimplifiedProvider | null {
  if (!provider) {
    return null;
  }
  return {
    companyProvider: provider.companyProvider,
    loginUrl: provider.loginUrl,
    type: provider.type
  };
}

function validateAndParseEmail(email: string): {
  ok: true;
  trimmedEmail: string;
  domain: string;
} | {
  ok: false;
  email: string;
  error: NonNullable<LookupResult['error']>;
} {
  if (!email || typeof email !== 'string') {
    return {
      ok: false,
      email: email || '',
      error: {
        type: 'INVALID_EMAIL',
        message: 'Email address is required and must be a string'
      }
    };
  }

  const trimmedEmail = email.trim();
  const idnError = validateInternationalEmail(trimmedEmail);
  if (idnError) {
    if (idnError.code === IDNValidationError.INVALID_ENCODING) {
      return {
        ok: false,
        email: trimmedEmail,
        error: {
          type: 'IDN_VALIDATION_ERROR',
          message: idnError.message,
          idnError: idnError.code
        }
      };
    }
    return {
      ok: false,
      email: trimmedEmail,
      error: {
        type: 'INVALID_EMAIL',
        message: 'Invalid email format'
      }
    };
  }

  const atIndex = trimmedEmail.lastIndexOf('@');
  if (atIndex === -1) {
    return {
      ok: false,
      email: trimmedEmail,
      error: {
        type: 'INVALID_EMAIL',
        message: 'Invalid email format'
      }
    };
  }

  const domain = domainToPunycode(trimmedEmail.slice(atIndex + 1).toLowerCase());
  return { ok: true, trimmedEmail, domain };
}

/**
 * Known-domain lookup matching `getEmailProviderSync` from the Node package.
 * Business-domain DNS detection is intentionally omitted on device.
 */
export function lookupEmailProvider(email: string): LookupResult {
  try {
    const domainMap = getDomainMap();
    const parsed = validateAndParseEmail(email);
    if (!parsed.ok) {
      let normalizedEmail = parsed.email;
      try {
        normalizedEmail = normalizeEmail(parsed.email, domainMap);
      } catch {
        // keep original
      }
      return {
        provider: null,
        email: normalizedEmail,
        error: parsed.error
      };
    }

    const normalizedEmail = normalizeEmail(parsed.trimmedEmail, domainMap, {
      alreadyValidated: true,
      punycodeDomain: parsed.domain
    });
    const provider = domainMap.get(parsed.domain) ?? null;
    const result: LookupResult = {
      provider: simplifyProvider(provider),
      email: normalizedEmail,
      detectionMethod: 'domain_match'
    };

    if (!result.provider) {
      result.error = {
        type: 'UNKNOWN_DOMAIN',
        message: `No email provider found for domain: ${parsed.domain} (sync mode - business domains not supported)`
      };
    }

    return result;
  } catch (error: unknown) {
    return {
      provider: null,
      email,
      error: {
        type: 'INVALID_EMAIL',
        message: error instanceof Error ? error.message : 'Invalid email address'
      }
    };
  }
}
