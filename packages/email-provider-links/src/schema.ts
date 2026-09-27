/**
 * Provider Data Schema
 * 
 * This represents the compressed format for provider data
 * designed to reduce file size and improve parsing performance.
 */

/**
 * Provider interface
 * Uses compact field names for smaller JSON size
 */
/**
 * Provider types:
 * - public_provider: Regular email providers (Gmail, Yahoo, etc.)
 * - custom_provider: Business email services (Google Workspace, Microsoft 365)
 * - proxy_service: Email proxy services (Cloudflare, etc.)
 */
export type ProviderType = 
  | 'public_provider'  // Regular email providers
  | 'custom_provider'  // Business email services
  | 'proxy_service';   // Email proxy services

export interface Provider {
  /** Provider ID (short identifier) */
  id: string;
  /** Provider display name */
  companyProvider: string;
  /** Login/webmail URL (or null if not available) */
  loginUrl: string | null;
  /** Email domains (omitted if empty) */
  domains?: string[];
  /** DNS detection patterns (flattened) */
  mx?: string[];
  txt?: string[];
  /** Provider type */
  type: ProviderType;
  /** Alias rules for username part */
  alias?: {
    dots?: {
      ignore: boolean;    // true = dots don't matter (gmail), false = dots matter (outlook)
      strip: boolean;     // true = remove dots, false = keep dots
    };
    plus?: {
      ignore: boolean;    // true = plus addressing supported, false = not supported
      strip: boolean;     // true = remove plus part, false = keep plus part
    };
    case?: {
      ignore: boolean;    // true = case doesn't matter, false = case matters
      strip: boolean;     // true = convert to lowercase, false = preserve case
    };
  };
}

/**
 * Providers file structure
 */
export interface ProvidersData {
  /** Schema version for future migrations */
  version: string;
  /** Compressed providers array */
  providers: Provider[];
  /** Metadata */
  meta: {
    count: number;
    domains: number;
    generated: string;
  };
}

/**
 * Common TXT pattern prefixes that can be compressed
 */
export const TXT_PATTERN_COMPRESSION = {
  'v=spf1 include:': 'spf:',
  'v=spf1 ': 'spf1:',
  'google-site-verification=': 'gsv:',
  'MS=ms': 'ms',
  'zoho-verification=': 'zv:',
  'mailgun-verification=': 'mv:'
} as const;

/**
 * Compress TXT patterns by removing common prefixes
 */
export function compressTxtPattern(pattern: string): string {
  for (const [prefix, compressed] of Object.entries(TXT_PATTERN_COMPRESSION)) {
    if (pattern.startsWith(prefix)) {
      return compressed + pattern.substring(prefix.length);
    }
  }
  return pattern;
}

/**
 * Decompress TXT patterns by restoring prefixes
 */
export function decompressTxtPattern(compressed: string): string {
  for (const [prefix, compressedPrefix] of Object.entries(TXT_PATTERN_COMPRESSION)) {
    if (compressed.startsWith(compressedPrefix)) {
      return prefix + compressed.substring(compressedPrefix.length);
    }
  }
  return compressed;
}

/**
 * Validation schema for providers
 */
export function validateProvider(provider: Provider): string[] {
  const errors: string[] = [];
  
  if (!provider.id || typeof provider.id !== 'string') {
    errors.push('Provider ID is required and must be a string');
  }
  
  if (!provider.companyProvider || typeof provider.companyProvider !== 'string') {
    errors.push('Company provider is required and must be a string');
  }
  
  if (provider.loginUrl !== null && (typeof provider.loginUrl !== 'string' || !provider.loginUrl.startsWith('https://'))) {
    errors.push('Login URL must be null or a string starting with HTTPS');
  }
  
  if (provider.domains && !Array.isArray(provider.domains)) {
    errors.push('Domains must be an array');
  }
  
  if (provider.mx && !Array.isArray(provider.mx)) {
    errors.push('MX patterns must be an array');
  }
  
  if (provider.txt && !Array.isArray(provider.txt)) {
    errors.push('TXT patterns must be an array');
  }
  
  return errors;
}
