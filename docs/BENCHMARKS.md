# Performance Benchmarks

This document describes the benchmarking system and performance thresholds for the email-provider-links package.

## Overview

The package includes automated performance benchmarks that run:
- On every pull request
- On every push to main
- On every release
- Can be run locally with `npm run benchmark`

## Benchmark Categories

### 1. Initial Load
Tests the initial loading of provider data.
- **Threshold**: < 0.5MB heap usage, < 5ms duration
- **Current**: ~0.08MB heap usage, ~0.52ms duration

### 2. Cached Provider Loads
Tests the caching mechanism with repeated loads.
- **Threshold**: < 0.5MB additional heap, < 1ms per operation
- **Current**: ~0.01MB heap usage, ~0.05ms per operation

### 3. Sync Email Lookups
Tests performance of synchronous email provider lookups.
- **Threshold**: < 0.1MB heap per 100 operations
- **Current**: ~0.03MB heap per 100 operations, ~0.25ms duration

### 4. Async Email Lookups
Tests performance of asynchronous email provider lookups.
- **Threshold**: < 0.5MB heap per 100 operations
- **Current**: ~0.15MB heap per 100 operations, ~238ms duration

### 5. Concurrent DNS
Tests DNS resolution performance.
- **Threshold**: < 0.5MB heap per 10 lookups
- **Current**: ~0.03MB heap per 10 lookups, ~27ms duration

### 6. Large Scale Operations
Tests performance at scale (1000 operations).
- **Threshold**: < 20MB heap usage
- **Current**: ~0.03MB heap usage, ~1.11ms duration

## Regression Detection

The CI pipeline automatically detects performance regressions:

```yaml
# Regression thresholds
heap_usage_threshold: 5MB      # Max heap usage per operation
duration_threshold: 1000ms     # Max duration per operation
```

If any benchmark exceeds these thresholds:
1. The CI build fails
2. A warning is posted on the PR
3. Results are saved as artifacts for analysis

## Running Locally

```bash
# Basic benchmark
npm run benchmark

# With garbage collection for more accurate results
node --expose-gc $(npm bin)/tsx benchmark/memory.ts
```

## Historical Results

Benchmark results are stored as artifacts in GitHub Actions and can be used to track performance over time.
