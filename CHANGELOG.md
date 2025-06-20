# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-06-20

### 🚀 Major Features Added

#### Email Alias Detection & Normalization
- **NEW**: Comprehensive email alias detection system
- **NEW**: Smart normalization for Gmail dots (`u.s.e.r@gmail.com` → `user@gmail.com`)
- **NEW**: Plus addressing support (`user+tag@provider.com` → `user@provider.com`)
- **NEW**: Provider-specific aliasing rules (12 major providers)
- **NEW**: Email deduplication and fraud prevention capabilities
- **NEW**: Alias generation tools for testing and development

#### Massive Provider Expansion
- **EXPANDED**: From 74 to 93 email providers (+19 new providers)
- **EXPANDED**: From 147+ to 180+ domain coverage (+30+ domains)
- **NEW**: Comprehensive Asian provider coverage (China, India, Korea, Japan)
- **NEW**: Extended European provider support (Italy, Germany, Belgium, Netherlands, Switzerland, Ireland)
- **NEW**: Eastern European providers (Czech Republic, Slovakia, Poland, Russia)

### 🌍 New Email Providers Added

#### Asian Providers
- **Alibaba Mail** (aliyun.com, alibaba.com, taobao.com, tmall.com) - China's largest e-commerce email
- **Sify Mail** (sify.com, sifymail.com) - Leading Indian ISP email
- **IndiatTimes Mail** (indiatimes.com) - Popular Indian email service
- **Nate Mail** (nate.com) - Korean email provider
- **Hanmail** (hanmail.net) - Korean email service
- **Live.jp** (live.jp) - Microsoft Japan localized email

#### European Providers
- **Virgilio Mail** (virgilio.it, alice.it, tin.it) - Italian email services
- **Telekom Mail** (magenta.de, telekom.de) - German telecommunications email
- **Tiscali Mail** (tiscali.it) - Italian ISP email
- **Skynet Mail** (skynet.be) - Belgian email provider
- **Telenet Mail** (telenet.be) - Belgian telecommunications email
- **Xs4All** (xs4all.nl) - Dutch internet provider email
- **Planet.nl** (planet.nl) - Dutch email service
- **Bluewin Mail** (bluewin.ch) - Swiss telecommunications email
- **Eircom Mail** (eircom.net) - Irish telecommunications email

#### Eastern European Providers
- **Centrum Mail** (centrum.cz, centrum.sk) - Czech/Slovak email portal
- **Interia Mail** (interia.pl) - Polish email service
- **Onet Mail** (onet.pl, poczta.onet.pl, op.pl) - Polish web portal email
- **Rambler Mail** (rambler.ru, lenta.ru, autorambler.ru) - Russian email service

### 🔧 API Enhancements

#### New Functions
- `detectEmailAlias()` - Analyzes email aliases and returns normalization info
- `normalizeEmail()` - Converts email to canonical form
- `emailsMatch()` - Checks if two emails are equivalent when normalized
- `getAliasCapabilities()` - Returns provider's aliasing capabilities
- `generateAliases()` - Creates potential aliases for testing
- `analyzeEmailAliases()` - Analyzes email lists for patterns and statistics

#### Enhanced Exports
- All alias detection functions exported from main module
- Comprehensive TypeScript interfaces for alias detection
- Full backward compatibility maintained

### 🧪 Testing & Quality

#### Expanded Test Coverage
- **INCREASED**: From 142 to 188 tests (+46 new tests)
- **NEW**: Comprehensive alias detection test suite (46 tests)
- **NEW**: Provider-specific aliasing behavior validation
- **NEW**: Edge case testing for complex alias scenarios
- **MAINTAINED**: 100% test coverage across all modules

#### Test Categories Added
- Gmail alias normalization (dots + plus addressing)
- Outlook/Hotmail plus addressing (dots preserved)
- Yahoo/ProtonMail/iCloud plus addressing
- AOL (no aliasing support) validation
- Cross-provider alias matching
- Bulk email analysis and statistics
- Alias generation and validation

### 🛡️ Security & Integrity

#### Updated Security Hashes
- **UPDATED**: Provider database hash for 93 providers
- **UPDATED**: Package.json hash for v1.7.0
- **MAINTAINED**: Enterprise-grade integrity verification
- **MAINTAINED**: Multi-layer security protection

#### Security Features
- **PRESERVED**: All existing security validations
- **ENHANCED**: Hash verification for expanded database
- **MAINTAINED**: HTTPS-only URL enforcement
- **MAINTAINED**: Domain allowlisting and tamper detection

### 📊 Performance & Metrics

#### Package Efficiency
- **SIZE**: 24.4 kB compressed (98.3 kB unpacked) - unchanged despite 25% more providers
- **PERFORMANCE**: O(1) domain lookups maintained
- **MEMORY**: Efficient alias detection algorithms
- **STARTUP**: Fast initialization with optimized data structures

#### Coverage Statistics
- **Providers**: 93 (+19)
- **Domains**: 180+ (+33)
- **Tests**: 188 (+46)
- **Countries**: 25+ regions covered
- **Security Tests**: 72 comprehensive security validations

### 🔄 Backward Compatibility

#### Fully Compatible
- **API**: All existing functions work unchanged
- **TYPES**: No breaking TypeScript interface changes
- **BEHAVIOR**: Existing detection logic preserved
- **MIGRATION**: Zero code changes required for existing users

#### Optional New Features
- **ADDITIVE**: Alias detection is opt-in via new functions
- **NON-BREAKING**: New features don't affect existing workflows
- **EXTENSIBLE**: New capabilities enhance existing functionality

### 📚 Documentation & Examples

#### New Documentation
- **NEW**: Comprehensive alias detection examples
- **NEW**: Provider capability reference
- **NEW**: Email normalization guide
- **NEW**: Fraud prevention patterns
- **UPDATED**: API documentation with new functions

#### Example Files
- **NEW**: `example-alias-detection.ts` - Complete alias detection showcase
- **UPDATED**: README with new features and provider counts
- **MAINTAINED**: All existing examples and documentation

### 🔧 Development Experience

#### Enhanced TypeScript Support
- **NEW**: `AliasDetectionResult` interface
- **NEW**: `AliasRule` interface for provider capabilities
- **NEW**: Comprehensive type definitions for all alias functions
- **MAINTAINED**: Full type safety across all modules

#### Developer Tools
- **MAINTAINED**: All existing developer utilities
- **ENHANCED**: Security hash recalculation for expanded database
- **PRESERVED**: Build and test automation

### 🚀 What's Next

This release establishes the foundation for advanced email handling features. Future releases may include:
- SMTP/IMAP configuration detection
- OAuth provider mapping
- Advanced business domain analysis
- Real-time provider status monitoring

---

## Previous Releases

### [1.6.0] - 2025-06-20
- Added Korean providers (Naver, Daum)
- Added Japanese provider (Biglobe)
- Added Amazon WorkMail enterprise support
- Enhanced international coverage
- Improved DNS detection and rate limiting

### [1.5.1] - 2025-06-19
- Database cleanup and duplicate removal
- Enhanced security validation
- Improved test coverage
- Documentation updates

### [1.5.0] - 2025-06-18
- Major provider database expansion
- Enhanced security features
- Rate limiting system
- Comprehensive international coverage

---

**Full Changelog**: https://github.com/mikkelscheike/email-provider-links/compare/v1.6.0...v1.7.0
