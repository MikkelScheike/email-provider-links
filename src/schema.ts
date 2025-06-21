/**
 * Optimized Provider Data Schema
 * 
 * This represents the compressed, optimized format for provider data
 * designed to reduce file size and improve parsing performance.
 */

/**
 * Optimized provider interface
 * Reduces field name length and nesting for smaller JSON size
 */
export interface OptimizedProvider {
  /** Provider ID (short identifier) */
  id: string;
  /** Provider display name */
  name: string;
  /** Login/webmail URL */
  url: string;
  /** Email domains (omitted if empty) */
  domains?: string[];
  /** DNS detection patterns (flattened) */
  mx?: string[];
  txt?: string[];
  /** Alias capabilities */
  alias?: {
    dots?: boolean;   // Gmail dot normalization
    plus?: boolean;   // Plus addressing support
  };
}

/**
 * Optimized providers file structure
 */
export interface OptimizedProvidersData {
  /** Schema version for future migrations */
  version: string;
  /** Compressed providers array */
  providers: OptimizedProvider[];
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
 * Validation schema for optimized providers
 */
export function validateOptimizedProvider(provider: OptimizedProvider): string[] {
  const errors: string[] = [];
  
  if (!provider.id || typeof provider.id !== 'string') {
    errors.push('Provider ID is required and must be a string');
  }
  
  if (!provider.name || typeof provider.name !== 'string') {
    errors.push('Provider name is required and must be a string');
  }
  
  if (!provider.url || typeof provider.url !== 'string') {
    errors.push('Provider URL is required and must be a string');
  } else if (!provider.url.startsWith('https://')) {
    errors.push('Provider URL must use HTTPS');
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
