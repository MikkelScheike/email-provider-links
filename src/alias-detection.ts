/**
 * Email Alias Detection Module
 * 
 * Clean, focused implementation with only essential functions.
 * Detects and normalizes email aliases across different providers.
 */

export interface AliasDetectionResult {
  /** The normalized/canonical email address */
  canonical: string;
  /** The original email address */
  original: string;
  /** Whether an alias was detected */
  isAlias: boolean;
  /** Type of alias detected */
  aliasType: 'plus' | 'dot' | 'none';
  /** The alias part (if any) */
  aliasPart?: string;
  /** The provider that supports this alias type */
  provider?: string;
}

interface AliasRule {
  /** Email domains this rule applies to */
  domains: string[];
  /** Whether this provider supports plus addressing (user+alias@domain.com) */
  supportsPlusAddressing: boolean;
  /** Whether this provider ignores dots in username (user.name@domain.com = username@domain.com) */
  ignoresDots: boolean;
  /** Function to normalize email for this provider */
  normalize?: (email: string) => string;
}

/**
 * Email alias rules for major providers
 */
const ALIAS_RULES: AliasRule[] = [
  {
    domains: ['gmail.com', 'googlemail.com'],
    supportsPlusAddressing: true,
    ignoresDots: true,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      // Remove dots and everything after +
      const cleanUsername = username.replace(/\./g, '').split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.it', 'hotmail.es', 'hotmail.de', 'live.co.uk', 'live.fr', 'live.it', 'live.nl', 'live.com.au', 'live.ca', 'live.jp'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      // Only remove plus addressing for Outlook
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.co.in', 'yahoo.com.br', 'yahoo.co.jp', 'yahoo.it', 'yahoo.de', 'yahoo.in', 'yahoo.es', 'yahoo.ca', 'yahoo.com.au', 'yahoo.com.ar', 'yahoo.com.mx', 'yahoo.co.id', 'yahoo.com.sg', 'ymail.com', 'rocketmail.com'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['fastmail.com', 'fastmail.fm'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['proton.me', 'protonmail.com', 'protonmail.ch', 'pm.me'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['tutanota.com', 'tutanota.de', 'tutamail.com', 'tuta.io', 'keemail.me', 'tuta.com'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['zoho.com', 'zohomail.com', 'zoho.eu'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['icloud.com', 'me.com', 'mac.com'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['mail.com'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['aol.com', 'love.com', 'ygm.com', 'games.com', 'wow.com', 'aim.com'],
    supportsPlusAddressing: false,
    ignoresDots: false,
    normalize: (email: string) => email.toLowerCase()
  },
  {
    domains: ['mail.ru'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['yandex.com', 'yandex.ru'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    normalize: (email: string) => {
      const parts = email.toLowerCase().split('@');
      const username = parts[0];
      const domain = parts[1];
      if (!username || !domain) {
        return email.toLowerCase();
      }
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  }
];

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gets the alias rule for a given domain
 */
function getAliasRule(domain: string): AliasRule | null {
  return ALIAS_RULES.find(rule => 
    rule.domains.includes(domain.toLowerCase())
  ) || null;
}

/**
 * Detects and analyzes email aliases
 * 
 * @param email - Email address to analyze
 * @returns Detailed analysis of the email alias
 */
export function detectEmailAlias(email: string): AliasDetectionResult {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  const originalEmail = email.trim();
  const emailParts = originalEmail.toLowerCase().split('@');
  const username = emailParts[0];
  const domain = emailParts[1];
  
  if (!username || !domain) {
    throw new Error('Invalid email format - missing username or domain');
  }
  
  const rule = getAliasRule(domain);

  const result: AliasDetectionResult = {
    canonical: originalEmail.toLowerCase(),
    original: originalEmail,
    isAlias: false,
    aliasType: 'none'
  };

  if (!rule) {
    // No specific rule, just normalize case
    result.canonical = originalEmail.toLowerCase();
    return result;
  }

  result.provider = domain;

  // Check for plus addressing
  if (rule.supportsPlusAddressing && username.includes('+')) {
    const plusIndex = username.indexOf('+');
    const baseUsername = username.substring(0, plusIndex);
    const aliasPart = username.substring(plusIndex + 1);
    result.isAlias = true;
    result.aliasType = 'plus';
    result.aliasPart = aliasPart;
    result.canonical = rule.normalize ? rule.normalize(originalEmail) : `${baseUsername}@${domain}`;
    return result;
  }

  // Check for dot variations (Gmail)
  if (rule.ignoresDots && username.includes('.')) {
    const baseUsername = username.replace(/\./g, '');
    if (baseUsername !== username) {
      result.isAlias = true;
      result.aliasType = 'dot';
      result.aliasPart = username;
      result.canonical = rule.normalize ? rule.normalize(originalEmail) : `${baseUsername}@${domain}`;
      return result;
    }
  }

  // Apply provider-specific normalization
  if (rule.normalize) {
    const normalized = rule.normalize(originalEmail);
    if (normalized !== originalEmail.toLowerCase()) {
      result.isAlias = true;
      result.canonical = normalized;
    }
  }

  return result;
}

/**
 * Normalizes an email address to its canonical form.
 * 
 * This is the primary function for preventing duplicate accounts.
 * 
 * @param email - Email address to normalize
 * @returns Canonical email address
 * 
 * @example
 * ```typescript
 * const canonical = normalizeEmail('U.S.E.R+work@GMAIL.COM');
 * console.log(canonical); // 'user@gmail.com'
 * ```
 */
export function normalizeEmail(email: string): string {
  const result = detectEmailAlias(email);
  return result.canonical;
}

/**
 * Checks if two email addresses are the same when normalized.
 * 
 * This is the primary function for matching aliases during login.
 * 
 * @param email1 - First email address
 * @param email2 - Second email address
 * @returns true if the emails represent the same person
 * 
 * @example
 * ```typescript
 * const match = emailsMatch('user@gmail.com', 'u.s.e.r+work@gmail.com');
 * console.log(match); // true
 * ```
 */
export function emailsMatch(email1: string, email2: string): boolean {
  try {
    return normalizeEmail(email1) === normalizeEmail(email2);
  } catch {
    return false;
  }
}