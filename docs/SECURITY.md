# Security Policy

## Overview

This package treats provider login URLs as sensitive redirect targets. Protections focus on keeping those URLs HTTPS-only and consistent with the shipped provider database. Package integrity for consumers primarily comes from npm provenance and normal supply-chain hygiene — not from hashing a file that ships inside the same tarball.

## What the library guarantees

1. **HTTPS-only login URLs**  
   Provider `loginUrl` values must use `https:`. HTTP and non-URL values are rejected during load.

2. **Allowlisted redirect hosts**  
   Login URL hostnames must appear in the allowlist derived from the provider database (normalized to lowercase Punycode). Unknown hosts are filtered out at load time.

3. **Malicious URL pattern checks**  
   Rejects IP/localhost hosts, common URL shorteners, path traversal encodings, and obvious script/data schemes in URL strings.

4. **Build-time provider integrity**  
   `npm run build` / `verify-hashes` checks a SHA-256 of `providers/emailproviders.json` against a known-good hash. This catches accidental local edits and CI drift. It is not a substitute for verifying the npm package itself.

5. **Optional runtime hash check**  
   Runtime skips SHA-256 by default (build/publish already verified the source file). Pass an expected hash to `loadProviders(path, expectedHash)` or set `EMAIL_PROVIDER_LINKS_VERIFY_HASH=1` to enforce checks at load time. Failed checks fail closed (empty provider set).

## What it does not claim

- It does not stop a compromised npm publish (use provenance / lockfiles / mirrors for that).
- Hashing `emailproviders.json` inside the package cannot detect that the package author changed both the file and the expected hash together.
- DNS-based detection is best-effort and subject to resolver trust, caching, and rate limits.

## DNS considerations

- Custom-domain detection performs MX/TXT lookups and may reveal queried domains to the resolver.
- Lookups are rate-limited (default: 10 detection attempts per process per rolling minute).
- Timeouts are configurable (default: 5000ms).

## Reporting vulnerabilities

1. Prefer a [private GitHub security advisory](https://github.com/mikkelscheike/email-provider-links/security).
2. Include reproduction steps and impact.
3. Do not disclose publicly until a fix is available.

We aim to respond within 48 hours.

## Non-security bugs

Use [GitHub Issues](https://github.com/mikkelscheike/email-provider-links/issues).
