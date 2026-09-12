# Release notes (pending semantic-release)

These notes summarize changes since v5.2.2. Semantic-release will assign the version after CI runs.

## Breaking
- **Node.js 18 and 20 are no longer supported.** `engines.node` is `>=22.12.0` (Vitest 5 + current LTS). Both 18 and 20 are end-of-life as of this date.

## Fixes
- Stop all console output on the lookup/load/DNS path so apps do not print memory stats, hash warnings, or URL-validation noise. Errors remain on the result object.

## Tooling
- Repository package manager is **pnpm** (`pnpm-lock.yaml`). Publish still targets the npm registry.
- Tests use **Vitest 5** instead of Jest/ts-jest. CI runs the suite on Node 22 / 24 / 25 (no 18/20 smoke jobs).
- TypeScript **7**, tsx 4.23.13. Direct `npm` CLI devDependency removed.

## Performance (same public API)
- Provider load reuses the URL security audit instead of validating twice.
- DNS: cached detector, MX suffix index, bounded result cache (max 256).

## Quality
- 439 tests passing, 1 skipped (live DNS). `pnpm run test:coverage` still emits `coverage/lcov.info`.

## Pack
- ~43 kB packed / ~184 kB unpacked, 28 files. Zero runtime dependencies.

Notes:
- A `feat!` commit with a `BREAKING CHANGE` footer should make semantic-release cut a **major** (6.0.0).
