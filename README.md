# Email Provider Links

🔒 **Modern email provider detection library with enhanced TypeScript support and enterprise security**

A robust TypeScript library providing direct links to **93 email providers** (180 domains) with **concurrent DNS resolution**, **optimized performance**, **comprehensive email validation**, and advanced security features for login and password reset flows.

## 🚀 Try it out

**[Live Demo](https://demo.mikkelscheike.com)** - Test the library with any email address and see it in action!

## ✨ New in Version 2.7.0

- 🚀 **Modern TypeScript**: Updated to latest TypeScript 2025 standards with strict type checking
- 🌍 **Enhanced International Support**: Improved IDN validation and Punycode handling
- 📧 **Advanced Email Validation**: Comprehensive validation with detailed error reporting
- 🔄 **Batch Processing**: Efficiently process multiple emails with deduplication
- 🛡️ **Improved Security**: Enhanced cryptographic integrity verification
- ⚡ **Better Performance**: Optimized concurrent DNS with smart caching
- 🎯 **Developer Experience**: Enhanced error messages and debugging information
- 📊 **Development Mode**: Memory usage tracking when NODE_ENV=development

## ✨ Core Features

- 🚀 **Fast & Lightweight**: Zero dependencies, ultra-low memory (~0.08MB initial, ~0.03MB per 1000 ops)
- 📧 **93 Email Providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, and many more
- 🌐 **207 Domains Supported**: Comprehensive international coverage
- 🌍 **Full IDN Support**: International domain names with RFC compliance and Punycode
- ✅ **Advanced Email Validation**: International email validation with detailed error reporting
- 🏢 **Business Domain Detection**: DNS-based detection for custom domains (Google Workspace, Microsoft 365, etc.)
- 🔒 **Enterprise Security**: Multi-layer protection against malicious URLs and supply chain attacks
- 🛡️ **URL Validation**: HTTPS-only enforcement with domain allowlisting
- 🔐 **Integrity Verification**: Cryptographic hash verification for data integrity
- 📝 **Type Safe**: Full TypeScript support with comprehensive interfaces
- ⚡ **Performance Optimized**: Smart DNS fallback with configurable timeouts
- 🚦 **Rate Limiting**: Built-in DNS query rate limiting to prevent abuse
- 🔄 **Email Alias Detection**: Normalize Gmail dots, plus addressing, and provider-specific aliases
- 🛡️ **Fraud Prevention**: Detect duplicate accounts through email alias manipulation
- 📦 **Batch Processing**: Efficiently process multiple emails with deduplication
- 🧪 **Thoroughly Tested**: 424 tests with 93.16% code coverage

## Installation

Using npm:
```bash
npm install @mikkelscheike/email-provider-links
```

## Requirements

- **Node.js**: `>=18.0.0` (Tested on 18.x, 20.x, 22.x, **24.x**)
- **TypeScript**: `>=4.0.0` (optional, but recommended)
- **Zero runtime dependencies** - No external packages required

### Node.js 24 Support ✨

Fully compatible with the latest Node.js 24.x! The library is tested on:
- Node.js 18.x (LTS)
- Node.js 20.x (LTS) 
- Node.js 22.x (Current)
- **Node.js 24.x (Latest)** - Full support with latest features

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

### `getEmailProviderFast(email, options?)`
**High-performance** - Concurrent DNS with detailed timing information.

```typescript
const result = await getEmailProviderFast('user@mycompany.com', {
  enableParallel: true,
  collectDebugInfo: true,
  timeout: 3000
});

console.log(result.timing);    // { mx: 120, txt: 95, total: 125 }
console.log(result.confidence); // 0.9
```

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

For detailed performance metrics and information about the detection system, refer to [Performance and Detection System](docs/PERFORMANCE.md).

### Development Mode Features

When `NODE_ENV` is set to 'development', the library provides additional insights:

```typescript
// Memory usage is automatically logged:
// 🚀 Current memory usage: 0.08 MB
```

### Memory Management

The library implements careful memory management:
- Initial load: ~0.08MB heap usage
- Batch operations: ~0.03MB per 1000 operations
- Maximum load: < 25MB even under heavy concurrent operations
- Automatic garbage collection hints
- Memory usage logging in development mode

### Performance Benchmarks

This package is designed to be extremely memory efficient and fast:

- **Provider loading**: ~0.08MB heap usage, ~0.5ms
- **Email lookups**: ~0.03MB heap usage per 100 operations
- **Concurrent DNS**: ~0.03MB heap usage, ~27ms for 10 lookups
- **Large scale (1000 ops)**: ~0.03MB heap usage, ~1.1ms total
- **International validation**: <1ms for complex IDN domains

To run benchmarks locally:
```bash
npm run benchmark
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on adding new email providers.

**Quality Assurance**: This project maintains high standards with 424 comprehensive tests achieving 93.16% code coverage (96.46% function coverage).
**Security Note**: All new providers undergo security validation and must pass our allowlist verification.

## Security

For security concerns or to report vulnerabilities, see our [Security Policy](docs/SECURITY.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Zero dependencies • TypeScript-first • Production ready • International support**
