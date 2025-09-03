# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: @mikkelscheike/email-provider-links (TypeScript library)

Setup
- Requirements: Node.js >= 18 (tested on 18.x, 20.x, 22.x, 24.x)
- Install dependencies: npm ci (preferred with package-lock) or npm install

Common commands
- Build: npm run build
  - Cleans dist/, verifies provider data hashes, compiles TypeScript to dist/
- Tests
  - All tests: npm test
  - Watch mode: npm run test:watch
  - Coverage: npm run test:coverage
  - Single file: npm run test -- __tests__/api.test.ts
  - Filter by name (pattern): npm run test -- -t "email alias"
- Benchmarks
  - Memory benchmark: npm run benchmark:memory
  - DNS performance: npm run benchmark:dns
- Provider data security
  - Verify hashes: npm run verify-hashes
  - Update/recalculate hashes (maintainers): npm run update-hashes
- Dev entry (quick local run of library entrypoint): npm run dev

High-level architecture
- Public API surface (src/index.ts, src/api.ts)
  - Core detection: getEmailProvider (async), getEmailProviderSync (sync), getEmailProviderFast (async with extra timing/debug)
  - Email utilities: normalizeEmail, emailsMatch, validateEmailAddress, isValidEmail, extractDomain, getSupportedProviders, getLibraryStats
  - Constants: Config (DEFAULT_DNS_TIMEOUT, MAX_DNS_REQUESTS_PER_MINUTE, provider/domain counts)
- Provider data model and loading
  - Data file: providers/emailproviders.json (compressed schema defined in src/schema.ts)
    - Fields include domains, optional DNS MX/TXT patterns, alias rules, and provider type
  - Two loaders with distinct roles:
    - src/provider-loader.ts (security-aware, used by API)
      - Verifies file integrity (SHA-256) via src/hash-verifier.ts
      - Validates/allowlists login URLs via src/url-validator.ts and filters insecure entries
      - Caches a structured LoadResult with a securityReport
    - src/loader.ts (high-performance loader)
      - Parses providers, builds an optimized domain map, exposes loading stats, used by some utilities
- Detection flow
  1) Quick synchronous domain match
     - getEmailProviderSync builds/uses a domain map of known public providers
  2) Fallback for business/custom domains via concurrent DNS (src/concurrent-dns.ts)
     - Parallel MX/TXT lookups (Promise-based) with timing, confidence scoring, proxy detection, and optional debug info
     - Patterns come from provider.customDomainDetection { mxPatterns, txtPatterns }
  3) Result includes provider, loginUrl, detectionMethod (domain_match/mx_record/txt_record/both/proxy_detected), and rich error details
- Email alias and normalization
  - Provider-specific alias rules (dots/plus/case) are used to canonicalize addresses
  - Canonicalization is exposed via normalizeEmail and equality via emailsMatch
  - Focused implementation also exists in src/alias-detection.ts (used by tests); prefer the top-level API for general usage
- Internationalized email support (IDN)
  - src/idn.ts provides zero-dependency Punycode encoding and validateInternationalEmail for RFC-compliant validation
  - validateEmailAddress in src/index.ts wraps IDN validation for clearer UX

Testing and configuration
- Jest + ts-jest
  - Config: jest.config.js (roots: src and __tests__, TypeScript transform via tsconfig.test.json)
  - Console is mocked in tests via test-utils/jest.setup.ts
  - Bun-specific tests are excluded by pattern in Jest config (.bun.test.ts)
- TypeScript
  - tsconfig.json: module NodeNext, strict type-checking, outputs declarations and source maps to dist/
  - tsconfig.test.json: CommonJS for tests, includes jest types, noEmit

Key files to know
- src/api.ts: Primary API types and functions (getEmailProvider, getEmailProviderSync/Fast, normalizeEmail, emailsMatch, Config)
- src/index.ts: Public re-exports plus helpers (validateEmailAddress, stats, batch utilities)
- src/provider-loader.ts: Secure loading with hash and URL validation; returns LoadResult with a securityReport
- src/concurrent-dns.ts: DNS detection engine (parallel MX/TXT, scoring, proxy detection)
- src/url-validator.ts: HTTPS-only, allowlist, and suspicious pattern checks for provider login URLs
- src/hash-verifier.ts: SHA-256 integrity checks and developer helpers to recalc hashes
- providers/emailproviders.json: Compressed provider database consumed by loaders

Notes and gotchas for Warp in this repo
- If builds/tests suddenly fail around provider loading, run npm run verify-hashes to check integrity; the build also runs this before tsc
- getEmailProviderSync covers only known public domains; business/custom domains require the async path with DNS
- The secure loader (provider-loader) may filter providers with invalid/malicious URLs; securityReport indicates issues
- Use npm ci when the lockfile is present (faster and consistent installs)

