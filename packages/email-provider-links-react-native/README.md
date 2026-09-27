# @mikkelscheike/email-provider-links-react-native

[![npm version](https://img.shields.io/npm/v/%40mikkelscheike%2Femail-provider-links-react-native)](https://www.npmjs.com/package/@mikkelscheike/email-provider-links-react-native)

> Open the right inbox from a React Native app. Pass an email address and get a login link for Gmail, Outlook, Yahoo, and 140 other providers.

This package looks up known email domains on device and opens the provider login URL with `Linking`. It matches `getEmailProviderSync` from [`@mikkelscheike/email-provider-links`](https://www.npmjs.com/package/@mikkelscheike/email-provider-links): the same provider list, alias normalization, and international domains. It does not query DNS, so custom company domains are not detected here.

Try the data in the [live demo](https://demo.mikkelscheike.com). The repository overview is in the [project README](../../README.md).

- **140 providers, 259 domains**, bundled in the package
- **Alias normalization**: `User.Name+tag@gmail.com` becomes `username@gmail.com`
- **International domains**, converted to Punycode before lookup
- **No network lookup** for detection, so it works offline for known providers
- **A hook and a component**: read the provider yourself, or render a pressable that opens the login URL

## Installation

```bash
npm install @mikkelscheike/email-provider-links-react-native
```

Peer dependencies:

- `react` `>=18.2.0`
- `react-native` `>=0.73.0`

## Open a login link

`EmailProviderLink` renders a pressable. The default label is `Open Gmail` (or whichever provider matched). Pressing it calls `Linking.openURL`.

```tsx
import { Text } from 'react-native';
import { EmailProviderLink } from '@mikkelscheike/email-provider-links-react-native';

<EmailProviderLink email={email} fallback={<Text>Check your inbox</Text>} />
```

`fallback` is rendered when the address is invalid, the domain is unknown, or the provider has no login URL. Apple Private Relay (`user@privaterelay.appleid.com`) is a known provider with `loginUrl: null`, so it takes the fallback path and nothing is opened.

Custom label:

```tsx
<EmailProviderLink email={email}>
  <Text>Open inbox</Text>
</EmailProviderLink>
```

Render prop, when the label needs the provider:

```tsx
<EmailProviderLink email={email}>
  {(state) => <Text>Open {state.provider?.companyProvider}</Text>}
</EmailProviderLink>
```

If `Linking.openURL` rejects, the press handler swallows that error.

## Read the provider yourself

`useEmailProvider` returns the lookup plus `openLogin`.

```tsx
import { useEmailProvider } from '@mikkelscheike/email-provider-links-react-native';

const { provider, email, error, openLogin } = useEmailProvider('user@gmail.com');

// provider?.companyProvider === "Gmail"
// provider?.loginUrl === "https://mail.google.com/mail/"
// email === "user@gmail.com"

const opened = await openLogin();
```

`openLogin` returns `false` when there is no login URL and does not call `Linking`. Otherwise it opens the URL and returns `true`.

`lookupEmailProvider` is the same lookup without React, for code that is not a component.

```tsx
import { lookupEmailProvider } from '@mikkelscheike/email-provider-links-react-native';

const result = lookupEmailProvider('user@outlook.com');
```

A match looks like this:

```ts
{
  provider: {
    companyProvider: "Gmail",
    loginUrl: "https://mail.google.com/mail/",
    type: "public_provider"
  },
  email: "user@gmail.com",
  detectionMethod: "domain_match"
}
```

`email` is the normalized address. `provider` is `null` when lookup fails, and `error.type` is one of:

| `error.type` | When |
| --- | --- |
| `INVALID_EMAIL` | Empty, non-string, or malformed address |
| `UNKNOWN_DOMAIN` | Valid address, domain not in the provider list |
| `IDN_VALIDATION_ERROR` | The domain cannot be encoded |

## What this package does not do

Business-domain detection stays in the Node library. `user@company.com` is an unknown domain here, even when that company uses Google Workspace or Microsoft 365. Use [`@mikkelscheike/email-provider-links`](https://www.npmjs.com/package/@mikkelscheike/email-provider-links) on a server for DNS lookups, batch processing, and the extended provider record.

## License

MIT. See [LICENSE](../../LICENSE).
