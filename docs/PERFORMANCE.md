# Performance and Detection System

## Performance Benchmarks

This package is rigorously tested for performance with comprehensive metrics:

### Load Time Performance
- **Initial load**: < 50ms
- **Cached access**: < 1ms
- **Cache hit rate**: > 99.9% for known providers

### Memory Usage
- **Base footprint**: ~0.39MB initial load
- **Operation cost**: < 10MB growth for 1000 operations
- **Cache efficiency**: < 1MB overhead after cache clear
- **Long-term usage**: < 15MB growth after 1000 iterations

### Operation Speed
- **Sync operations**: > 50,000 ops/second
- **Bulk lookups**: 1000 random domains in < 50ms
- **Concurrent load**: 100 parallel requests in < 1 second
- **Average latency**: < 1ms per cached lookup
- **Maximum latency**: < 5ms per lookup

### Cache Performance
- **Access time**: < 1ms average
- **Cache hits**: > 99% for known providers
- **Memory overhead**: < 1MB for full provider cache
- **Cache rebuild**: < 50ms complete reload

To run performance tests locally:
```bash
npm test __tests__/performance.test.ts
```

## Email Provider Detection System

The library uses a sophisticated multi-tier detection system:

### 1. Public Email Providers
- **Direct matching** against 93+ known providers
- **Instant response** (< 1ms) for known domains
- **Zero DNS queries** needed
- Examples: Gmail, Outlook, Yahoo, etc.

### 2. Proxy Services
- **Special handling** for email proxy/relay services
- **Custom validation** rules per service
- **Advanced alias detection**
- Examples: SimpleLogin, AnonAddy, Apple Private Relay

### 3. Custom Domains (Business Email)
- **Concurrent DNS detection** for unknown domains
- **Pattern matching** against known providers:
  - MX record patterns
  - TXT record validation
  - SPF record analysis
- Examples: Google Workspace, Microsoft 365, Amazon WorkMail

### 4. Detection Methods
```typescript
const result = await getEmailProvider('user@example.com');
console.log(result.detectionMethod);
// Can be one of:
// - 'domain_match'   (Known provider, instant)
// - 'mx_record'      (DNS MX detection)
// - 'txt_record'     (DNS TXT detection)
// - 'both'          (Both MX and TXT match)
// - 'proxy_detected' (Email proxy service)
```

### 5. Confidence Scoring
```typescript
const result = await getEmailProviderFast('user@example.com');
console.log(result.confidence); // 0.0 to 1.0
// Where:
// 1.0 = Known provider (100% certain)
// 0.9 = Strong DNS match
// 0.7 = Partial DNS match
// 0.5 = Weak pattern match
```
