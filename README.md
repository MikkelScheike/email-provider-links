# Email Provider Links

🔒 **Modern email provider detection library with concurrent DNS resolution and enterprise security**

A TypeScript library providing direct links to **93 email providers** (178 domains) with **concurrent DNS resolution**, **optimized performance**, **email alias detection**, and comprehensive security features for login and password reset flows.

## ✨ Features

- 🚀 **Fast & Lightweight**: Zero dependencies, ultra-low memory (~0.39MB initial, ~0.02MB per 1000 ops)
- 📧 **93 Email Providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, and many more
- 🌐 **178 Domains Supported**: Comprehensive international coverage
- 🌍 **IDN Support**: Full internationalized domain name (punycode) support with RFC compliance
- ✅ **Email Validation**: International email validation following RFC 5321, 5322, and 6530 standards
- 🏢 **Business Domain Detection**: DNS-based detection for custom domains (Google Workspace, Microsoft 365, etc.)
- 🔒 **Enterprise Security**: Multi-layer protection against malicious URLs and supply chain attacks
- 🛡️ **URL Validation**: HTTPS-only enforcement with domain allowlisting
- 🔐 **Integrity Verification**: Cryptographic hash verification for data integrity
- 📝 **Type Safe**: Full TypeScript support with comprehensive interfaces
- ⚡ **Performance Optimized**: Smart DNS fallback with configurable timeouts
- 🚦 **Rate Limiting**: Built-in DNS query rate limiting to prevent abuse
- 🔄 **Email Alias Detection**: Normalize Gmail dots, plus addressing, and provider-specific aliases
- 🛡️ **Fraud Prevention**: Detect duplicate accounts through email alias manipulation
- 🧪 **Thoroughly Tested**: 370 tests with 92.89% code coverage

## Installation

Using npm:
```bash
npm install @mikkelscheike/email-provider-links
```

## Requirements

- **Node.js**: `>=18.0.0` (Tested on 18.x, 20.x, 22.x, **24.x**)
- **TypeScript**: `>=4.0.0` (optional)
- **Zero runtime dependencies** - No external packages required

### Node.js 24 Support ✨

Fully compatible with the latest Node.js 24.x! The library is tested on:
- Node.js 18.x (LTS)
- Node.js 20.x (LTS) 
- Node.js 22.x (Current)
- **Node.js 24.x (Latest)** - Full support with latest features

## Quick Start

**One function handles everything** - consumer emails, business domains, and unknown providers:

```typescript
import { getEmailProvider } from '@mikkelscheike/email-provider-links';

// Works for ANY email address - the only function you need
const result = await getEmailProvider('user@gmail.com');
console.log(result.loginUrl);                    // "https://mail.google.com/mail/"
console.log(result.provider?.companyProvider);   // "Gmail"

// Automatically detects business domains too
const business = await getEmailProvider('user@mycompany.com');
console.log(business.provider?.companyProvider); // "Google Workspace" (if detected)

// Gracefully handles unknown providers
const unknown = await getEmailProvider('user@unknown.com');
console.log(unknown.loginUrl);                   // null
```

## Supported Providers

**📊 Current Coverage: 93 providers supporting 178 domains**

**Consumer Email Providers:**
- **Gmail** (2 domains): gmail.com, googlemail.com
- **Microsoft Outlook** (15 domains): outlook.com, hotmail.com, live.com, msn.com, and 11 more
- **Yahoo Mail** (19 domains): yahoo.com, yahoo.co.uk, yahoo.fr, ymail.com, rocketmail.com, and 14 more
- **ProtonMail** (4 domains): proton.me, protonmail.com, protonmail.ch, pm.me
- **iCloud Mail** (3 domains): icloud.com, me.com, mac.com
- **Tutanota** (6 domains): tutanota.com, tutanota.de, tutamail.com, tuta.io, keemail.me, tuta.com
- **SimpleLogin** (10 domains): simplelogin.io, 8alias.com, aleeas.com, slmail.me, and 6 more
- **FastMail, Zoho Mail, AOL Mail, GMX, Web.de, Mail.ru, QQ Mail, NetEase, Yandex**, and many more

**Business Email (via DNS detection):**
- **Microsoft 365** (Business domains via MX/TXT records)
- **Google Workspace** (Custom domains via DNS patterns)
- **Amazon WorkMail** (AWS email infrastructure via awsapps.com patterns)
- **Zoho Workplace, FastMail Business, GoDaddy Email, Bluehost Email**
- **ProtonMail Business, Rackspace Email, IONOS**, and others

**Security & Privacy Focused:**
- **ProtonMail, Tutanota, Hushmail, CounterMail, Posteo**
- **Mailfence, SimpleLogin, AnonAddy**

**International Providers:**
- **Europe**: GMX, Web.de, Orange, Free.fr, T-Online, Libero, Virgilio, Telekom, Tiscali, Skynet, Telenet, Xs4All, Planet.nl, Bluewin, Eircom
- **Asia**: QQ Mail, NetEase, Sina Mail, Alibaba Mail, Rakuten, Nifty, **Naver** (Korea), **Daum** (Korea), **Biglobe** (Japan), Sify, IndiatTimes (India)
- **Eastern Europe**: Centrum (Czech/Slovak), Interia, Onet (Poland), Rambler (Russia)
- **Other Regions**: UOL, Terra (Brazil), Telkom (South Africa), Xtra (New Zealand)

## API

### `getEmailProvider(email, timeout?)`
**Recommended** - Detects any email provider including business domains.

```typescript
// 🚀 SAME CALL, DIFFERENT SCENARIOS:

// ✅ For known providers (Gmail, Yahoo, etc.) - INSTANT response
const gmail1 = await getEmailProvider('user@gmail.com');        // No timeout needed
const gmail2 = await getEmailProvider('user@gmail.com', 3000);  // Same speed - timeout ignored
// Both return instantly: { provider: "Gmail", loginUrl: "https://mail.google.com/mail/" }

// 🔍 For business domains - DNS lookup required, timeout matters
const biz1 = await getEmailProvider('user@mycompany.com');        // 5000ms timeout (default)
const biz2 = await getEmailProvider('user@mycompany.com', 2000);  // 2000ms timeout (faster fail)
const biz3 = await getEmailProvider('user@mycompany.com', 10000); // 10000ms timeout (slower networks)
// All may detect: { provider: "Google Workspace", detectionMethod: "mx_record" }

// 🎯 WHY USE CUSTOM TIMEOUT?
// - Faster apps: Use 2000ms to fail fast on unknown domains
// - Slower networks: Use 10000ms to avoid premature timeouts
// - Enterprise: Use 1000ms for strict SLA requirements
```

### `getEmailProviderSync(email)`
**Synchronous** - Only checks predefined domains (no DNS lookup).

```typescript
const result = getEmailProviderSync('user@gmail.com');
// Returns: { provider, loginUrl, email }
```

## Real-World Example

```typescript
async function handlePasswordReset(email: string) {
  const result = await getEmailProvider(email);
  
  return {
    providerUrl: result.loginUrl,
    providerName: result.provider?.companyProvider || null,
    isSupported: result.provider !== null
  };
}
```


## Configuration

```typescript
// Custom DNS timeout (default: 5000ms)
const result = await getEmailProvider(email, 2000);

// Rate limiting configuration
import { Config } from '@mikkelscheike/email-provider-links';
console.log('Max requests:', Config.MAX_DNS_REQUESTS_PER_MINUTE); // 10
console.log('Default timeout:', Config.DEFAULT_DNS_TIMEOUT);       // 5000ms
```

## Email Validation

The library includes comprehensive email validation following international standards:

```typescript
import { validateInternationalEmail } from '@mikkelscheike/email-provider-links';

// Validate any email address
const result = validateInternationalEmail('user@example.com');

// Returns undefined for valid emails
console.log(result); // undefined

// Returns detailed error information for invalid emails
const invalid = validateInternationalEmail('user@münchen.com');
if (invalid) {
  console.log(invalid.code);    // IDN_VALIDATION_ERROR
  console.log(invalid.message); // Human-readable error message
}
```

### Validation Features

- ✅ **RFC Compliance**: Follows RFC 5321, 5322, and 6530 standards
- 🌍 **International Support**: Full IDN (Punycode) validation
- 📝 **Detailed Errors**: Clear, translatable error messages
- 🔍 **Comprehensive Checks**:
  - Local part validation (username)
  - Domain format validation
  - IDN encoding validation
  - Length limits (local part, domain, total)
  - TLD validation

## Advanced Usage

<details>
<summary><strong>📚 Secondary Functions & Specialized Use Cases</strong></summary>

### Synchronous Provider Detection (No DNS)

If you can't use async or don't want DNS lookups:

```typescript
import { getEmailProviderSync } from '@mikkelscheike/email-provider-links';

// Synchronous - only checks predefined domains
const result = getEmailProviderSync('user@gmail.com');
console.log(result.loginUrl); // Works for known domains only
```

### Provider Support Checking

```typescript
import { isEmailProviderSupported, getSupportedProviders } from '@mikkelscheike/email-provider-links';

// Check if provider is supported
const supported = isEmailProviderSupported('user@gmail.com');

// Get all supported providers
const allProviders = getSupportedProviders();
console.log(`Supports ${allProviders.length} providers`);
```

### Advanced Provider Detection

```typescript
import { getEmailProviderFast, detectProviderConcurrent } from '@mikkelscheike/email-provider-links';

// High-performance detection with concurrent DNS
const fastResult = await getEmailProviderFast('user@mycompany.com', {
  enableParallel: true,
  collectDebugInfo: true
});
console.log(fastResult.provider?.companyProvider); // "Google Workspace"
console.log(fastResult.timing);                    // Performance metrics
```

### Configuration Options

```typescript
import { Config } from '@mikkelscheike/email-provider-links';

// Access configuration constants
console.log(Config.DEFAULT_DNS_TIMEOUT);           // 5000ms
console.log(Config.MAX_DNS_REQUESTS_PER_MINUTE);   // 10
console.log(Config.SUPPORTED_PROVIDERS_COUNT);     // 93
```

### 🔄 Email Alias Detection & Normalization

**Specialized feature** for preventing duplicate accounts and fraud detection:

```typescript
import { 
  normalizeEmail, 
  emailsMatch 
} from '@mikkelscheike/email-provider-links';

// Prevent duplicate accounts
async function registerUser(email: string) {
  const canonical = normalizeEmail(email);
  const existingUser = await findUserByEmail(canonical);
  
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  await createUser({ email: canonical });
}

// Check if login email matches registration
const match = emailsMatch('user@gmail.com', 'u.s.e.r+work@gmail.com');
console.log(match); // true - same person

// Simple normalization
const canonical = normalizeEmail('u.s.e.r+work@gmail.com');
console.log(canonical);  // 'user@gmail.com'
```

**Supported alias types:**
- **Gmail dots**: `u.s.e.r@gmail.com` → `user@gmail.com`
- **Plus addressing**: `user+tag@provider.com` → `user@provider.com`
- **Provider-specific rules**: Different providers have different capabilities

</details>

## TypeScript Support

```typescript
interface EmailProviderResult {
  provider: EmailProvider | null;
  email: string;
  loginUrl: string | null;
  detectionMethod?: 'domain_match' | 'mx_record' | 'txt_record' | 'proxy_detected';
  proxyService?: string;
  error?: {
    type: 'INVALID_EMAIL' | 'DNS_TIMEOUT' | 'RATE_LIMITED' | 'UNKNOWN_DOMAIN' | 
          'NETWORK_ERROR' | 'IDN_VALIDATION_ERROR';
    message: string;
    idnError?: string;  // Specific IDN validation error message
  };
}

interface ConfigConstants {
  DEFAULT_DNS_TIMEOUT: number;          // 5000ms
  MAX_DNS_REQUESTS_PER_MINUTE: number;  // 10 requests
  SUPPORTED_PROVIDERS_COUNT: number;    // 93 providers
  SUPPORTED_DOMAINS_COUNT: number;      // 178 domains
}
```

## 🛡️ Security Features

This package implements **enterprise-grade security** to protect against malicious redirects and supply chain attacks:

### ✅ Multi-Layer Protection

- **HTTPS-Only Enforcement**: All provider URLs must use HTTPS protocol
- **Domain Allowlisting**: Only pre-approved domains are allowed (93+ verified providers)
- **Malicious Pattern Detection**: Blocks IP addresses, URL shorteners, suspicious TLDs
- **Path Traversal Prevention**: Detects and blocks `../` and encoded variants
- **JavaScript Injection Protection**: Prevents `javascript:`, `data:`, and script injections
- **File Integrity Verification**: SHA-256 hash verification for provider database

### 🔒 Attack Prevention

Protects against common attack vectors:
- ❌ **URL Injection**: Blocked by strict allowlisting
- ❌ **Typosquatting**: Blocked by domain validation
- ❌ **URL Shorteners**: Blocked by pattern detection
- ❌ **Protocol Downgrade**: Blocked by HTTPS enforcement
- ❌ **Path Traversal**: Blocked by path validation
- ❌ **Script Injection**: Blocked by content validation
- ❌ **Supply Chain Attacks**: Blocked by integrity verification

### 🧪 Security Testing

- **92 dedicated security tests** covering all attack vectors
- **Comprehensive security module coverage** with edge case testing
- **Automated security validation** in CI/CD pipeline
- **Regular security audits** of provider database

### 🔐 For Security Teams

Security validation can be integrated into your workflow:

```typescript
import { secureLoadProviders } from '@mikkelscheike/email-provider-links/security';

// Secure loading with integrity verification
const result = secureLoadProviders();
if (result.securityReport.securityLevel === 'CRITICAL') {
  // Handle security incident
  console.error('Security validation failed:', result.securityReport.issues);
}
```

## Performance Benchmarks

This package is designed to be extremely memory efficient and fast. We continuously monitor performance metrics through automated benchmarks that run on every PR and release.

Latest benchmark results show:
- Provider loading: ~0.39MB heap usage, <0.5ms
- Email lookups: ~0.02MB heap usage per 100 operations
- Concurrent DNS: ~0.03MB heap usage, ~110ms for 10 lookups
- Large scale (1000 ops): ~0.02MB heap usage, <3ms total
- Cache effectiveness: ~0.01MB impact on subsequent loads

To run benchmarks locally:
```bash
npm run benchmark
```

Benchmarks are automatically run in CI to catch any performance regressions.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on adding new email providers.

**Quality Assurance**: This project maintains high standards with 370 comprehensive tests achieving 92.89% code coverage.
**Security Note**: All new providers undergo security validation and must pass our allowlist verification.

## Security

For security concerns or to report vulnerabilities, see our [Security Policy](docs/SECURITY.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Zero dependencies • TypeScript-first • Production ready**

