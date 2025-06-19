# Email Provider Links

A TypeScript package that provides direct links to email providers based on email addresses to streamline login and password reset flows.

## Features

- 🚀 **Fast & Lightweight**: Zero dependencies, minimal footprint
- 📧 **55+ Email Providers**: Gmail, Outlook, Yahoo, ProtonMail, and more
- 🏢 **Business Domain Detection**: DNS-based detection for custom domains
- 🔒 **Type Safe**: Full TypeScript support
- ⚡ **Performance Optimized**: Smart DNS fallback with configurable timeouts

## Installation

```bash
npm install @MikkelScheike/Email-provider-links
```

## Quick Start

```typescript
import { getEmailProviderLinkWithDNS } from '@MikkelScheike/Email-provider-links';

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
Microsoft 365, Google Workspace, ProtonMail Business, FastMail, Tutanota, Zoho Workplace, and others.

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
import { isEmailProviderSupported } from '@MikkelScheike/Email-provider-links';
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

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding new email providers.

## Security

For security concerns, see our [Security Policy](SECURITY.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Zero dependencies • TypeScript-first • Production ready**

