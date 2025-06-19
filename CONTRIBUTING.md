# Contributing to Email Provider Links

We welcome contributions! This guide will help you add new email providers to the package.

## Adding New Email Providers

Email providers are stored in the `providers/emailproviders.json` file. To add a new provider:

### 1. Edit the JSON File

Open `providers/emailproviders.json` and add your provider to the `providers` array:

```json
{
  "companyProvider": "Company Name",
  "loginUrl": "https://login.provider.com/",
  "domains": ["provider.com", "mail.provider.com"]
}
```

### 2. Required Fields

Each provider must have these fields:

- **`companyProvider`** (string): The company name that owns/operates the service
- **`loginUrl`** (string): Direct URL to the login page 
- **`domains`** (array): All email domains this provider handles

### 3. Finding the Right Login URL

The login URL should be the direct link where users sign in to check their email. Here are some tips:

- ✅ **Good**: `https://accounts.google.com/signin` (Google)
- ✅ **Good**: `https://outlook.live.com/owa/` (Microsoft)
- ❌ **Avoid**: Homepage URLs like `https://gmail.com`
- ❌ **Avoid**: Generic company pages

### 4. Domain Guidelines

Include all relevant domains for the provider:

- Main domain (e.g., `gmail.com`)
- Alternative domains (e.g., `googlemail.com`)
- Regional variants (e.g., `yahoo.co.uk`, `yahoo.ca`)
- Legacy domains (e.g., `hotmail.com` for Microsoft)

### 5. Example Addition

Here's how to add a fictional provider:

```json
{
  "companyProvider": "Example Corporation",
  "loginUrl": "https://mail.example.com/login",
  "domains": ["example.com", "mail.example.com", "example.net"]
}
```

### 6. Testing Your Addition

After adding a provider:

1. **Build the package**:
   ```bash
   npm run build
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Test manually**:
   ```bash
   npx tsx example.ts
   # or
   node example-js.js
   ```

### 7. Add Tests (Optional but Appreciated)

If you want to add tests for your provider, edit `src/index.test.ts`:

```typescript
it('should return correct result for ExampleMail', () => {
  const result = getEmailProviderLink('user@example.com');
  expect(result.provider?.companyProvider).toBe('Example Corporation');
  expect(result.loginUrl).toBe('https://mail.example.com/login');
});
```

## Package Structure

- **`providers/emailproviders.json`**: Contains all email provider data
- **`src/index.ts`**: Main TypeScript source code
- **`dist/`**: Compiled JavaScript (auto-generated)
- **`example.ts`**: TypeScript usage example
- **`example-js.js`**: JavaScript usage example

## Pull Request Guidelines

When submitting a pull request:

1. **Clear title**: "Add [Company Name] email provider"
2. **Description**: Include why this provider should be added
3. **Test locally**: Ensure tests pass and examples work
4. **One provider per PR**: Keep changes focused

## Provider Criteria

We accept providers that are:

- ✅ Legitimate email services
- ✅ Have a significant user base
- ✅ Publicly accessible
- ✅ Have a working login URL

We may decline providers that are:

- ❌ Internal/corporate email systems
- ❌ Temporary/disposable email services
- ❌ Have broken or inaccessible login pages
- ❌ Duplicates of existing providers

## JavaScript & TypeScript Support

This package works with both JavaScript and TypeScript:

**TypeScript:**
```typescript
import { getEmailProviderLink } from 'email-provider-links';
const result = getEmailProviderLink('user@gmail.com');
console.log(result.provider?.companyProvider); // "Google"
```

**JavaScript:**
```javascript
const { getEmailProviderLink } = require('email-provider-links');
const result = getEmailProviderLink('user@gmail.com');
console.log(result.provider.companyProvider); // "Google"
```

## Questions?

Feel free to open an issue if you:

- Need help finding the right login URL
- Are unsure about domain variants
- Want to discuss a provider before adding it
- Have questions about the contribution process

## Code of Conduct

Please be respectful and constructive in all interactions. We want this to be a welcoming project for everyone.

---

Thank you for helping make email provider detection better for everyone! 🚀

