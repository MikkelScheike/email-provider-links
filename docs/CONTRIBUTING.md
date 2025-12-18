# Contributing to Email Provider Links

Thank you for your interest in contributing! This guide will help you contribute effectively while maintaining our security standards.

## 🤝 Ways to Contribute

- 📧 **Add new email providers**
- 🐛 **Report bugs and issues**
- 🔒 **Improve security features**
- 📚 **Enhance documentation**
- 🧪 **Add tests and improve coverage**

## 📧 Adding Email Providers

### Security Requirements

All new email providers must meet these security criteria:

1. **HTTPS-Only**: Provider login URL must use HTTPS
2. **Legitimate Domain**: Must be a verified email service provider
3. **Security Validation**: Must pass our allowlist verification
4. **No Suspicious Patterns**: Domain must not match suspicious patterns

### Step-by-Step Process

1. **Research the Provider**
   - Verify it's a legitimate email service
   - Find the correct login/webmail URL
   - Check if it supports custom domains

2. **Add to Provider Database**
   Edit `providers/emailproviders.json`:
   ```json
   {
     "companyProvider": "Provider Name",
     "loginUrl": "https://mail.provider.com/login",
     "domains": ["provider.com", "provider.net"],
     "customDomainDetection": {
       "mxPatterns": ["mx.provider.com"],
       "txtPatterns": ["v=spf1 include:spf.provider.com"]
     }
   }
   ```

3. **Update Security Hashes**
   ```bash
   npx tsx scripts/recalculate-hashes.ts
   # Copy the output to src/hash-verifier.ts
   ```

4. **Run Security Tests**
   ```bash
   npm test -- __tests__/security.test.ts
   ```

5. **Optional: Run Live DNS Verification**
   ```bash
   RUN_LIVE_DNS=1 npm test -- __tests__/provider-live-dns.test.ts
   ```

6. **Create Pull Request**
   - Include verification that the provider is legitimate
   - Ensure all security tests pass
   - Update provider count in README if needed

## 🛡️ Security Guidelines

### Security Checklist

- [ ] Provider URL uses HTTPS protocol
- [ ] Domain is added to security allowlist
- [ ] Security hashes are recalculated
- [ ] All security tests pass
- [ ] No suspicious patterns detected

### What We Reject

❌ **URL shorteners** (bit.ly, tinyurl.com, etc.)
❌ **IP addresses** (192.168.1.1, etc.)
❌ **Suspicious TLDs** (.tk, .ml, .ga, .cf)
❌ **Non-HTTPS URLs**
❌ **Phishing or suspicious domains**

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Security tests only
npm test -- __tests__/security.test.ts

# With coverage
npm test -- --coverage
```

## 📋 Pull Request Process

### PR Template

```markdown
## Description
Brief description of changes

## Provider Information (if adding provider)
- **Provider Name**: 
- **Login URL**: 
- **Verification**: Link to provider's official website
- **Security Check**: ✅ Passes all security validation

## Testing
- [ ] All existing tests pass
- [ ] Security tests pass
- [ ] Hash verification updated (if needed)

## Security Checklist
- [ ] HTTPS-only URL
- [ ] Domain added to allowlist
- [ ] No suspicious patterns
- [ ] Verified legitimate provider
```

## 🚨 Security-Related Contributions

### Reporting Security Issues

- **DO NOT** open public issues for security vulnerabilities
- Use GitHub's private security advisory feature
- See [SECURITY.md](SECURITY.md) for detailed reporting guidelines

## 📦 Release Process

### Quick Release (Recommended)

Use the automated release preparation script:

```bash
# Major version (breaking changes)
npx tsx scripts/prepare-release.ts 3.0.0 --major

# Minor version (new features)  
npx tsx scripts/prepare-release.ts 2.1.0 --minor

# Patch version (bug fixes)
npx tsx scripts/prepare-release.ts 2.0.1 --patch
```

The script handles:
1. Version updates
2. Security hash recalculation
3. Test verification
4. Build validation
5. Semantic release commit creation

### Manual Release Steps

1. **Prerequisites**
   - Be on `main` branch
   - Clean working directory
   - Authenticated with npm
   - All tests passing

2. **Update Version**
   - Update version in package.json
   - Recalculate security hashes if needed

3. **Testing & Build**
   ```bash
   npm test
   npm run build
   ```

4. **Create Release Commit**
   ```bash
   # For breaking changes
   git commit -m "feat!: v2.0.0 complete API rewrite
   
   BREAKING CHANGE: Complete API redesign"

   # For new features
   git commit -m "feat: v1.8.0 enhanced alias detection"

   # For bug fixes
   git commit -m "fix: v1.7.1 resolve DNS timeout issues"
   ```

5. **Push to GitHub**
   ```bash
   git push origin main
   ```

The semantic-release bot will handle the rest automatically.

## ❓ Questions?

- **General Questions**: Open a GitHub issue
- **Security Questions**: See [SECURITY.md](SECURITY.md)
- **Provider Questions**: Include verification details in your issue

Thank you for helping make email provider detection secure and reliable! 🔒✨
