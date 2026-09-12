# Email Provider Links

[![npm version](https://img.shields.io/npm/v/%40mikkelscheike%2Femail-provider-links)](https://www.npmjs.com/package/@mikkelscheike/email-provider-links)

> **Generate direct login links for any email address across 140+ providers (Gmail, Outlook, Yahoo, etc.) to streamline user authentication flows.**

A TypeScript library providing login URLs for **140 email providers** (259 domains) with concurrent DNS detection for business domains, email alias normalization, and HTTPS login-URL validation.

## 🚀 Try it out

**[Live Demo](https://demo.mikkelscheike.com)** - Test the library with any email address and see it in action!

## ✨ Core Features

- 🚀 **Fast & Lightweight**: Zero runtime dependencies, ~43KB packed
- 📧 **140 Email Providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, and many more
- 🌐 **259 Domains Supported**: Broad international coverage
- 🌍 **Full IDN Support**: International domain names with Punycode
- ✅ **Email Validation**: International email validation with detailed error reporting
- 🏢 **Business Domain Detection**: DNS-based detection for custom domains (Google Workspace, Microsoft 365, etc.)
- 🔒 **URL Safety**: HTTPS-only login URLs with host allowlisting and malicious pattern checks
- 🛡️ **Build Integrity**: SHA-256 hash gate on provider data in CI/build (npm provenance for publishes)
- 📝 **Type Safe**: Full TypeScript support with overloads for simplified vs extended responses
- ⚡ **Performance Oriented**: Smart DNS fallback with configurable timeouts
- 🚦 **DNS Rate Limiting**: Process-wide limiter (default 10 detections / minute)
- 🔄 **Automatic Email Normalization**: Provider-specific alias rules applied in detection results
- 🔄 **Email Alias Detection**: Normalize Gmail dots, plus addressing, and provider-specific aliases
- 📦 **Batch Processing**: Efficiently process multiple emails with deduplication
- 🤫 **Quiet runtime**: Detection and provider load do not write to stdout/stderr; errors are on the result object
- 🧪 **Thoroughly Tested**: 439 tests plus 1 skipped live-DNS test (~89% statement coverage with Vitest v8)

## Installation

Install with any client (npm, yarn, or pnpm). The published package is CommonJS with zero runtime dependencies:

```bash
npm install @mikkelscheike/email-provider-links
```

## Requirements

- **Node.js**: `>=22.12.0` (Vitest 5 and this package). CI runs the full suite on 22.x, 24.x, and 26.x.
- **TypeScript**: `>=4.0.0` (optional, but recommended)
- **Zero runtime dependencies** - No external packages required

### Node.js 24/26 Support

Tested on Node.js 22.x (Maintenance LTS), 24.x (Active LTS), and **26.x** (Current). Node.js 18, 20, and 25 are not supported.

## Supported Providers

**140 providers supporting 259 domains** including:

- **Major Providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, Tutanota
- **Business Email**: Microsoft 365, Google Workspace, Amazon WorkMail (via DNS detection)
- **International**: GMX, Web.de, QQ Mail, Yandex, Naver, and 100+ more
- **Privacy-focused**: ProtonMail, Tutanota, Hushmail, SimpleLogin, AnonAddy

See the full provider list in the [Advanced Usage](#advanced-usage) section.

## Quick Start

```typescript
import { getEmailProvider } from '@mikkelscheike/email-provider-links';

// Get provider info for any email
const result = await getEmailProvider('user@gmail.com');
console.log(result.provider?.loginUrl); // "https://mail.google.com/mail/"

// Works with business domains too (via DNS lookup)
const business = await getEmailProvider('user@company.com');
console.log(business.provider?.companyProvider); // "Google Workspace" or "Microsoft 365"
```

**Key Features:**
- ✨ **Automatic Email Normalization**: Emails are normalized using provider-specific rules (e.g., `user+tag@gmail.com` → `user@gmail.com`)
- 📦 **Simplified Response (Default)**: Returns only essential fields. Use `{ extended: true }` for full provider details
- 🚀 **Fast**: Known providers detected instantly, business domains via concurrent DNS lookups

## API Reference

### Core Functions

#### `getEmailProvider(email, options?)`
**Recommended** - Complete provider detection with business domain support.

Error notes:
- `INVALID_EMAIL` is returned for common malformed inputs (e.g. missing `@`, missing TLD).
- `IDN_VALIDATION_ERROR` is reserved for true encoding issues.

```typescript
// Default: Simplified response (recommended for frontend)
const result1 = await getEmailProvider('user@gmail.com');
// Returns: {
//   provider: { companyProvider: "Gmail", loginUrl: "https://mail.google.com/mail/", type: "public_provider" },
//   email: "user@gmail.com",
//   detectionMethod: "domain_match"
// }

// Email normalization is automatic
const result2 = await getEmailProvider('user+tag@gmail.com');
// Returns: {
//   provider: { companyProvider: "Gmail", loginUrl: "https://mail.google.com/mail/", type: "public_provider" },
//   email: "user@gmail.com",  // Normalized
//   detectionMethod: "domain_match"
// }

// Extended response (includes domains, alias config, etc.)
const extended = await getEmailProvider('user@gmail.com', { extended: true });
// Returns: {
//   provider: {
//     companyProvider: "Gmail",
//     loginUrl: "https://mail.google.com/mail/",
//     domains: ["gmail.com", "googlemail.com"],  // Only in extended
//     alias: { dots: { ignore: true, strip: false }, ... },  // Only in extended
//     type: "public_provider"
//   },
//   email: "user@gmail.com",
//   loginUrl: "https://mail.google.com/mail/",  // Top-level loginUrl only in extended
//   detectionMethod: "domain_match"
// }

// Business domains (DNS lookup with timeout)
const result3 = await getEmailProvider('user@company.com', { timeout: 2000 });
// Returns: {
//   provider: { companyProvider: "Google Workspace", loginUrl: "...", type: "custom_provider" },
//   email: "user@company.com",
//   detectionMethod: "mx_record"
// }
```

#### `getEmailProviderSync(email, options?)`
**Fast** - Instant checks for known providers (no DNS lookup). Synchronous version for when you can't use async.

```typescript
// Default: Simplified response
const result = getEmailProviderSync('user@outlook.com');
// Returns: {
//   provider: { companyProvider: "Outlook", loginUrl: "https://outlook.live.com/", type: "public_provider" },
//   email: "user@outlook.com",
//   detectionMethod: "domain_match"
// }

// Email normalization is automatic
const result2 = getEmailProviderSync('u.s.e.r+tag@gmail.com');
// Returns: {
//   provider: { companyProvider: "Gmail", loginUrl: "https://mail.google.com/mail/", type: "public_provider" },
//   email: "user@gmail.com",  // Normalized
//   detectionMethod: "domain_match"
// }

// Extended response (includes domains, alias config, etc.)
const extended = getEmailProviderSync('user@gmail.com', { extended: true });
// Returns full provider object with domains array and alias configuration
```

#### `getEmailProviderFast(email, options?)`
**Performance-focused** - Enhanced provider detection with performance metrics (`timing`, `confidence`, `debug`) for monitoring and debugging.

```typescript
// Default: Simplified response with performance metrics
const result = await getEmailProviderFast('user@gmail.com');
// Returns: {
//   provider: { companyProvider: "Gmail", loginUrl: "https://mail.google.com/mail/", type: "public_provider" },
//   email: "user@gmail.com",
//   detectionMethod: "domain_match",
//   timing: { mx: 0, txt: 0, total: 0 },  // DNS query timings (0ms for known providers)
//   confidence: 1.0                        // Confidence score (0-1)
// }

// Extended response with performance metrics
const extended = await getEmailProviderFast('user@gmail.com', { extended: true });
// Returns full provider object (domains, alias config, etc.) plus timing and confidence

// Business domain with debug info enabled
const business = await getEmailProviderFast('user@company.com', {
  timeout: 2000,
  enableParallel: true,
  collectDebugInfo: true,
  extended: true
});
// Returns: {
//   provider: { ...full provider details... },
//   email: "user@company.com",
//   detectionMethod: "mx_record",
//   timing: { mx: 120, txt: 95, total: 125 },  // Actual DNS query times
//   confidence: 0.95,                          // Confidence based on DNS match quality
//   debug: {                                    // Detailed DNS query information
//     mxMatches: ["aspmx.l.google.com"],
//     txtMatches: [],
//     queries: [...],
//     fallbackUsed: false
//   }
// }
```

**Options:**
- `timeout?: number` - DNS query timeout in milliseconds (default: 5000)
- `enableParallel?: boolean` - Enable parallel MX/TXT lookups for faster detection (default: true)
- `collectDebugInfo?: boolean` - Include detailed debug information in result (default: false)
- `extended?: boolean` - Return full provider details including domains and alias configuration (default: false)

**When to use `getEmailProviderFast`:**
- You need performance metrics (timing, confidence) for monitoring
- You're debugging DNS detection issues
- You want fine-grained control over DNS query behavior
- You're building performance dashboards or analytics

**Note**: For most use cases, `getEmailProvider()` is sufficient. Use `getEmailProviderFast()` when you specifically need the performance metrics or debugging capabilities.

## Real-World Example

```typescript
async function handlePasswordReset(email: string) {
  // Validate email first
  const validation = validateEmailAddress(email);
  if (!validation.isValid) {
    throw new Error(`Invalid email: ${validation.error?.message}`);
  }

  // Get provider information (default: simplified response)
  // Email is automatically normalized in result
  const result = await getEmailProvider(email);
  
  return {
    providerUrl: result.provider?.loginUrl || null,  // Access loginUrl from provider object
    providerName: result.provider?.companyProvider || null,
    normalizedEmail: result.email, // Already normalized (e.g., 'user@gmail.com' from 'user+tag@gmail.com')
    isSupported: result.provider !== null,
    detectionMethod: result.detectionMethod
  };
}

// If you need full provider details (domains, alias config, etc.)
async function analyzeEmailProvider(email: string) {
  const result = await getEmailProvider(email, { extended: true });
  
  // Access full provider details
  if (result.provider) {
    console.log('All domains:', result.provider.domains);
    console.log('Alias rules:', result.provider.alias);
  }
  
  return result;
}
```

## Configuration

```typescript
// Custom DNS timeout (default: 5000ms)
const result = await getEmailProvider(email, { timeout: 2000 });

// Extended response with custom timeout
const extended = await getEmailProvider(email, { timeout: 2000, extended: true });

// Rate limiting configuration
import { Config } from '@mikkelscheike/email-provider-links';
console.log('Max requests:', Config.MAX_DNS_REQUESTS_PER_MINUTE); // 10
console.log('Default timeout:', Config.DEFAULT_DNS_TIMEOUT);       // 5000ms
```

## Advanced Usage

<details>
<summary><strong>📚 Advanced Features & Specialized Use Cases</strong></summary>

### Library Statistics

```typescript
import { getLibraryStats, getSupportedProviders } from '@mikkelscheike/email-provider-links';

const stats = getLibraryStats();
console.log(`Version ${stats.version} supports ${stats.providerCount} providers`);

const providers = getSupportedProviders();
console.log(`Total providers: ${providers.length}`);
```

### Email Alias Detection & Normalization

The library automatically normalizes emails using provider-specific rules. For example, `user+tag@gmail.com` becomes `user@gmail.com` because Gmail ignores plus addressing.

```typescript
import { normalizeEmail, emailsMatch } from '@mikkelscheike/email-provider-links';

// Normalize emails to canonical form
const canonical = normalizeEmail('u.s.e.r+work@gmail.com');
console.log(canonical); // 'user@gmail.com'

// Check if two emails are the same (accounting for aliases)
emailsMatch('user.name@gmail.com', 'username@gmail.com'); // true (Gmail ignores dots)
emailsMatch('user.name@outlook.com', 'username@outlook.com'); // false (Outlook preserves dots)

// Provider-specific rules:
// - Gmail: Ignores dots and plus addressing
// - Outlook: Preserves dots, ignores plus addressing
// - Yahoo: Preserves dots, ignores plus addressing
// - Most others: Preserve everything except case
```

### Provider Support Checking

```typescript
import { isEmailProviderSupported, extractDomain } from '@mikkelscheike/email-provider-links';

// Check if provider is supported
const supported = isEmailProviderSupported('user@gmail.com');

// Extract domain safely
const domain = extractDomain('USER@EXAMPLE.COM');
console.log(domain); // 'example.com'
```

</details>

## Quiet runtime

`getEmailProvider`, `getEmailProviderSync`, `getEmailProviderFast`, and provider loading do **not** print to the console. Failures are returned on the result (`error`) or `securityReport`. Maintainer CLI scripts (`pnpm run verify-hashes`, `pnpm run update-hashes`) still log on purpose.

## Developing this repository

This repo uses **pnpm** (see `packageManager` in `package.json`). Consumers can still install the published package with npm, yarn, or pnpm.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm run build
```

- Tests: Vitest 5 (`vitest.config.mts`). Requires Node.js `>= 22.12`.
- Coverage: `pnpm run test:coverage` writes `coverage/lcov.info` for Codecov.
- Release prep (maintainers): `pnpm exec tsx scripts/prepare-semantic-release.ts --patch` (or `--minor` / `--major`). Semantic-release assigns the version in CI.

## Performance and Detection System

### Performance Benchmarks

Extensively optimized for both speed and memory efficiency:

**Speed Metrics**:
- Initial provider load: ~0.5ms
- Known provider lookup: <1ms
- DNS-based detection: ~10ms average
- Batch processing: 1000 operations in ~1.1ms
- Email validation: <1ms for complex IDN domains

**Memory Management**:
- Initial load: ~0.17MB heap usage (measured with `pnpm run benchmark:memory`)
- Batch operations: ~0.00009MB heap per 1000 sync lookups
- Maximum load: < 25MB under heavy concurrent operations
- Cache efficiency: DNS result cache (TTL + max 256 entries) plus in-process detector reuse
- Garbage collection: Automatic optimization

**Real-World Performance**:
- 50,000+ operations/second for known providers
- 100 concurrent DNS lookups in <1 second
- Average latency: <1ms for cached lookups
- Maximum latency: <25ms per lookup

To run benchmarks:
```bash
# Memory usage benchmark
pnpm run benchmark:memory

# DNS performance benchmark
pnpm run benchmark:dns

# Both scripts are available in the scripts/ directory
# and can be modified for custom performance testing
```

### Live DNS verification (optional)

There is an optional test suite that performs real DNS lookups for all domains in `providers/emailproviders.json`. This test is skipped by default but can be enabled easily:

```bash
# Run all tests including live DNS verification
pnpm run test:live-dns

# Run only the live DNS test
pnpm run test:live-dns -- __tests__/provider-live-dns.test.ts
```

**Note**: The live DNS test performs actual network requests and may take a few seconds to complete. Some performance tests may fail when live DNS is enabled due to network latency.

Optional strict mode (also validates configured MX/TXT patterns):

```bash
RUN_LIVE_DNS_STRICT=1 pnpm run test:live-dns -- __tests__/provider-live-dns.test.ts
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on adding new email providers.

**Quality Assurance**: This project maintains 439 passing tests plus 1 skipped live-DNS test (~89% statement coverage with Vitest v8).

**Security**: Login URLs are HTTPS-only and host-allowlisted. Provider JSON integrity is verified in the build pipeline; published packages use npm provenance. See [Security Policy](docs/SECURITY.md).

## Security

For security concerns or to report vulnerabilities, see our [Security Policy](docs/SECURITY.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Zero dependencies • TypeScript-first • Production ready • International support**
