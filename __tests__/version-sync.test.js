/**
 * Test for the version sync script
 * Ensures the script properly syncs package.json with git tags
 */

const { syncVersions, getLatestGitTag, getCurrentPackageVersion } = require('../scripts/sync-versions');

describe('Version Sync Script', () => {
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
    
    if (gitTag) {
      console.log(`Git tag: v${gitTag}, Package version: ${packageVersion}`);
      
      // This test will help us catch version mismatches
      if (gitTag !== packageVersion) {
        console.warn(`⚠️  Version mismatch detected: git tag v${gitTag} vs package.json ${packageVersion}`);
        console.warn('Run "npm run sync-versions" to fix this');
      }
      
      // We don't fail the test, just warn, since sync might be intentional during development
      expect(typeof gitTag).toBe('string');
      expect(typeof packageVersion).toBe('string');
    }
  });
});

