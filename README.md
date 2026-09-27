# Email Provider Links

[![npm version](https://img.shields.io/npm/v/%40mikkelscheike%2Femail-provider-links)](https://www.npmjs.com/package/@mikkelscheike/email-provider-links)
[![npm version](https://img.shields.io/npm/v/%40mikkelscheike%2Femail-provider-links-react-native)](https://www.npmjs.com/package/@mikkelscheike/email-provider-links-react-native)
[![Socket Badge](https://badge.socket.dev/npm/package/@mikkelscheike/email-provider-links/6.0.0)](https://badge.socket.dev/npm/package/@mikkelscheike/email-provider-links/6.0.0)

> **Generate direct login links for any email address across 140+ providers (Gmail, Outlook, Yahoo, etc.) to streamline user authentication flows.**

TypeScript libraries that turn an email address into a provider login URL. The data covers **140 email providers** (259 domains), with alias normalization and HTTPS login-URL validation.

The Node library also detects business domains (Google Workspace, Microsoft 365, and others) with DNS. The React Native package does the known-domain lookup on device and does not run DNS.

## Try it out

**[Live Demo](https://demo.mikkelscheike.com)** — test the library with any email address.

## Packages

| Package | What it does |
| --- | --- |
| [`@mikkelscheike/email-provider-links`](packages/email-provider-links) | Node library: known-domain lookup, alias normalization, and DNS detection for business domains |
| [`@mikkelscheike/email-provider-links-react-native`](packages/email-provider-links-react-native) | React Native hook and component that open a provider login URL. Known domains only |

Provider data lives in one file, [`packages/email-provider-links/providers/emailproviders.json`](packages/email-provider-links/providers/emailproviders.json). The React Native build copies it into that package. The [Node package README](packages/email-provider-links/README.md) has the full API, options, and benchmarks.

## Core features

- **Fast and lightweight**: the Node package has zero runtime dependencies and packs to about 43KB
- **140 email providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, and many more
- **259 domains**: broad international coverage, including internationalized domain names
- **Email validation**: international addresses with detailed error reporting
- **Business domain detection** (Node only): DNS lookup for custom domains such as Google Workspace and Microsoft 365
- **URL safety**: HTTPS-only login URLs with host allowlisting and malicious-pattern checks
- **Build integrity**: SHA-256 hash gate on provider data in CI, and npm provenance on publish
- **Type safe**: TypeScript overloads for a short response or the full provider record
- **Alias normalization**: Gmail dots, plus addressing, and other provider-specific rules
- **Batch processing**: process many addresses with deduplication
- **Quiet runtime**: detection does not write to stdout or stderr; errors are on the result object
- **Tested**: 439 Node tests plus 1 skipped live-DNS test, and 10 React Native tests

## Node

```bash
npm install @mikkelscheike/email-provider-links
```

Requires Node.js `>=22.12.0`.

```typescript
import { getEmailProvider } from '@mikkelscheike/email-provider-links';

const result = await getEmailProvider('user@gmail.com');
console.log(result.provider?.loginUrl); // "https://mail.google.com/mail/"

const business = await getEmailProvider('user@company.com');
console.log(business.provider?.companyProvider); // "Google Workspace" or "Microsoft 365"
```

`user+tag@gmail.com` comes back as `user@gmail.com`. Pass `{ extended: true }` when you need domains and alias rules. `getEmailProviderSync` skips DNS. `getEmailProviderFast` adds timing and confidence. Details are in the [Node API reference](packages/email-provider-links/README.md#api-reference).

## React Native

```bash
npm install @mikkelscheike/email-provider-links-react-native
```

Peer dependencies are `react` and `react-native`. This package matches `getEmailProviderSync`: known domains and the login URL. It does not detect business domains.

```tsx
import { EmailProviderLink, useEmailProvider } from '@mikkelscheike/email-provider-links-react-native';

const { provider, openLogin } = useEmailProvider(email);

await openLogin();

<EmailProviderLink email={email} fallback={<Text>Check your inbox</Text>} />
```

See the [React Native README](packages/email-provider-links-react-native/README.md).

## Supported providers

**140 providers, 259 domains**, including:

- **Major providers**: Gmail, Outlook, Yahoo, ProtonMail, iCloud, Tutanota
- **Business email**: Microsoft 365, Google Workspace, Amazon WorkMail (DNS detection, Node only)
- **International**: GMX, Web.de, QQ Mail, Yandex, Naver, and 100+ more
- **Privacy-focused**: ProtonMail, Tutanota, Hushmail, SimpleLogin, AnonAddy

## Developing

This repository is a pnpm workspace. Node.js `>=22.12.0`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm run build
```

Run those commands from the repository root. They cover both packages.

- Tests: Vitest 5. Coverage: `pnpm run test:coverage` writes `packages/email-provider-links/coverage/lcov.info`.
- Contributing: [CONTRIBUTING.md](packages/email-provider-links/docs/CONTRIBUTING.md)
- Security: [SECURITY.md](packages/email-provider-links/docs/SECURITY.md)

## License

MIT. See [LICENSE](LICENSE).
