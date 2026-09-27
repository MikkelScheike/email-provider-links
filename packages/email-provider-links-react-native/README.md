# @mikkelscheike/email-provider-links-react-native

React Native hook and component for known-domain email login links. Provider data is copied from [`@mikkelscheike/email-provider-links`](https://www.npmjs.com/package/@mikkelscheike/email-provider-links) at build time.

On device this package matches `getEmailProviderSync`: known domains, alias normalization, and the login URL. Business-domain DNS detection stays in the Node package.

## Installation

```bash
npm install @mikkelscheike/email-provider-links-react-native
```

Peer dependencies: `react` and `react-native`.

## Usage

```tsx
import { EmailProviderLink, useEmailProvider } from '@mikkelscheike/email-provider-links-react-native';

const { provider, openLogin } = useEmailProvider(email);
// provider?.companyProvider === "Gmail"
// provider?.loginUrl === "https://mail.google.com/mail/"

await openLogin();

<EmailProviderLink email={email} fallback={<Text>Check your inbox</Text>} />
```
