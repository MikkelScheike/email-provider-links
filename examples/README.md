# Examples

This directory contains example usage patterns for the Email Provider Links package.

## Files

- **`example.ts`** - Basic TypeScript usage examples
- **`example-js.js`** - JavaScript usage examples  
- **`example-dns-detection.ts`** - Advanced DNS-based detection examples
- **`example-timeout.ts`** - Custom timeout configuration examples
- **`example-rate-limiting.ts`** - Rate limiting configuration and examples
- **`example-alias-detection.ts`** 🆕 - Email alias detection and normalization examples (v1.7.0)

## Running Examples

### TypeScript Examples
```bash
# Basic example
npx tsx examples/example.ts

# DNS detection example  
npx tsx examples/example-dns-detection.ts

# Timeout configuration
npx tsx examples/example-timeout.ts

# Rate limiting examples
npx tsx examples/example-rate-limiting.ts
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

// Supports 93 providers with 180+ domains
const result = getEmailProviderLink('user@gmail.com');
console.log(result.loginUrl); // https://mail.google.com/mail/

// Works with international domains too
const yahoo = getEmailProviderLink('user@yahoo.co.uk');
console.log(yahoo.provider?.companyProvider); // 'Yahoo Mail'

// Security-focused providers
const proton = getEmailProviderLink('user@proton.me');
console.log(proton.loginUrl); // https://mail.proton.me
```

### Advanced DNS Detection
```typescript
import { getEmailProviderLinkWithDNS } from '@mikkelscheike/email-provider-links';

const result = await getEmailProviderLinkWithDNS('user@company.com');
// Automatically detects business email providers like Google Workspace
```

### Rate Limiting
```typescript
import { RateLimit } from '@mikkelscheike/email-provider-links';

// Check current rate limit status
const limiter = RateLimit.getCurrentLimiter();
console.log('Current count:', limiter.getCurrentCount());
console.log('Time until reset:', limiter.getTimeUntilReset());

// Create custom rate limiter
const customLimiter = new RateLimit.SimpleRateLimiter(20, 120000); // 20 requests per 2 minutes
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
  if (error.message.includes('Rate limit exceeded')) {
    console.log('Rate limited - please wait before retrying');
  } else {
    console.error('Detection failed:', error);
  }
}
```

