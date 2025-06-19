#!/usr/bin/env tsx

/**
 * Hash Recalculation Utility
 * 
 * Use this script to recalculate security hashes after making
 * legitimate changes to provider data or package.json.
 * 
 * Usage:
 *   npx tsx scripts/recalculate-hashes.ts
 */

import { recalculateHashes } from '../src/security/hash-verifier';
import { join } from 'path';

function main() {
  console.log('🔐 EMAIL PROVIDER LINKS - HASH RECALCULATION UTILITY\n');
  
  // Show current working directory for context
  console.log(`Working directory: ${process.cwd()}\n`);
  
  try {
    // Recalculate hashes
    const configCode = recalculateHashes(join(__dirname, '..', 'src', 'security'));
    
    console.log('\n🎯 WHAT TO DO NEXT:');
    console.log('1. Review git diff to verify changes are legitimate');
    console.log('2. Copy the configuration above to src/security/hash-verifier.ts');
    console.log('3. Replace the KNOWN_GOOD_HASHES constant');
    console.log('4. Commit the hash update with clear commit message');
    console.log('5. Consider requiring code review for hash changes');
    
    console.log('\n📋 Example commit message:');
    console.log('feat: update security hashes after adding new email providers');
    console.log('');
    console.log('- Added support for X new email providers');  
    console.log('- Updated KNOWN_GOOD_HASHES to reflect legitimate changes');
    console.log('- All URLs validated against security allowlist');
    
    console.log('\n⚠️  SECURITY CHECKLIST:');
    console.log('□ Verified all changes in git diff are legitimate');
    console.log('□ No suspicious URLs added to providers.json');
    console.log('□ All new URLs pass security validation');
    console.log('□ Hash recalculation is due to legitimate changes only');
    console.log('□ Changes reviewed by another team member (recommended)');
    
  } catch (error) {
    console.error('❌ Failed to recalculate hashes:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

export { main };

