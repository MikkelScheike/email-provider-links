# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our software seriously. If you believe you have found a security vulnerability in this package, please report it to us responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: [Your security email - replace this]

Include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes or mitigation strategies
- Your contact information for follow-up questions

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.
- **Initial Assessment**: We will provide an initial assessment within 5 business days.
- **Progress Updates**: We will keep you informed of our progress throughout the investigation.
- **Resolution**: We aim to resolve confirmed vulnerabilities within 30 days.

### Responsible Disclosure

We kindly ask that you:

- Give us reasonable time to investigate and fix the issue before public disclosure
- Avoid accessing, modifying, or deleting other users' data
- Do not perform actions that could negatively affect our users or services
- Act in good faith and avoid violating privacy, destroying data, or interrupting services

### Recognition

We believe in recognizing security researchers who help keep our community safe. If you report a valid security vulnerability, we will:

- Acknowledge your contribution in our security advisory (if desired)
- Work with you on a coordinated disclosure timeline
- Consider you for our security hall of fame (if we establish one)

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

### Proxy Detection

The package can detect when domains are behind proxy services like Cloudflare, which:
- Prevents false provider detection
- Respects privacy by not attempting to bypass proxy protections
- Returns appropriate null results when actual providers cannot be determined

## Reporting Other Issues

For non-security related bugs and issues, please use our [GitHub Issues](https://github.com/[username]/email-provider-links/issues) page.

## Security Updates

Security updates will be released as patch versions and announced through:
- GitHub Security Advisories
- NPM security notifications
- Release notes with security tags

---

Thank you for helping keep our project and community safe! 🔒

