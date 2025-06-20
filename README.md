# Email Provider Links

🔒 **Enterprise-grade secure email provider detection for login and password reset flows**

A TypeScript package that provides direct links to email providers based on email addresses, with comprehensive security features to prevent malicious redirects and supply chain attacks.

## ✨ Features

- 🚀 **Fast & Lightweight**: Zero dependencies, minimal footprint
- 📧 **74 Email Providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, and more
- 🌐 **147+ Domains Supported**: Comprehensive international coverage
- 🏢 **Business Domain Detection**: DNS-based detection for custom domains (Google Workspace, Microsoft 365, etc.)
- 🔒 **Enterprise Security**: Multi-layer protection against malicious URLs and supply chain attacks
- 🛡️ **URL Validation**: HTTPS-only enforcement with domain allowlisting
- 🔐 **Integrity Verification**: Cryptographic hash verification for data integrity
- 📝 **Type Safe**: Full TypeScript support with comprehensive interfaces
- ⚡ **Performance Optimized**: Smart DNS fallback with configurable timeouts
- 🚦 **Rate Limiting**: Built-in DNS query rate limiting to prevent abuse
- 🧪 **Thoroughly Tested**: 142+ tests with 94.69% code coverage

## Installation

```bash
npm install @mikkelscheike/email-provider-links
```

## Quick Start

```typescript
import { getEmailProviderLinkWithDNS } from '@mikkelscheike/email-provider-links';

// Works for any email address
const result = await getEmailProviderLinkWithDNS('user@gmail.com');
console.log(result.loginUrl); // "https://mail.google.com/mail/"

// Business domains too
const business = await getEmailProviderLinkWithDNS('user@mycompany.com');
console.log(business.provider?.companyProvider); // "Google Workspace" (if detected)
```

## Supported Providers

**📊 Current Coverage: 74 providers supporting 147+ domains**

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
- **Europe**: GMX, Web.de, Orange, Free.fr, T-Online, Libero
- **Asia**: QQ Mail, NetEase, Sina Mail, Rakuten, Nifty, **Naver** (Korea), **Daum** (Korea), **Biglobe** (Japan)
- **Other Regions**: UOL (Brazil), Telkom (South Africa), Xtra (New Zealand)

## API

### `getEmailProviderLinkWithDNS(email, timeout?)`
**Recommended** - Detects any email provider including business domains.

```typescript
const result = await getEmailProviderLinkWithDNS('user@gmail.com', 3000);
// Returns: { provider, loginUrl, detectionMethod, email }
```

### `getEmailProviderLink(email)`
**Synchronous** - Only checks predefined domains (no DNS lookup).

```typescript
const result = getEmailProviderLink('user@gmail.com');
// Returns: { provider, loginUrl, email }
```

## Real-World Example

```typescript
async function handlePasswordReset(email: string) {
  const result = await getEmailProviderLinkWithDNS(email);
  
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
const result = await getEmailProviderLinkWithDNS(email, 2000);

// Check if provider is supported
import { isEmailProviderSupported } from '@mikkelscheike/email-provider-links';
const supported = isEmailProviderSupported('user@gmail.com');

// Rate limiting configuration
import { RateLimit } from '@mikkelscheike/email-provider-links';
console.log('Max requests:', RateLimit.MAX_REQUESTS); // 10
console.log('Time window:', RateLimit.WINDOW_MS);     // 60000ms

// Custom rate limiter for specific use cases
const customLimiter = new RateLimit.SimpleRateLimiter(20, 120000); // 20 requests per 2 minutes
```

## TypeScript Support

```typescript
interface EmailProviderResult {
  provider: EmailProvider | null;
  email: string;
  loginUrl: string | null;
  detectionMethod?: 'domain_match' | 'mx_record' | 'txt_record' | 'proxy_detected';
  proxyService?: string;
}

interface RateLimitConfig {
  MAX_REQUESTS: number;     // 10 requests
  WINDOW_MS: number;        // 60000ms (1 minute)
  SimpleRateLimiter: class; // Custom rate limiter class
  getCurrentLimiter(): SimpleRateLimiter; // Get current global limiter
}
```

## 🛡️ Security Features

This package implements **enterprise-grade security** to protect against malicious redirects and supply chain attacks:

### ✅ Multi-Layer Protection

- **HTTPS-Only Enforcement**: All provider URLs must use HTTPS protocol
- **Domain Allowlisting**: Only pre-approved domains are allowed (64+ verified providers)
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

- **29 dedicated security tests** covering all attack vectors
- **94% security code coverage** with edge case testing
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

## Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on adding new email providers.

**Security Note**: All new providers undergo security validation and must pass our allowlist verification.

## Security

For security concerns or to report vulnerabilities, see our [Security Policy](docs/SECURITY.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Zero dependencies • TypeScript-first • Production ready**

