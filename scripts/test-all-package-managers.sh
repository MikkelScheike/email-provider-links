#!/bin/bash

set -e # Exit on error

echo "🚀 Testing all package managers locally..."

# Function to run tests for a specific package manager
test_with_package_manager() {
    local pm=$1
    local install_cmd=$2
    local test_cmd=$3
    local build_cmd=$4

    echo "📦 Testing with $pm..."

    # Clean node_modules
    rm -rf node_modules

    # Save Yarn configuration if not using Yarn

    # Handle lockfiles based on package manager
    case "$pm" in
        "pnpm")
            rm -f package-lock.json bun.lock
            rm -rf .pnp.cjs .pnp.loader.mjs
            rm -rf .pnpm-store
            ;;
        "npm")
            rm -f pnpm-lock.yaml bun.lock
            rm -rf .pnp.cjs .pnp.loader.mjs
            rm -rf .npm
            ;;
        "bun")
            rm -f package-lock.json pnpm-lock.yaml
            rm -rf .pnp.cjs .pnp.loader.mjs
            rm -rf .bun
            ;;
    esac

    # Install dependencies
    echo "📥 Installing dependencies with $pm..."
    eval "$install_cmd"

    # Run security audit if supported
    echo "🔒 Running security audit..."
    case "$pm" in
        "npm")
            npm audit --audit-level=moderate || true
            ;;
        "pnpm")
            pnpm audit || true
            ;;
        "bun")
            echo "Skipping audit for bun as it does not support audit command yet"
            ;;
    esac

    # Run tests
    echo "🧪 Running tests..."
    eval "$test_cmd"

    # Run build
    echo "🏗️  Building..."
    eval "$build_cmd"

    # Restore Yarn configuration if not using Yarn

    echo "✅ Tests with $pm completed successfully"
    echo "-------------------------------------------"
}

# Test with each package manager
echo "🧪 Testing with npm..."
test_with_package_manager "npm" "npm ci" "npm test" "npm run build"

echo "🧪 Testing with pnpm..."
test_with_package_manager "pnpm" "pnpm install --frozen-lockfile" "pnpm test" "pnpm run build"

echo "🧪 Testing with bun..."
test_with_package_manager "bun" "bun install --frozen-lockfile" "bun test" "bun run build"

echo "🎉 All package manager tests completed!"
