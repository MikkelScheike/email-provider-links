/**
 * Email Alias Detection Module
 * 
 * Detects and normalizes email aliases across different providers.
 * Supports plus addressing (+), dot variations, and provider-specific aliasing.
 */

export interface AliasDetectionResult {
  /** The normalized/canonical email address */
  canonical: string;
  /** The original email address */
  original: string;
  /** Whether an alias was detected */
  isAlias: boolean;
  /** Type of alias detected */
  aliasType: 'plus' | 'dot' | 'subdomain' | 'none';
  /** The alias part (if any) */
  aliasPart?: string;
  /** The provider that supports this alias type */
  provider?: string;
}

export interface AliasRule {
  /** Email domains this rule applies to */
  domains: string[];
  /** Whether this provider supports plus addressing (user+alias@domain.com) */
  supportsPlusAddressing: boolean;
  /** Whether this provider ignores dots in username (user.name@domain.com = username@domain.com) */
  ignoresDots: boolean;
  /** Whether this provider supports subdomain aliases (user@alias.domain.com) */
  supportsSubdomainAlias: boolean;
  /** Custom alias patterns specific to this provider */
  customPatterns?: RegExp[];
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
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      // Remove dots and everything after +
      const cleanUsername = username.replace(/\./g, '').split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.it', 'hotmail.es', 'hotmail.de', 'live.co.uk', 'live.fr', 'live.it', 'live.nl', 'live.com.au', 'live.ca', 'live.jp'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      // Only remove plus addressing for Outlook
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.co.in', 'yahoo.com.br', 'yahoo.co.jp', 'yahoo.it', 'yahoo.de', 'yahoo.in', 'yahoo.es', 'yahoo.ca', 'yahoo.com.au', 'yahoo.com.ar', 'yahoo.com.mx', 'yahoo.co.id', 'yahoo.com.sg', 'ymail.com', 'rocketmail.com'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['fastmail.com', 'fastmail.fm'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: true,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['proton.me', 'protonmail.com', 'protonmail.ch', 'pm.me'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['tutanota.com', 'tutanota.de', 'tutamail.com', 'tuta.io', 'keemail.me', 'tuta.com'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['zoho.com', 'zohomail.com', 'zoho.eu'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['icloud.com', 'me.com', 'mac.com'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['mail.com'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['aol.com', 'love.com', 'ygm.com', 'games.com', 'wow.com', 'aim.com'],
    supportsPlusAddressing: false,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => email.toLowerCase()
  },
  {
    domains: ['mail.ru'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
      const cleanUsername = username.split('+')[0];
      return `${cleanUsername}@${domain}`;
    }
  },
  {
    domains: ['yandex.com', 'yandex.ru'],
    supportsPlusAddressing: true,
    ignoresDots: false,
    supportsSubdomainAlias: false,
    normalize: (email: string) => {
      const [username, domain] = email.toLowerCase().split('@');
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
function getAliasRule(domain: string): AliasRule | undefined {
  return ALIAS_RULES.find(rule => 
    rule.domains.includes(domain.toLowerCase())
  );
}

/**
 * Detects and analyzes email aliases
 */
export function detectEmailAlias(email: string): AliasDetectionResult {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  const originalEmail = email.trim();
  const [username, domain] = originalEmail.toLowerCase().split('@');
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
 * Normalizes an email address to its canonical form
 */
export function normalizeEmail(email: string): string {
  const result = detectEmailAlias(email);
  return result.canonical;
}

/**
 * Checks if two email addresses are the same when normalized
 */
export function emailsMatch(email1: string, email2: string): boolean {
  try {
    return normalizeEmail(email1) === normalizeEmail(email2);
  } catch {
    return false;
  }
}

/**
 * Gets alias capabilities for a domain
 */
export function getAliasCapabilities(domain: string): AliasRule | null {
  const rule = getAliasRule(domain.toLowerCase());
  return rule ? { ...rule } : null;
}

/**
 * Generates potential aliases for an email address
 */
export function generateAliases(email: string, options: {
  plusAliases?: string[];
  includeDotVariations?: boolean;
  maxDotVariations?: number;
} = {}): string[] {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  const [username, domain] = email.toLowerCase().split('@');
  const rule = getAliasRule(domain);
  const aliases: string[] = [];

  if (!rule) {
    return [email.toLowerCase()];
  }

  // Generate plus aliases
  if (rule.supportsPlusAddressing && options.plusAliases) {
    for (const alias of options.plusAliases) {
      aliases.push(`${username}+${alias}@${domain}`);
    }
  }

  // Generate dot variations (Gmail only)
  if (rule.ignoresDots && options.includeDotVariations && username.length > 1) {
    const maxVariations = Math.min(options.maxDotVariations ?? 5, username.length - 1);
    const variations = new Set<string>();
    
    // Simple dot variations (insert dots between characters)
    for (let i = 1; i < username.length && variations.size < maxVariations; i++) {
      const withDot = username.slice(0, i) + '.' + username.slice(i);
      variations.add(`${withDot}@${domain}`);
    }
    
    aliases.push(...Array.from(variations));
  }

  return aliases.length > 0 ? aliases : [email.toLowerCase()];
}

/**
 * Analyzes email aliasing patterns in a list of emails
 */
export function analyzeEmailAliases(emails: string[]): {
  totalEmails: number;
  uniqueCanonical: number;
  aliasGroups: Array<{
    canonical: string;
    aliases: string[];
    count: number;
  }>;
  providerStats: Record<string, {
    total: number;
    aliases: number;
    types: Record<string, number>;
  }>;
} {
  const canonicalMap = new Map<string, string[]>();
  const providerStats: Record<string, any> = {};

  for (const email of emails) {
    try {
      const result = detectEmailAlias(email);
      const canonical = result.canonical;
      
      if (!canonicalMap.has(canonical)) {
        canonicalMap.set(canonical, []);
      }
      canonicalMap.get(canonical)!.push(email);

      // Update provider stats
      if (result.provider) {
        if (!providerStats[result.provider]) {
          providerStats[result.provider] = {
            total: 0,
            aliases: 0,
            types: {}
          };
        }
        providerStats[result.provider].total++;
        if (result.isAlias) {
          providerStats[result.provider].aliases++;
          const type = result.aliasType;
          providerStats[result.provider].types[type] = (providerStats[result.provider].types[type] || 0) + 1;
        }
      }
    } catch {
      // Skip invalid emails
    }
  }

  const aliasGroups = Array.from(canonicalMap.entries()).map(([canonical, aliases]) => ({
    canonical,
    aliases,
    count: aliases.length
  })).sort((a, b) => b.count - a.count);

  return {
    totalEmails: emails.length,
    uniqueCanonical: canonicalMap.size,
    aliasGroups,
    providerStats
  };
}
