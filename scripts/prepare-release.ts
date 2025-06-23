#!/usr/bin/env tsx
/**
 * Simple Release Preparation Script
 * 
 * This script prepares code for semantic-release by:
 * 1. Running tests to ensure everything works
 * 2. Creating a semantic commit
 * 3. Letting semantic-release handle everything else
 * 
 * Usage:
 *   npx tsx scripts/prepare-release.ts --patch
 *   npx tsx scripts/prepare-release.ts --minor  
 *   npx tsx scripts/prepare-release.ts --major
 */

import { execSync } from "child_process";

interface ReleaseConfig {
    releaseType: "major" | "minor" | "patch";
}

class SimpleReleaseManager {
    
    async prepareRelease(config: ReleaseConfig): Promise<void> {
        console.log("🚀 SIMPLE SEMANTIC RELEASE PREPARATION");
        console.log("=".repeat(60));
        console.log(`🔄 Release Type: ${config.releaseType}`);
        console.log("🤖 Semantic-release will handle ALL version management\n");

        // Step 1: Validate prerequisites
        await this.validatePrerequisites();

        // Step 2: Run tests
        await this.runTests();

        // Step 3: Run build
        await this.runBuild();

        // Step 4: Show commit instructions
        this.showCommitInstructions(config);
    }

    private async validatePrerequisites(): Promise<void> {
        console.log("🔍 STEP 1: Validating Prerequisites");
        console.log("-".repeat(40));
        
        try {
            const branch = execSync("git branch --show-current", { encoding: "utf-8" }).trim();
            if (branch !== "main") {
                throw new Error(`Must be on main branch, currently on: ${branch}`);
            }
            console.log("✅ On main branch");
        } catch (e) {
            throw new Error(`Failed to check git branch: ${e}`);
        }
        
        try {
            const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
            if (status) {
                console.log("ℹ️  Working directory has changes - they will be committed");
            } else {
                console.log("✅ Working directory clean");
            }
        } catch (e) {
            throw new Error(`Failed to check git status: ${e}`);
        }
        
        console.log();
    }

    private async runTests(): Promise<void> {
        console.log("🧪 STEP 2: Running Tests");
        console.log("-".repeat(40));
        
        try {
            execSync("npm test", {
                encoding: "utf-8",
                stdio: "pipe",
                env: { ...process.env, SKIP_VERSION_SYNC: "1" }
            });
            console.log("✅ All tests passed\n");
        } catch (error) {
            throw new Error("Tests failed - please fix before release");
        }
    }

    private async runBuild(): Promise<void> {
        console.log("🔨 STEP 3: Verifying Build");
        console.log("-".repeat(40));
        
        try {
            execSync("npm run build", {
                encoding: "utf-8",
                stdio: "pipe",
                env: { ...process.env, SKIP_VERSION_SYNC: "1" }
            });
            console.log("✅ Build successful\n");
        } catch {
            throw new Error("Build failed - please fix before release");
        }
    }

    private showCommitInstructions(config: ReleaseConfig): void {
        console.log("📝 STEP 4: Commit Instructions");
        console.log("-".repeat(40));
        
        const commitType = this.getCommitType(config.releaseType);
        const exampleMessage = this.getExampleCommitMessage(config.releaseType);
        
        console.log("✅ Ready for release!");
        console.log(`📋 Create a ${config.releaseType} release by committing with:`);
        console.log(`   • Commit type: ${commitType}`);
        console.log(`   • Example: ${exampleMessage}`);
        console.log();
        console.log("🤖 SEMANTIC-RELEASE WILL AUTOMATICALLY:");
        console.log("   • Determine the new version number");
        console.log("   • Update package.json");
        console.log("   • Calculate and update security hashes");
        console.log("   • Build and test the package");
        console.log("   • Publish to NPM");
        console.log("   • Create GitHub release with notes");
        console.log();
        console.log("🎯 NEXT STEPS:");
        console.log("   1. Commit your changes with proper semantic prefix");
        console.log("   2. Push to GitHub");
        console.log("   3. Watch the automated release process");
        console.log();
    }

    private getCommitType(releaseType: string): string {
        switch (releaseType) {
            case "major": return "feat! (breaking change)";
            case "minor": return "feat (new feature)";
            case "patch": return "fix (bug fix)";
            default: return "fix";
        }
    }

    private getExampleCommitMessage(releaseType: string): string {
        switch (releaseType) {
            case "major": 
                return "feat!: major API changes\\n\\nBREAKING CHANGE: Updated API structure";
            case "minor": 
                return "feat: add new feature\\n\\nAdded new functionality for X";
            case "patch": 
                return "fix: resolve issue with Y\\n\\nFixed bug that caused Z";
            default: 
                return "fix: general improvements";
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes("--help")) {
        console.log(`
🚀 SIMPLE SEMANTIC RELEASE PREPARATION

Usage: npx tsx scripts/prepare-release.ts [--major|--minor|--patch]

Examples:
  npx tsx scripts/prepare-release.ts --patch
  npx tsx scripts/prepare-release.ts --minor
  npx tsx scripts/prepare-release.ts --major

This script prepares your code for semantic-release by:
• Running tests and build verification
• Providing commit message guidance
• Letting semantic-release handle ALL version management

NO MORE MANUAL VERSION BUMPS OR HASH CALCULATIONS!
        `);
        process.exit(0);
    }

    const releaseType = args.includes("--major")
        ? "major"
        : args.includes("--minor")
        ? "minor"
        : "patch";

    const config: ReleaseConfig = { releaseType };
    const manager = new SimpleReleaseManager();
    await manager.prepareRelease(config);
}

if (require.main === module) {
    main().catch((e) => {
        console.error("Release preparation failed:", e);
        process.exit(1);
    });
}

export { SimpleReleaseManager, ReleaseConfig };
