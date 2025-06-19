# Examples

This directory contains example usage patterns for the Email Provider Links package.

## Files

- **`example.ts`** - Basic TypeScript usage examples
- **`example-js.js`** - JavaScript usage examples  
- **`example-dns-detection.ts`** - Advanced DNS-based detection examples
- **`example-timeout.ts`** - Custom timeout configuration examples

## Running Examples

### TypeScript Examples
```bash
# Basic example
npx tsx examples/example.ts

# DNS detection example  
npx tsx examples/example-dns-detection.ts

# Timeout configuration
npx tsx examples/example-timeout.ts
```

### JavaScript Example
```bash
node examples/example-js.js
```

## Prerequisites

Make sure you have built the package first:
```bash
npm run build
```

## Example Patterns

### Basic Provider Detection
```typescript
import { getEmailProviderLink } from '@mikkelscheike/email-provider-links';

const result = getEmailProviderLink('user@gmail.com');
console.log(result.loginUrl); // https://mail.google.com/mail/
```

### Advanced DNS Detection
```typescript
import { getEmailProviderLinkWithDNS } from '@mikkelscheike/email-provider-links';

const result = await getEmailProviderLinkWithDNS('user@company.com');
// Automatically detects business email providers like Google Workspace
```

### Error Handling
```typescript
try {
  const result = await getEmailProviderLinkWithDNS('user@example.com', 3000);
  if (result.provider) {
    console.log('Provider found:', result.provider.companyProvider);
  } else {
    console.log('Provider not detected');
  }
} catch (error) {
  console.error('Detection failed:', error);
}
```

