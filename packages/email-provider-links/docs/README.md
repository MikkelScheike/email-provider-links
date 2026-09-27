# Documentation

This directory contains documentation for the Email Provider Links package.

## Files

- **[`CHANGELOG.md`](../CHANGELOG.md)** - Version history and release notes (repository root)
- **`CONTRIBUTING.md`** - Guidelines for contributing, including security requirements
- **`SECURITY.md`** - Security policy, vulnerability reporting, and security features

## Quick Links

### For Users
- [Security Policy](SECURITY.md) - Understanding security features and reporting vulnerabilities
- [Changelog](../CHANGELOG.md) - Version history and migration guides

### For Contributors
- [Contributing Guide](CONTRIBUTING.md) - How to add providers and contribute safely
- [Security Requirements](CONTRIBUTING.md#security-guidelines) - Security checklist for new providers

This package is a **zero-runtime-dependency** TypeScript library. This repository uses **pnpm** and **Vitest 5** for install/CI; consumers may still install from npm with any client.

## Security Documentation

### [Security Policy](SECURITY.md)
- HTTPS-only login URLs and host allowlisting
- Vulnerability reporting process
- Build-time provider JSON integrity (SHA-256)

### [Contributing Guidelines](CONTRIBUTING.md)
- Security requirements for new providers
- Testing and validation procedures
- Pull request security checklist

### [Changelog](../CHANGELOG.md)
- Feature history
- Migration notes
- Breaking change notifications

## Current coverage snapshot

- **140 email providers** supporting **259 domains**
- **439 passing tests** plus 1 skipped live-DNS test (~89% statement coverage with Vitest v8)
- Quiet runtime: detection and provider load do not write to the console
- Packed size ~43 kB (compiled JS + minified providers JSON)

For complete security details, see [SECURITY.md](SECURITY.md).
