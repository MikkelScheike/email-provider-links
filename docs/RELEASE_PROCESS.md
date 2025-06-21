# Release Process Guide

This document outlines the complete release process for email-provider-links, including automated scripts and manual steps.

## Quick Release (Recommended)

Use the automated release preparation script:

```bash
# Major version (breaking changes)
npx tsx scripts/prepare-release.ts 3.0.0 --major

# Minor version (new features)  
npx tsx scripts/prepare-release.ts 2.1.0 --minor

# Patch version (bug fixes)
npx tsx scripts/prepare-release.ts 2.0.1 --patch
```

The script will:
1. ✅ Validate prerequisites (git branch, working directory, npm auth)
2. ✅ Update package.json version
3. ✅ Recalculate and update security hashes automatically
4. ✅ Run comprehensive tests (366 tests with coverage)
5. ✅ Verify build compilation
6. ✅ Generate semantic-release compatible commit
7. ✅ Show push instructions

Then just **push to GitHub** and semantic-release handles the rest!

## Manual Release Process

If you need to do a manual release, follow these steps:

### 1. Prerequisites
- [ ] On `main` branch
- [ ] Working directory clean (or review uncommitted changes)
- [ ] npm authenticated (`npm whoami`)
- [ ] All tests passing

### 2. Version Update
```bash
# Update package.json version manually
vim package.json
```

### 3. Security Hash Recalculation
```bash
# Recalculate security hashes
npx tsx scripts/recalculate-hashes.ts

# Copy the output and update src/security/hash-verifier.ts
# Update the KNOWN_GOOD_HASHES constant with new values
```

### 4. Testing & Build
```bash
# Run all tests
npm test

# Verify build
npm run build

# Optional: Test coverage
npm run test:coverage
```

### 5. Semantic Release Commit

Create a commit with proper semantic-release format:

**For Major Versions (Breaking Changes):**
```bash
git add .
git commit -m "feat!: v2.0.0 complete API rewrite

BREAKING CHANGE: Complete API redesign with async-first patterns

- New getEmailProvider() API replaces getEmailProviderOptimized()
- loadProviders() no longer accepts parameters
- Enhanced email alias detection and normalization
- Concurrent DNS resolution for business domains"
```

**For Minor Versions (New Features):**
```bash
git add .
git commit -m "feat: v1.8.0 - enhanced alias detection

- Advanced Gmail alias normalization
- Plus addressing support for 12 providers
- New normalizeEmail() and emailsMatch() functions"
```

**For Patch Versions (Bug Fixes):**
```bash
git add .
git commit -m "fix: v1.7.1 - resolve DNS timeout issues

- Fix concurrent DNS timeout handling
- Improve error messages for network failures"
```

### 6. Push and Release
```bash
# Push to trigger semantic-release
git push origin main

# Or use GitKraken to push the main branch
```

## Semantic Release Bot

Our semantic-release bot automatically:

1. **Analyzes commits** for conventional commit format
2. **Determines version bump** based on commit types:
   - `feat!:` or `BREAKING CHANGE:` → Major version (2.0.0)
   - `feat:` → Minor version (1.8.0)
   - `fix:` → Patch version (1.7.1)
3. **Creates GitHub release** with auto-generated notes
4. **Publishes to npm** automatically
5. **Updates package.json** version via commit

## Version Sync Script

The `scripts/sync-versions.js` script runs automatically before tests and builds to ensure package.json and git tags stay in sync. It can be temporarily disabled with:

```bash
SKIP_VERSION_SYNC=1 npm test
SKIP_VERSION_SYNC=1 npm run build
```

## Security Hash Management

### Why We Use Hashes
- **Data Integrity**: Ensure provider data hasn't been tampered with
- **Supply Chain Security**: Detect unauthorized modifications
- **Release Validation**: Verify legitimate changes only

### Hash Files Tracked
- `providers/emailproviders.json` - Provider database
- `package.json` - Package metadata

### When to Update Hashes
- ✅ Adding new email providers
- ✅ Updating provider URLs or metadata
- ✅ Changing package.json version
- ❌ Never update hashes without verifying changes are legitimate

### Hash Update Process
```bash
# 1. Make legitimate changes to provider data
vim providers/emailproviders.json

# 2. Recalculate hashes
npx tsx scripts/recalculate-hashes.ts

# 3. Copy output to hash-verifier.ts
vim src/security/hash-verifier.ts

# 4. Commit with clear message explaining why
git commit -m "security: update hashes after adding Gmail enterprise domains"
```

## Troubleshooting

### Version Mismatch Issues
If package.json and git tags get out of sync:
```bash
# Check current versions
git describe --tags
grep version package.json

# Use the prepare-release script to fix
npx tsx scripts/prepare-release.ts 2.0.0 --major
```

### Test Failures
```bash
# Run specific test suites
npm test -- __tests__/api.test.ts
npm test -- __tests__/security.test.ts

# Run with coverage
npm run test:coverage
```

### Build Issues
```bash
# Clean rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

### Semantic Release Issues
```bash
# Check if commit follows conventional format
git log --oneline -1

# Required format: type(scope): description
# Examples:
# ✅ feat: add new providers
# ✅ fix: resolve DNS timeout
# ✅ feat!: breaking API changes
# ❌ Added new feature (no type prefix)
```

## Release Checklist

### Pre-Release
- [ ] All features tested and working
- [ ] Documentation updated (README, CHANGELOG)
- [ ] Version number chosen (semver)
- [ ] Security hashes updated if needed

### Release Execution  
- [ ] Run release preparation script OR manual steps
- [ ] Review generated commit
- [ ] Push to GitHub
- [ ] Monitor GitHub Actions for semantic-release

### Post-Release
- [ ] Verify GitHub release created
- [ ] Check npm package published
- [ ] Test installation: `npm install @mikkelscheike/email-provider-links@latest`
- [ ] Update any dependent projects

## Emergency Procedures

### Unpublish Bad Release
```bash
# Within 24 hours of publishing
npm unpublish @mikkelscheike/email-provider-links@2.0.0

# Fix issues, then republish
npm publish
```

### Hotfix Release
```bash
# Create hotfix branch from last good release
git checkout v1.9.0
git checkout -b hotfix/critical-fix

# Make minimal fix
# Test thoroughly
# Use patch version bump
npx tsx scripts/prepare-release.ts 1.9.1 --patch
```

## Contact

For release process questions or issues:
- GitHub Issues: https://github.com/mikkelscheike/email-provider-links/issues
- Security Issues: https://github.com/mikkelscheike/email-provider-links/security
