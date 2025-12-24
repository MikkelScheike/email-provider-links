/**
 * Email validation constants based on RFC 5321
 * 
 * These limits are defined in RFC 5321 Section 4.5.3.1:
 * - Maximum total email length: 254 characters
 * - Maximum local part length: 64 characters  
 * - Maximum domain length: 253 characters
 */
export const EmailLimits = {
  /** Maximum total email address length (local + @ + domain) */
  MAX_EMAIL_LENGTH: 254,
  /** Maximum local part length (before @) */
  MAX_LOCAL_PART_LENGTH: 64,
  /** Maximum domain length (after @) */
  MAX_DOMAIN_LENGTH: 253,
} as const;

/**
 * Memory calculation constants
 */
export const MemoryConstants = {
  /** Bytes per kilobyte */
  BYTES_PER_KB: 1024,
  /** Kilobytes per megabyte */
  KB_PER_MB: 1024,
} as const;

