# Email Provider Links

🔒 **Enterprise-grade secure email provider detection for login and password reset flows**

A TypeScript package that provides direct links to email providers based on email addresses, with comprehensive security features to prevent malicious redirects and supply chain attacks.

## ✨ Features

- 🚀 **Fast & Lightweight**: Zero dependencies, minimal footprint
- 📧 **64+ Email Providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, and more
- 🏢 **Business Domain Detection**: DNS-based detection for custom domains (Google Workspace, Microsoft 365, etc.)
- 🔒 **Enterprise Security**: Multi-layer protection against malicious URLs and supply chain attacks
- 🛡️ **URL Validation**: HTTPS-only enforcement with domain allowlisting
- 🔐 **Integrity Verification**: Cryptographic hash verification for data integrity
- 📝 **Type Safe**: Full TypeScript support with comprehensive interfaces
- ⚡ **Performance Optimized**: Smart DNS fallback with configurable timeouts
- 🧪 **Thoroughly Tested**: 83+ tests including comprehensive security coverage

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

**Consumer Email:**
Gmail, Outlook, Yahoo Mail, iCloud, ProtonMail, Zoho, AOL, GMX, Web.de, Mail.ru, QQ Mail, NetEase, Yandex, and more.

**Business Email (via DNS detection):**
Microsoft 365, Google Workspace, ProtonMail Business, Hostinger, FastMail, GoDaddy, Tutanota, Zoho Workplace, and others.

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

