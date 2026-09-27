# Email Provider Links

Monorepo for email provider login links.

| Package | Path | What it does |
| --- | --- | --- |
| [`@mikkelscheike/email-provider-links`](packages/email-provider-links) | `packages/email-provider-links` | Node library: known-domain lookup, alias normalization, and DNS detection for business domains |
| [`@mikkelscheike/email-provider-links-react-native`](packages/email-provider-links-react-native) | `packages/email-provider-links-react-native` | React Native hook and component that open a provider login URL. Known domains only; no DNS on device |

Provider data lives in one file, [`packages/email-provider-links/providers/emailproviders.json`](packages/email-provider-links/providers/emailproviders.json). The React Native build copies it into that package.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm run build
```

Node.js `>=22.12.0`. See the [Node package README](packages/email-provider-links/README.md) for the detection API.
