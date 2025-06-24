#!/usr/bin/env tsx
/**
 * Hash Update Script for Semantic Release Integration
 * 
 * This script runs AFTER semantic-release has updated package.json with the new version.
 * It calculates fresh hashes for the critical files and updates the hash verifier.
 * 
 * This is called automatically by semantic-release as part of the prepare step.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

class HashUpdater {
    private projectRoot: string;

    constructor() {
        this.projectRoot = process.cwd();
    }

    /** Update security hashes after semantic-release version bump */
    async updateHashes(): Promise<void> {
        console.log("🔐 UPDATING SECURITY HASHES");
        console.log("=".repeat(50));
        
        // Calculate new hashes
        const hashes = this.calculateHashes();
        
        // Update the hash verifier
        await this.updateHashVerifier(hashes);
        
        console.log("✅ Security hashes updated successfully");
        console.log("📋 Updated files:");
        Object.entries(hashes).forEach(([file, hash]) => {
            console.log(`   ${file}: ${hash.substring(0, 16)}...`);
        });
    }

    private calculateHashes(): Record<string, string> {
        const files = [
            "providers/emailproviders.json",
            "package.json"
        ];
        
        const hashes: Record<string, string> = {};
        
        for (const file of files) {
            const fullPath = join(this.projectRoot, file);
            const content = readFileSync(fullPath);
            const hash = createHash("sha256").update(content).digest("hex");
            const fileName = file.split("/").pop() || file;
            hashes[fileName] = hash;
        }
        
        return hashes;
    }

    private async updateHashVerifier(hashes: Record<string, string>): Promise<void> {
        const verifierPath = join(this.projectRoot, "src/hash-verifier.ts");
        let content = readFileSync(verifierPath, "utf-8");
        
        // Update emailproviders.json hash
        content = content.replace(
            /'emailproviders\.json': '[a-f0-9]{64}'/,
            `'emailproviders.json': '${hashes["emailproviders.json"]}'`
        );
        
        // Update package.json hash
        content = content.replace(
            /'package\.json': '[a-f0-9]{64}'/,
            `'package.json': '${hashes["package.json"]}'`
        );
        
        writeFileSync(verifierPath, content);
    }
}

async function main() {
    try {
        const updater = new HashUpdater();
        await updater.updateHashes();
    } catch (error) {
        console.error("❌ Hash update failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { HashUpdater };
