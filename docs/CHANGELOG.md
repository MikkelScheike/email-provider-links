# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-06-20

### 🌍 International Expansion + Performance Features

#### New Email Providers Added

- **Naver** (Korea) - Added with correct login URL https://mail.naver.com/
- **Daum** (Korea) - Added with DNS detection patterns for hanmail.net MX records
- **Biglobe** (Japan) - Added with .ne.jp domain support and DNS patterns
- **Amazon WorkMail** - Added with comprehensive awsapps.com MX pattern detection

#### 🚦 New Rate Limiting System

- **Built-in DNS rate limiting** to prevent abuse and ensure responsible usage
- **Configurable rate limits**: 10 DNS queries per minute by default
- **Simple rate limiter class** for custom implementations
- **Automatic rate limit enforcement** across all DNS-based detection
- **Thread-safe implementation** for concurrent usage

#### 📊 Enhanced Testing & Coverage

- **142 comprehensive tests** covering all functionality ✅
- **Improved code coverage** with rate limiting and edge case tests
- **Enhanced DNS detection testing** with timeout and error scenarios
- **Security validation tests** for all new providers
- **Zero test failures** across all modules

#### 🌐 Expanded Coverage

- **74 total email providers** (optimized for quality)
- **147+ unique domains** supported worldwide
- **Enhanced Asian market coverage** with major Korean and Japanese providers
- **AWS WorkMail infrastructure support** for enterprise environments
- **Multi-part TLD support** (.ne.jp, .co.uk, .com.br, etc.)

### 🎯 Performance & Reliability

This release introduces rate limiting as a core feature to ensure responsible DNS usage while expanding international coverage. The rate limiting system protects both the library users and DNS infrastructure from excessive queries.

## [1.3.0] - 2025-06-19

### 🔒 Major Security Release + Professional Organization

#### Enterprise Security Features

- **Multi-layer security protection** against malicious redirects and supply chain attacks
- **HTTPS-only enforcement** for all provider URLs
- **Domain allowlisting** with 64+ verified email providers
- **Malicious pattern detection** (IP addresses, URL shorteners, suspicious TLDs)
- **Path traversal prevention** (`../`, URL-encoded variants)
- **JavaScript injection protection** (`javascript:`, `data:`, script tags)
- **File integrity verification** with SHA-256 hash verification
- **URL encoding attack prevention** for advanced security
- **Comprehensive security testing** with 29 dedicated security tests
- **Security audit utilities** for monitoring and validation

#### Security Modules Added

- `src/security/url-validator.ts` - URL validation and allowlisting
- `src/security/hash-verifier.ts` - Cryptographic integrity verification
- `src/security/secure-loader.ts` - Secure provider loading system
- `scripts/recalculate-hashes.ts` - Hash management utility

#### Professional Project Organization

- **Professional project structure** with organized directories
- **Moved documentation** to `/docs/` directory (CHANGELOG, CONTRIBUTING, SECURITY)
- **Moved examples** to `/examples/` directory with comprehensive README
- **Cleaned root directory** for professional appearance
- **Updated all documentation links** to reflect new structure
- **Added directory READMEs** for better navigation

### 🧪 Testing & Quality

- **29 new security tests** covering all attack vectors
- **94% security code coverage** with edge case testing
- **Attack simulation tests** for typosquatting, URL shorteners, script injection
- **Integration testing** for end-to-end security validation
- **83 total tests passing**

### 🔐 Attack Prevention

The package now blocks all major attack vectors:
- ❌ URL injection attacks
- ❌ Typosquatting attacks  
- ❌ URL shortener attacks
- ❌ Protocol downgrade attacks
- ❌ Path traversal attacks
- ❌ JavaScript injection attacks
- ❌ Encoded malicious patterns
- ❌ Supply chain attacks

### 🏢 Provider Updates

- **Added 35+ new email providers** to reach 64 total providers
- **Enhanced custom domain detection** for business email services
- **Improved international provider support**

### 📁 New Project Structure

```
/docs/           # All documentation
/examples/       # Usage examples with guide
/src/security/   # Security modules
/scripts/        # Utility scripts
/providers/      # Provider database
```

### 🎯 Benefits

- ✅ **Enterprise-grade security** with comprehensive protection
- ✅ **Professional structure** expected by enterprise teams
- ✅ **Zero breaking changes** - full backward compatibility
- ✅ **Improved maintainability** with logical organization
- ✅ **Enhanced developer experience** with organized examples

## [1.2.0] - 2025-06-19

### Deprecated

⚠️ **This version was reorganized into v1.3.0 for better semantic versioning alignment**

## [1.1.0] - 2025-06-19

### 🔒 Added - Enterprise Security Features

- **Multi-layer security protection** against malicious redirects and supply chain attacks
- **HTTPS-only enforcement** for all provider URLs
- **Domain allowlisting** with 64+ verified email providers
- **Malicious pattern detection** (IP addresses, URL shorteners, suspicious TLDs)
- **Path traversal prevention** (`../`, URL-encoded variants)
- **JavaScript injection protection** (`javascript:`, `data:`, script tags)
- **File integrity verification** with SHA-256 hash verification
- **URL encoding attack prevention** for advanced security
- **Comprehensive security testing** with 29 dedicated security tests
- **Security audit utilities** for monitoring and validation

### 🛡️ Security Modules Added

- `src/security/url-validator.ts` - URL validation and allowlisting
- `src/security/hash-verifier.ts` - Cryptographic integrity verification
- `src/security/secure-loader.ts` - Secure provider loading system
- `scripts/recalculate-hashes.ts` - Hash management utility

### 🧪 Testing

- **29 new security tests** covering all attack vectors
- **94% security code coverage** with edge case testing
- **Attack simulation tests** for typosquatting, URL shorteners, script injection
- **Integration testing** for end-to-end security validation
- **Concurrent validation testing** for performance under load

### 📚 Documentation

- **Comprehensive security documentation** in README.md
- **Enhanced SECURITY.md** with detailed security practices
- **Updated CONTRIBUTING.md** with security guidelines
- **Security-focused examples** and usage patterns

### 🔐 Attack Prevention

The package now blocks all major attack vectors:
- ❌ URL injection attacks
- ❌ Typosquatting attacks  
- ❌ URL shortener attacks
- ❌ Protocol downgrade attacks
- ❌ Path traversal attacks
- ❌ JavaScript injection attacks
- ❌ Encoded malicious patterns
- ❌ Supply chain attacks

### 🏢 Provider Updates

- **Added 35+ new email providers** to reach 64 total providers
- **Enhanced custom domain detection** for business email services
- **Improved international provider support**

### ⚡ Performance

- **Optimized security validation** with minimal performance impact
- **Configurable DNS timeouts** for better control
- **Graceful fallback handling** for DNS failures

## [1.1.0] - 2025-06-19

### Added
- Enhanced DNS-based provider detection
- Additional email providers
- Improved error handling

## [1.0.1] - 2025-06-19

### Fixed
- Package publishing issues
- Build configuration improvements

## [1.0.0] - 2025-06-19

### Added
- Initial release
- Basic email provider detection
- TypeScript support
- 29+ email providers
- DNS-based custom domain detection
- Zero dependencies
- Comprehensive test suite

### Features
- Synchronous provider lookup
- Asynchronous DNS-based detection
- Business domain support
- Proxy service detection
- Full TypeScript interfaces

---

## Security Notice

Starting with v1.2.0, this package implements enterprise-grade security measures. All provider URLs undergo strict validation, and the provider database is cryptographically verified for integrity.

For security concerns, see [SECURITY.md](SECURITY.md).

## Migration Guide

### From v1.1.x to v1.2.0

✅ **No breaking changes** - all existing APIs remain compatible

**Optional security enhancements:**
```typescript
// Optional: Use secure loading for enhanced validation
import { secureLoadProviders } from '@mikkelscheike/email-provider-links/security';

const result = secureLoadProviders();
if (result.securityReport.securityLevel === 'CRITICAL') {
  // Handle security incident
}
```

**New security features are automatic:**
- All URLs are automatically validated
- HTTPS enforcement is built-in
- Malicious patterns are blocked automatically

### From v1.0.x to v1.1.x

✅ **No breaking changes** - backward compatible

### First Time Installation

```bash
npm install @mikkelscheike/email-provider-links
```

## Support

- **Issues**: [GitHub Issues](https://github.com/mikkelscheike/email-provider-links/issues)
- **Security**: [Security Policy](SECURITY.md)
- **Contributing**: [Contributing Guide](CONTRIBUTING.md)

