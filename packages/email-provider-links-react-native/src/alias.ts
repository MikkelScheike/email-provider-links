import { domainToPunycode } from './punycode';
import type { KnownProvider } from './types';
import { validateInternationalEmail } from './validate-email';

export interface NormalizeEmailOptions {
  alreadyValidated?: boolean;
  punycodeDomain?: string;
}

function assertValidEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email format');
  }

  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error('Invalid email format');
  }

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    throw new Error('Invalid email format');
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (!local || /\s|@/.test(local) || local.length > 64) {
    throw new Error('Invalid email format');
  }

  const domainError = validateInternationalEmail(`a@${domain}`);
  if (domainError) {
    throw new Error('Invalid email format');
  }
}

export function normalizeEmail(
  email: string,
  domainMap: Map<string, KnownProvider>,
  options: NormalizeEmailOptions = {}
): string {
  if (email == null || typeof email !== 'string') {
    return email as string;
  }

  const trimmed = email.trim();
  if (trimmed === '') {
    return '';
  }

  try {
    if (!options.alreadyValidated) {
      assertValidEmail(trimmed);
    }

    const atIndex = trimmed.lastIndexOf('@');
    const username = trimmed.slice(0, atIndex).toLowerCase();
    const domain = options.punycodeDomain || domainToPunycode(trimmed.slice(atIndex + 1).toLowerCase());

    if (!username || !domain) {
      throw new Error('Invalid email format - missing username or domain');
    }

    const provider = domainMap.get(domain);
    if (!provider?.alias) {
      return `${username}@${domain}`;
    }

    let normalizedUsername = username;

    if (provider.alias.case?.ignore && provider.alias.case.strip) {
      normalizedUsername = normalizedUsername.toLowerCase();
    }

    if (provider.alias.plus?.ignore) {
      const plusIndex = username.indexOf('+');
      if (plusIndex !== -1 && provider.alias.plus.strip) {
        normalizedUsername = username.slice(0, plusIndex);
      }
    }

    if (provider.alias.dots?.ignore && provider.alias.dots.strip && username.includes('.')) {
      normalizedUsername = normalizedUsername.replace(/\./g, '');
    }

    return `${normalizedUsername}@${domain}`;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid email format')) {
      return trimmed;
    }
    return trimmed.toLowerCase();
  }
}
