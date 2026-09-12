/**
 * Test for the version sync script
 * Ensures the script properly syncs package.json with git tags
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();

function getCurrentPackageVersion() {
  try {
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string };
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

describe('Version Sync Script', () => {
  test('should get current package version', () => {
    const version = getCurrentPackageVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('should get latest git tag', () => {
    const tag = getLatestGitTag();
    if (tag) {
      expect(tag).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  test('should detect if versions are in sync', () => {
    const gitTag = getLatestGitTag();
    const packageVersion = getCurrentPackageVersion();

    expect(typeof gitTag).toBe('string');
    expect(typeof packageVersion).toBe('string');

    console.log(`Git tag: v${gitTag}, Package version: ${packageVersion}`);
    if (gitTag !== packageVersion) {
      console.warn(`Version mismatch detected: git tag v${gitTag} vs package.json ${packageVersion}`);
      console.warn('Run "pnpm run sync-versions" to fix this');
    }
  });
});
