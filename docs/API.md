# API Documentation

## Email Validation

The library provides comprehensive email validation following international standards:

```typescript
import { validateInternationalEmail } from '@mikkelscheike/email-provider-links';

// Validate an email address
const result = validateInternationalEmail('user@example.com');

// Handle validation results
if (result) {
  console.log(result.code);    // e.g., IDN_VALIDATION_ERROR
  console.log(result.message); // Human-readable error
}
```

### Validation Features
- RFC 5321, 5322, and 6530 compliance
- Full IDN (Punycode) support
- Comprehensive validation checks
- Clear, translatable error messages

## Alias Detection API

## Current API (Over-engineered)
- `detectEmailAlias()` - Detailed analysis object
- `normalizeEmail()` - Get canonical form
- `emailsMatch()` - Check if emails are same person
- `getAliasCapabilities()` - Get provider rules
- `generateAliases()` - Generate test aliases
- `analyzeEmailAliases()` - Batch analysis

## Proposed Simplified API (Only the essentials)

### Keep These (Real Use Cases)
```typescript
// Prevent duplicate accounts
const canonical = normalizeEmail('u.s.e.r+work@gmail.com');
// Returns: 'user@gmail.com'

// Check login against registration
const isSamePerson = emailsMatch('user@gmail.com', 'u.s.e.r+newsletter@gmail.com');
// Returns: true
```

### Remove These (Over-engineering)
- `detectEmailAlias()` - Too detailed, use normalizeEmail instead
- `generateAliases()` - Testing utility, not production use case
- `analyzeEmailAliases()` - Analytics/debugging, belongs in separate module
- `getAliasCapabilities()` - Internal implementation detail

## Real-World Usage Examples

### User Registration (Prevent Duplicates)
```typescript
async function registerUser(email: string) {
  const canonical = normalizeEmail(email);
  const existingUser = await database.findUserByEmail(canonical);
  
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  // Store canonical email
  await database.createUser({ email: canonical });
}
```

### User Login (Match Against Aliases)
```typescript
async function loginUser(email: string, password: string) {
  const canonical = normalizeEmail(email);
  const user = await database.findUserByEmail(canonical);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify password and log in
}
```

### Check if Email is Already Used
```typescript
async function isEmailTaken(newEmail: string): Promise<boolean> {
  const canonical = normalizeEmail(newEmail);
  const existing = await database.findUserByEmail(canonical);
  return existing !== null;
}
```

These are the ONLY use cases that matter in real applications.
