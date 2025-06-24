#!/usr/bin/env tsx
/**
 * Hash Verification Script
 * 
 * This script verifies file hashes before building or publishing.
 * If any hashes don't match, it fails the build process.
 */

import { verifyProvidersIntegrity } from '../src/hash-verifier';

function verifyHashes() {
  console.log('🔒 Verifying file integrity...');
  
  const result = verifyProvidersIntegrity('providers/emailproviders.json');
  
  if (!result.isValid) {
    console.error('❌ Hash verification failed!');
    console.error('File:', result.file);
    console.error('Reason:', result.reason);
    console.error('Expected:', result.expectedHash);
    console.error('Actual:', result.actualHash);
    console.error('\nThis could indicate tampering or corruption.');
    process.exit(1);
  }
  
  console.log('✅ File integrity verified');
}

if (require.main === module) {
  verifyHashes();
}
