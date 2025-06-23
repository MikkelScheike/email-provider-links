# Examples

This directory contains example usage patterns for the Email Provider Links package.

## Files

- **`example.ts`** - Basic TypeScript usage examples
- **`example-js.js`** - JavaScript usage examples  
- **`example-dns-detection.ts`** - Advanced DNS-based detection examples
- **`example-timeout.ts`** - Custom timeout configuration examples
- **`example-config.ts`** - Configuration constants and performance examples
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

# Configuration examples
npx tsx examples/example-config.ts
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
import { getEmailProvider } from '@mikkelscheike/email-provider-links';

// Supports 93 providers with 178 domains
const result = await getEmailProvider('user@gmail.com');
console.log(result.loginUrl); // https://mail.google.com/mail/

// Works with international domains too
const yahoo = await getEmailProvider('user@yahoo.co.uk');
console.log(yahoo.provider?.companyProvider); // 'Yahoo Mail'

// Security-focused providers
const proton = await getEmailProvider('user@proton.me');
console.log(proton.loginUrl); // https://mail.proton.me
```

### Advanced DNS Detection
```typescript
import { getEmailProvider, getEmailProviderFast } from '@mikkelscheike/email-provider-links';

// Standard detection with DNS fallback
const result = await getEmailProvider('user@company.com');
// Automatically detects business email providers like Google Workspace

// High-performance detection with timing metrics
const fastResult = await getEmailProviderFast('user@company.com', {
  enableParallel: true,
  collectDebugInfo: true
});
console.log('Detection time:', fastResult.timing?.total, 'ms');
```

### Configuration
```typescript
import { Config } from '@mikkelscheike/email-provider-links';

// Access configuration constants
console.log('Default timeout:', Config.DEFAULT_DNS_TIMEOUT);         // 5000ms
console.log('Rate limit:', Config.MAX_DNS_REQUESTS_PER_MINUTE);     // 10 requests/min
console.log('Providers supported:', Config.SUPPORTED_PROVIDERS_COUNT); // 93
console.log('Domains supported:', Config.SUPPORTED_DOMAINS_COUNT);     // 178

// Custom timeout for DNS detection
const result = await getEmailProvider('user@company.com', 3000);
```

### Error Handling
```typescript
try {
  const result = await getEmailProvider('user@example.com', 3000);
  if (result.provider) {
    console.log('Provider found:', result.provider.companyProvider);
  } else if (result.error) {
    console.log('Error:', result.error.type, '-', result.error.message);
    if (result.error.type === 'RATE_LIMITED') {
      console.log('Retry after:', result.error.retryAfter, 'seconds');
    }
  } else {
    console.log('Provider not detected');
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

