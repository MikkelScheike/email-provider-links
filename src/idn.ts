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
