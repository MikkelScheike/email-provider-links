import punycode from 'punycode/punycode.js';

/**
 * ASCII/punycode form of a domain, matching the Node library's fallback:
 * invalid input keeps the lowercased original instead of throwing.
 */
export function domainToPunycode(domain: string): string {
  const lower = domain.toLowerCase();
  try {
    const ascii = punycode.toASCII(lower);
    return ascii || lower;
  } catch {
    return lower;
  }
}
