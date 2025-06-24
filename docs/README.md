# Documentation

This directory contains comprehensive documentation for the Email Provider Links package.

## Files

- **[`CHANGELOG.md`](../CHANGELOG.md)** - Complete version history and release notes (in root directory)
- **`CONTRIBUTING.md`** - Guidelines for contributing, including security requirements
- **`SECURITY.md`** - Security policy, vulnerability reporting, and security features

## Quick Links

### For Users
- [Security Policy](SECURITY.md) - Understanding security features and reporting vulnerabilities
- [Changelog](../CHANGELOG.md) - Version history and migration guides

### For Contributors  
- [Contributing Guide](CONTRIBUTING.md) - How to add providers and contribute safely
- [Security Requirements](CONTRIBUTING.md#security-guidelines) - Security checklist for new providers

## Security Documentation

This package implements enterprise-grade security features. Key security docs:

### 🛡️ [Security Policy](SECURITY.md)
- Multi-layer protection details
- Vulnerability reporting process  
- Security audit results
- Integration guidelines for security teams

### 🤝 [Contributing Guidelines](CONTRIBUTING.md)  
- Security requirements for new providers
- Testing and validation procedures
- Pull request security checklist

### 📋 [Changelog](../CHANGELOG.md)
- Detailed security feature history
- Migration guides for version updates
- Breaking change notifications

## Security Features Overview

- **HTTPS-Only Enforcement** - All provider URLs validated
- **Domain Allowlisting** - Only verified providers allowed
- **Malicious Pattern Detection** - Blocks common attack vectors
- **File Integrity Verification** - SHA-256 hash validation
- **DNS Rate Limiting** - Built-in protection against abuse
- **Comprehensive Testing** - 369 tests with 91.84% code coverage
- **93 Email Providers** - Supporting 178 domains worldwide

For complete security details, see [SECURITY.md](SECURITY.md).

