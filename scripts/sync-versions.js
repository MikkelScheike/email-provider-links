#!/usr/bin/env node

/**
 * Version Sync Script
 * 
 * Automatically syncs package.json version with the latest git tag
 * to prevent version mismatches between git tags and package.json
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function getLatestGitTag() {
  try {
    const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    return tag.replace(/^v/, ''); // Remove 'v' prefix
  } catch (error) {
    console.log('No git tags found, keeping current version');
    return null;
  }
}

function getCurrentPackageVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function updatePackageVersion(newVersion) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.version !== newVersion) {
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated package.json version: ${packageJson.version} → ${newVersion}`);
    return true;
  }
  
  console.log(`✅ Package.json version already synced: ${newVersion}`);
  return false;
}

function syncVersions() {
  console.log('🔄 Checking version sync between git tags and package.json...');
  
  const latestTag = getLatestGitTag();
  const currentVersion = getCurrentPackageVersion();
  
  if (!latestTag) {
    console.log(`📦 Current package version: ${currentVersion} (no git tags)`);
    return;
  }
  
  console.log(`🏷️  Latest git tag: v${latestTag}`);
  console.log(`📦 Package.json version: ${currentVersion}`);
  
  if (latestTag !== currentVersion) {
    console.log(`⚠️  Version mismatch detected!`);
    const updated = updatePackageVersion(latestTag);
    
    if (updated) {
      // Auto-commit the version sync
      try {
        execSync('git add package.json', { stdio: 'pipe' });
        execSync(`git commit -m "chore: sync package.json version to ${latestTag} (auto-sync)"`, { stdio: 'pipe' });
        console.log(`🚀 Auto-committed version sync to ${latestTag}`);
      } catch (error) {
        console.log(`ℹ️  Version updated but not committed (this is normal in CI)`);
      }
    }
  } else {
    console.log('✅ Versions are in sync!');
  }
}

// Run if called directly
if (require.main === module) {
  syncVersions();
}

module.exports = { syncVersions, getLatestGitTag, getCurrentPackageVersion, updatePackageVersion };

