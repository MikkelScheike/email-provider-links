#!/usr/bin/env tsx
/**
 * Semantic Release Preparation Script
 * 
 * Prepares the codebase for semantic-release automation:
 * - Updates security hashes for data integrity
 * - Runs comprehensive tests and build verification
 * - Creates semantic-release compatible commits
 * - NO manual version management (semantic-release handles this)
 * 
 * IMPORTANT: Commit Message Policy (Conventional Commits)
 * - This script will ONLY generate commit types that semantic-release recognizes for versioning:
 *   - patch  -> "fix"
 *   - minor  -> "feat"
 *   - major  -> "feat!" (breaking change)
 * - It will NEVER use non-releasing types such as "test", "chore", "docs", etc. for release prep commits.
 * - Scopes may vary, but type will always be one of: fix | feat | feat!
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

interface SemanticReleaseConfig {
  releaseType: 'patch' | 'minor' | 'major';
}

class SemanticReleaseManager {
  private projectRoot: string;
  
  constructor() {
    this.projectRoot = process.cwd();
  }

  private hasGit(): boolean {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Main semantic release preparation workflow
   */
  async prepareSemanticRelease(config: SemanticReleaseConfig): Promise<void> {
    console.log('🚀 EMAIL PROVIDER LINKS - SEMANTIC RELEASE PREPARATION');
    console.log('=' .repeat(60));
    console.log(`🔄 Release Type: ${config.releaseType}`);
    console.log('ℹ️  Semantic-release will determine final version automatically');
    console.log('');

    try {
      // Step 1: Validate prerequisites
      await this.validatePrerequisites();

      // Step 2: Update security hashes (based on current state)
      await this.updateSecurityHashes();

      // Step 3: Run comprehensive tests
      await this.runTests();

      // Step 4: Verify build
      await this.verifyBuild();

      // Step 5: Create semantic-release compatible commit
      await this.createSemanticCommit(config);

      // Step 6: Show final instructions
      this.showFinalInstructions(config);

    } catch (error) {
      console.error('❌ Release preparation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Validate that all prerequisites are met
   */
  private async validatePrerequisites(): Promise<void> {
    console.log('🔍 STEP 1: Validating Prerequisites');
    console.log('-'.repeat(40));

    // Check if git is available and on main branch
    if (this.hasGit()) {
      try {
        const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
        if (branch !== 'main') {
          throw new Error(`Must be on main branch, currently on: ${branch}`);
        }
        console.log('✅ On main branch');
      } catch (error) {
        throw new Error('Failed to check git branch');
      }
    } else {
      console.log('ℹ️  Git not found; skipping branch check (CI will validate later)');
    }

    // Check for uncommitted changes (only if git available)
    if (this.hasGit()) {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
        if (status) {
          console.log('⚠️  Uncommitted changes detected:');
          console.log(status);
          console.log('ℹ️  These will be included in the semantic commit');
        } else {
          console.log('✅ Working directory clean');
        }
      } catch (error) {
        throw new Error('Failed to check git status');
      }
    } else {
      console.log('ℹ️  Skipping git status check (git not available)');
    }

    console.log('');
  }

  /**
   * Recalculate and update security hashes
   */
  private async updateSecurityHashes(): Promise<void> {
    console.log('🔐 STEP 2: Updating Security Hashes');
    console.log('-'.repeat(40));

    // Calculate new hashes
    const hashes = this.calculateHashes();
    
    // Update hash-verifier.ts
    await this.updateHashVerifier(hashes);
    
    console.log('✅ Security hashes updated');
    console.log('');
  }

  /**
   * Calculate file hashes
   */
  private calculateHashes(): Record<string, string> {
    const files = [
      'providers/emailproviders.json',
      'package.json'
    ];

    const hashes: Record<string, string> = {};

    for (const file of files) {
      try {
        const fullPath = join(this.projectRoot, file);
        // Match hash-verifier and update-hashes: UTF-8 + normalized line endings
        const raw = readFileSync(fullPath, 'utf-8');
        const normalized = raw.replace(/\r\n/g, '\n');
        const hash = createHash('sha256').update(normalized, 'utf8').digest('hex');
        const fileName = file.split('/').pop() || file;
        hashes[fileName] = hash;
        console.log(`✅ ${file}: ${hash}`);
      } catch (error) {
        console.error(`❌ Failed to hash ${file}:`, error);
        throw error;
      }
    }

    return hashes;
  }

  /**
   * Update the hash-verifier.ts file with new hashes
   */
  private async updateHashVerifier(hashes: Record<string, string>): Promise<void> {
    const hashVerifierPath = join(this.projectRoot, 'src/hash-verifier.ts');
    let content = readFileSync(hashVerifierPath, 'utf-8');

    // Update emailproviders.json hash
    content = content.replace(
      /'emailproviders\.json': '[a-f0-9]{64}'/,
      `'emailproviders.json': '${hashes['emailproviders.json']}'`
    );

    // Update package.json hash
    content = content.replace(
      /'package\.json': '[a-f0-9]{64}'/,
      `'package.json': '${hashes['package.json']}'`
    );

    writeFileSync(hashVerifierPath, content);
  }

  /**
   * Run comprehensive tests
   */
  private async runTests(): Promise<void> {
    console.log('🧪 STEP 3: Running Tests');
    console.log('-'.repeat(40));

    try {
      // Disable version sync temporarily to avoid conflicts
      const output = execSync('npm test', { 
        encoding: 'utf-8',
        env: { ...process.env, SKIP_VERSION_SYNC: '1' }
      });
      
      // Extract test results
      const lines = output.split('\n');
      const testSummary = lines.find(line => line.includes('Test Suites:'));
      
      if (testSummary) {
        console.log(`✅ ${testSummary}`);
      }
      
      console.log('✅ All tests passed');
    } catch (error) {
      throw new Error('Tests failed - please fix before release');
    }

    console.log('');
  }

  /**
   * Verify build works
   */
  private async verifyBuild(): Promise<void> {
    console.log('🔨 STEP 4: Verifying Build');
    console.log('-'.repeat(40));

    try {
      execSync('npm run build', { 
        encoding: 'utf-8', 
        stdio: 'pipe',
        env: { ...process.env, SKIP_VERSION_SYNC: '1' }
      });
      console.log('✅ Build successful');
    } catch (error) {
      throw new Error('Build failed - please fix before release');
    }

    console.log('');
  }

  /**
   * Create semantic-release compatible commit (no version changes)
   */
  private async createSemanticCommit(config: SemanticReleaseConfig): Promise<void> {
    console.log('📝 STEP 5: Creating Semantic Release Commit');
    console.log('-'.repeat(40));

    if (!this.hasGit()) {
      console.log('ℹ️  Git not found; skipping semantic commit. CI will release based on existing commits.');
      return;
    }

    // Stage only security hash changes (no version changes)
    execSync('git add src/hash-verifier.ts');

    // Check if there are changes to commit
    try {
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' }).trim();
      if (!staged) {
        console.log('ℹ️  No changes to commit');
        return;
      }
      console.log('📁 Staged files:', staged.split('\n').join(', '));
    } catch (error) {
      console.log('ℹ️  Unable to check staged files');
    }

    // Generate semantic commit message
    const commitMessage = this.generateSemanticCommitMessage(config);
    
    // Create commit
    try {
      execSync(`git commit -m \"${commitMessage}\"`, { encoding: 'utf-8' });
      console.log('✅ Semantic release commit created');
    } catch (error) {
      console.log('ℹ️  Commit creation skipped (no changes or already committed)');
    }

    console.log('');
  }

  /**
   * Generate semantic-release compatible commit message (for security updates only)
   */
  private generateSemanticCommitMessage(config: SemanticReleaseConfig): string {
    const { releaseType } = config;

    // Strict mapping to releasing commit types only
    const typeMap: Record<SemanticReleaseConfig['releaseType'], string> = {
      patch: 'fix',
      minor: 'feat',
      major: 'feat!'
    } as const;

    const commitType = typeMap[releaseType];

    let message = `${commitType}: update security hashes and prepare for release`;

    // Add detailed body for semantic-release
    message += '\n\n';
    message += 'This commit updates security verification hashes and prepares ';
    message += 'the codebase for automated release via semantic-release.\n\n';
    message += 'Changes:\n';
    message += '- Updated security hash verification\n';
    message += '- Verified all tests passing\n';
    message += '- Confirmed build compatibility';

    return message.replace(/\"/g, '\\\"'); // Escape quotes for shell
  }

  /**
   * Show final instructions
   */
  private showFinalInstructions(config: SemanticReleaseConfig): void {
    console.log('🎯 STEP 6: Final Instructions');
    console.log('-'.repeat(40));
    console.log('✅ Release preparation complete!');
    console.log('');
    console.log('📋 READY FOR SEMANTIC RELEASE:');
    console.log(`• Prepared ${config.releaseType} release`);
    console.log('• All tests passing');
    console.log('• Build verified');
    console.log('• Security hashes updated');
    console.log('• Semantic commit created');
    console.log('');
    console.log('📋 NEXT STEPS (Manual):');
    console.log('1. 🔍 Review changes: git log --oneline -2');
    console.log('2. 🚀 Push to GitHub using GitKraken');
    console.log('');
    console.log('🤖 SEMANTIC-RELEASE WILL AUTOMATICALLY:');
    console.log(`• Analyze commit messages since last release`);
    console.log(`• Determine version bump (${config.releaseType} expected)`);
    console.log('• Update package.json with final version');
    console.log('• Build and run tests');
    console.log('• Publish to NPM');
    console.log('• Create git tag and GitHub release');
    console.log('• Generate release notes from commits');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('• Push both the commit AND any tags');
    console.log('• Monitor GitHub Actions for build status');
    console.log('• Verify the published package on npmjs.com');
    console.log('');
    console.log(`🎉 Ready for semantic release!`);
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
📦 EMAIL PROVIDER LINKS - SEMANTIC RELEASE PREPARATION SCRIPT

Usage: npx tsx scripts/prepare-semantic-release.ts [options]

Examples:
  npx tsx scripts/prepare-semantic-release.ts --patch   # Bug fixes
  npx tsx scripts/prepare-semantic-release.ts --minor   # New features
  npx tsx scripts/prepare-semantic-release.ts --major   # Breaking changes

Options:
  --major     Major version (breaking changes)
  --minor     Minor version (new features)  
  --patch     Patch version (bug fixes) [default]
  --help      Show this help

Note: Semantic-release will determine the actual version number automatically
based on conventional commit messages.
    `);
    process.exit(0);
  }

  const releaseType = args.includes('--major') ? 'major' : 
                     args.includes('--minor') ? 'minor' : 'patch';

  const config: SemanticReleaseConfig = {
    releaseType
  };

  const releaseManager = new SemanticReleaseManager();
  await releaseManager.prepareSemanticRelease(config);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { SemanticReleaseManager, type SemanticReleaseConfig };
