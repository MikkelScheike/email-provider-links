# Email Provider Links

[![npm version](https://badge.fury.io/js/@mikkelscheike%2Femail-provider-links.svg)](https://www.npmjs.com/package/@mikkelscheike/email-provider-links)

> **Generate direct login links for any email address across 93+ providers (Gmail, Outlook, Yahoo, etc.) to streamline user authentication flows.**

A robust TypeScript library providing direct links to **93 email providers** (180 domains) with **concurrent DNS resolution**, **optimized performance**, **comprehensive email validation**, and advanced security features for login and password reset flows.

## 🚀 Try it out

**[Live Demo](https://demo.mikkelscheike.com)** - Test the library with any email address and see it in action!

## ✨ New in Version 4.0.0

**Major Performance & Security Release** - Full backward compatibility maintained

- 🚀 **Performance Revolution**: Achieved 100,000+ operations/second throughput with sub-millisecond response times
- ⚡ **Lightning Performance**: Domain lookups in ~0.07ms, cached access in ~0.003ms
- 🛡️ **Zero-Trust Architecture**: Runtime data validation with cryptographic integrity verification
- 🔒 **Enhanced Security**: SHA-256 hash verification and supply chain protection
- 🎯 **Rigorous Testing**: 445 comprehensive tests with enhanced performance validation
- 📊 **Extreme Optimization**: 99.9% cache hit rate and ultra-low memory footprint
- 🧪 **Quality Assurance**: 94.65% code coverage with stress testing under enterprise loads
- 🔄 **Seamless Upgrade**: All existing APIs remain fully compatible

## ✨ Core Features

- 🚀 **Fast & Lightweight**: Zero dependencies, ultra-low memory (0.10MB initial, 0.00004MB per 1000 ops), small footprint (~39.5KB compressed)
- 📧 **93 Email Providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, and many more
- 🌐 **207 Domains Supported**: Comprehensive international coverage
- 🌍 **Full IDN Support**: International domain names with RFC compliance and Punycode
- ✅ **Advanced Email Validation**: International email validation with detailed error reporting
- 🏢 **Business Domain Detection**: DNS-based detection for custom domains (Google Workspace, Microsoft 365, etc.)
- 🔒 **Built-in Security**: Multi-layer protection with cryptographic hash verification, URL validation, and supply chain attack prevention
- 🛡️ **Zero-Trust Architecture**: All provider data undergoes integrity verification - no insecure fallbacks
- 🔐 **HTTPS-Only**: Strict HTTPS enforcement with domain allowlisting and malicious pattern detection
- 📝 **Type Safe**: Full TypeScript support with comprehensive interfaces
- ⚡ **Performance Optimized**: Smart DNS fallback with configurable timeouts
- 🚦 **Rate Limiting**: Built-in DNS query rate limiting to prevent abuse
- 🔄 **Email Alias Detection**: Normalize Gmail dots, plus addressing, and provider-specific aliases
- 🛡️ **Fraud Prevention**: Detect duplicate accounts through email alias manipulation
- 📦 **Batch Processing**: Efficiently process multiple emails with deduplication
- 🧪 **Thoroughly Tested**: 445 tests with 94.65% code coverage

## Installation

Using npm:
```bash
npm install @mikkelscheike/email-provider-links
```

## Requirements

- **Node.js**: `>=18.0.0` (Tested on 18.x, 20.x, 22.x, **24.x**, **25.x**)
- **TypeScript**: `>=4.0.0` (optional, but recommended)
- **Zero runtime dependencies** - No external packages required

### Node.js 24/25 Support ✨

Fully compatible with the latest Node.js 24.x and 25.x! The library is tested on:
- Node.js 18.x (LTS)
- Node.js 20.x (LTS)
- Node.js 22.x
- **Node.js 24.x** - Full support
- **Node.js 25.x (Latest)** - Full support with latest features

## Supported Providers

**📊 Current Coverage: 93 providers supporting 207 domains**

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

## API Reference

### Core Functions

#### `getEmailProvider(email, timeout?)`
**Recommended** - Complete provider detection with business domain support.

```typescript
// Known providers (instant response)
const result1 = await getEmailProvider('user@gmail.com');
// Returns: { provider: "Gmail", loginUrl: "https://mail.google.com/mail/" }

// Business domains (DNS lookup with timeout)
const result2 = await getEmailProvider('user@company.com', 2000);
// Returns: { provider: "Google Workspace", detectionMethod: "mx_record" }
```

#### `getEmailProviderSync(email)`
**Fast** - Instant checks for known providers (no DNS lookup).

```typescript
const result = getEmailProviderSync('user@outlook.com');
// Returns: { provider: "Outlook", loginUrl: "https://outlook.live.com/" }
```

### Email Alias Support

The library handles provider-specific email alias rules:

```typescript
// Gmail ignores dots and plus addressing
emailsMatch('user.name+work@gmail.com', 'username@gmail.com') // true

// Outlook preserves dots but ignores plus addressing
emailsMatch('user.name+work@outlook.com', 'username@outlook.com') // false

// Normalize emails to canonical form
const canonical = normalizeEmail('u.s.e.r+tag@gmail.com');
console.log(canonical); // 'user@gmail.com'
```

**Provider Rules Overview**:
- **Gmail**: Ignores dots, supports plus addressing
- **Outlook**: Preserves dots, supports plus addressing
- **Yahoo**: Preserves dots, supports plus addressing
- **ProtonMail**: Preserves dots, supports plus addressing
- **FastMail**: Preserves dots, supports plus addressing
- **AOL**: Preserves everything except case

## Real-World Example

```typescript
async function handlePasswordReset(email: string) {
  // Validate email first
  const validation = validateEmailAddress(email);
  if (!validation.isValid) {
    throw new Error(`Invalid email: ${validation.error?.message}`);
  }

  // Get provider information
  const result = await getEmailProvider(validation.normalizedEmail);
  
  return {
    providerUrl: result.loginUrl,
    providerName: result.provider?.companyProvider || null,
    isSupported: result.provider !== null,
    detectionMethod: result.detectionMethod
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

## Performance and Detection System

### Development Mode Features

When `NODE_ENV` is set to 'development', the library provides additional insights:

```typescript
// Memory usage is automatically logged:
// 🚀 Current memory usage: 0.08 MB
```

### Performance Benchmarks

Extensively optimized for both speed and memory efficiency:

**Speed Metrics**:
- Initial provider load: ~0.5ms
- Known provider lookup: <1ms
- DNS-based detection: ~10ms average
- Batch processing: 1000 operations in ~1.1ms
- Email validation: <1ms for complex IDN domains

**Memory Management**:
- Initial load: ~0.10MB heap usage
- Batch operations: ~0.00004MB per 1000 operations
- Maximum load: < 25MB under heavy concurrent operations
- Cache efficiency: >99% hit rate
- Garbage collection: Automatic optimization

**Real-World Performance**:
- 50,000+ operations/second for known providers
- 100 concurrent DNS lookups in <1 second
- Average latency: <1ms for cached lookups
- Maximum latency: <25ms per lookup

To run benchmarks:
```bash
# Memory usage benchmark
npm run benchmark:memory

# DNS performance benchmark
npm run benchmark:dns

# Both scripts are available in the scripts/ directory
# and can be modified for custom performance testing
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on adding new email providers.

**Quality Assurance**: This project maintains high standards with 445 comprehensive tests achieving 94.65% code coverage (95.95% function coverage).

**Security**: All provider data is protected by cryptographic hash verification, URL validation, and strict security controls. The library uses a zero-trust architecture with no insecure fallbacks - ensuring all data is verified before use.

## Security

For security concerns or to report vulnerabilities, see our [Security Policy](docs/SECURITY.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Zero dependencies • TypeScript-first • Production ready • International support**
