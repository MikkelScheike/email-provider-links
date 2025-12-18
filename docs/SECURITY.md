# Security Policy

## 🛡️ Security Overview

Email Provider Links implements enterprise-grade security measures to protect against malicious redirects and supply chain attacks. This document outlines our security practices, vulnerability reporting process, and security guarantees.

## 🔒 Security Features

### Multi-Layer Protection

1. **HTTPS-Only Enforcement**
   - All provider URLs must use HTTPS protocol
   - HTTP URLs are automatically rejected
   - Prevents protocol downgrade attacks

2. **Domain Allowlisting**
   - Only pre-approved domains are allowed
   - 93+ verified email providers in allowlist
   - Subdomain validation with precise matching
   - Allowlist is derived from the hash-verified providers database and fails closed on hash mismatch
   - Hostnames are normalized (lowercase + Punycode) before allowlist checks

3. **Malicious Pattern Detection**
   - Blocks IP addresses and localhost
   - Rejects suspicious TLDs (.tk, .ml, .ga, .cf)
   - Detects random subdomain patterns
   - Blocks known URL shorteners

4. **Content Validation**
   - Path traversal prevention (`../`, `%2e%2e`)
   - JavaScript injection protection (`javascript:`, `data:`)
   - Script tag detection (`<script>`, event handlers)
   - URL encoding attack prevention

5. **File Integrity Verification**
   - SHA-256 hash verification for provider database
   - Detects unauthorized modifications
   - Tamper-evident security controls
   - Zero-trust architecture with no insecure fallbacks

## 🚨 Vulnerability Reporting

### Reporting Process

If you discover a security vulnerability, please report it responsibly:

1. **GitHub**: Create a private security advisory (preferred)
2. **Email**: Contact via GitHub profile
3. **Response Time**: We aim to respond within 48 hours

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested mitigation (if available)

### What NOT to Include

- Do not publicly disclose the vulnerability
- Do not test on production systems
- Do not access data that doesn't belong to you

### Recognition

We appreciate responsible disclosure and may recognize security researchers who help improve our security:

- Public acknowledgment (with permission)
- Contribution credit in security advisories

## Security Considerations for Users

### DNS Queries

This package performs DNS queries for custom domain detection. Be aware that:

- DNS queries may leak domain information to DNS resolvers
- DNS responses can be cached by various network components
- DNS queries have configurable timeouts (default: 5 seconds)

### Data Privacy

- This package does not store or transmit email addresses to external services
- Email addresses are only used locally for domain extraction and provider matching
- DNS queries only use domain portions, not full email addresses

### Dependencies

- This package has **zero runtime dependencies** to minimize security surface area
- Development dependencies are regularly audited for vulnerabilities
- We use `npm audit` in our CI/CD pipeline to catch dependency issues

### Usage Recommendations

1. **Input Validation**: Always validate email addresses before passing them to this package
2. **Rate Limiting**: Consider rate limiting DNS-based detection in high-traffic applications
3. **Error Handling**: Implement proper error handling for DNS timeouts and failures
4. **Timeout Configuration**: Adjust DNS timeouts based on your application's requirements

## Security Features

### Built-in Protections

- **Input Sanitization**: Email addresses are validated before processing
- **DNS Timeout Protection**: Configurable timeouts prevent hanging requests
- **Error Isolation**: DNS failures don't crash the application
- **No External APIs**: No dependencies on third-party services for core functionality
- **Zero-Trust Architecture**: All data verified with cryptographic hashes before use
- **Fail-Safe Security**: System fails securely when verification fails

### Proxy Detection

The package can detect when domains are behind proxy services like Cloudflare, which:
- Prevents false provider detection
- Respects privacy by not attempting to bypass proxy protections
- Returns appropriate null results when actual providers cannot be determined

## Reporting Other Issues

For non-security related bugs and issues, please use our [GitHub Issues](https://github.com/mikkelscheike/email-provider-links/issues) page.

## Security Updates

Security updates will be released as patch versions and announced through:
- GitHub Security Advisories
- NPM security notifications
- Release notes with security tags

---

Thank you for helping keep our project and community safe! 🔒

