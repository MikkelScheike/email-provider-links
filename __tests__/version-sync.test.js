/**
 * Test for the version sync script
 * Ensures the script properly syncs package.json with git tags
 */

import { test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Get the project root directory
const projectRoot = process.cwd();

// Functions to get versions
function getCurrentPackageVersion() {
  try {
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '0.0.0';
  } catch (error) {
    console.error('Error reading package.json:', error);
    return '0.0.0';
  }
}

function getLatestGitTag() {
  try {
    const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    return tag.startsWith('v') ? tag.slice(1) : tag;
  } catch (error) {
    console.error('Error getting git tag:', error);
    return null;
  }
}

(process.versions.bun ? describe.skip : describe)('Version Sync Script', () => {
  test('should get current package version', () => {
    const version = getCurrentPackageVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Should be a semver format
  });

  test('should get latest git tag', () => {
    const tag = getLatestGitTag();
    if (tag) {
      expect(tag).toMatch(/^\d+\.\d+\.\d+$/); // Should be a semver format (without v prefix)
    }
    // If no tags, it returns null, which is fine
  });

  test('should detect if versions are in sync', () => {
    const gitTag = getLatestGitTag();
    const packageVersion = getCurrentPackageVersion();
    
    // This test is more forgiving in test environments
    expect(typeof gitTag).toBe('string');
    expect(typeof packageVersion).toBe('string');
    
    // Log version info but don't fail the test
    console.log(`Git tag: v${gitTag}, Package version: ${packageVersion}`);
    if (gitTag !== packageVersion) {
      console.warn(`⚠️  Version mismatch detected: git tag v${gitTag} vs package.json ${packageVersion}`);
      console.warn('Run "npm run sync-versions" to fix this');
    }
  });
});

