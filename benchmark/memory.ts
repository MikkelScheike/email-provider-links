import { getEmailProvider, getEmailProviderSync, loadProviders } from '../src/index';
import { detectProviderConcurrent } from '../src/concurrent-dns';
import { getSupportedProviders } from '../src/index';

interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

function getMemoryUsage(): MemorySnapshot {
  const { heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();
  return {
    heapUsed: Math.round(heapUsed / 1024 / 1024 * 100) / 100,    // MB
    heapTotal: Math.round(heapTotal / 1024 / 1024 * 100) / 100,  // MB
    external: Math.round(external / 1024 / 1024 * 100) / 100,     // MB
    arrayBuffers: Math.round(arrayBuffers / 1024 / 1024 * 100) / 100 // MB
  };
}

function formatMemoryDiff(before: MemorySnapshot, after: MemorySnapshot): string {
  const diff = {
    heapUsed: (after.heapUsed - before.heapUsed).toFixed(2),
    heapTotal: (after.heapTotal - before.heapTotal).toFixed(2),
    external: (after.external - before.external).toFixed(2),
    arrayBuffers: (after.arrayBuffers - before.arrayBuffers).toFixed(2)
  };

  return `
  Heap Used: ${diff.heapUsed} MB
  Heap Total: ${diff.heapTotal} MB
  External: ${diff.external} MB
  Array Buffers: ${diff.arrayBuffers} MB`;
}

async function runMemoryTest(name: string, fn: () => Promise<void> | void) {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const before = getMemoryUsage();
  console.log(`\n🔍 Running "${name}"...`);
  
  const start = process.hrtime.bigint();
  await Promise.resolve(fn());
  const end = process.hrtime.bigint();
  
  // Force garbage collection again
  if (global.gc) {
    global.gc();
  }

  const after = getMemoryUsage();
  const duration = Number(end - start) / 1_000_000; // Convert to milliseconds

  console.log(`
📊 Memory Impact:${formatMemoryDiff(before, after)}
⏱️  Duration: ${duration.toFixed(2)}ms
  `);
}

async function main() {
  if (!global.gc) {
    console.warn('⚠️  Running without --expose-gc. Memory measurements may be less accurate.');
  }

  console.log('🏃 Starting Memory Usage Benchmarks...\n');
  
  // Test 1: Initial providers load
  await runMemoryTest('Initial Provider Load', () => {
    loadProviders();
  });

  // Test 2: Repeated provider loads (testing caching)
  await runMemoryTest('10x Provider Load (Testing Cache)', () => {
    for (let i = 0; i < 10; i++) {
      loadProviders();
    }
  });

  // Test 3: Sync email lookups
  await runMemoryTest('100x Sync Email Lookups', () => {
    const emails = [
      'test@gmail.com',
      'user@outlook.com',
      'someone@yahoo.com',
      'person@unknown-domain.com'
    ];

    for (let i = 0; i < 25; i++) {
      emails.forEach(email => {
        getEmailProviderSync(email);
      });
    }
  });

  // Test 4: Async email lookups
  await runMemoryTest('100x Async Email Lookups', async () => {
    const emails = [
      'test@gmail.com',
      'user@outlook.com',
      'someone@yahoo.com',
      'person@unknown-domain.com'
    ];

    await Promise.all(
      Array.from({ length: 25 }, () =>
        Promise.all(emails.map(email => getEmailProvider(email)))
      )
    );
  });

  // Test 5: Concurrent DNS lookups
  await runMemoryTest('10x Concurrent DNS Lookups', async () => {
    const domains = [
      'gmail.com',
      'outlook.com',
      'yahoo.com',
      'fastmail.com',
      'protonmail.com'
    ];

    const providers = getSupportedProviders();
    await Promise.all(
      Array.from({ length: 2 }, () =>
        Promise.all(domains.map(domain => 
          detectProviderConcurrent(domain, providers, {
            timeout: 5000,
            enableParallel: true,
            collectDebugInfo: true
          })
        ))
      )
    );
  });

  // Test 6: Large scale test
  await runMemoryTest('Large Scale Test (1000 operations)', async () => {
    const emails = Array.from(
      { length: 1000 },
      (_, i) => `user${i}@${i % 2 === 0 ? 'gmail.com' : 'outlook.com'}`
    );

    await Promise.all([
      // Mix of sync and async operations
      ...emails.slice(0, 500).map(email => getEmailProviderSync(email)),
      ...emails.slice(500).map(email => getEmailProvider(email))
    ]);
  });

  console.log('\n✅ Memory Usage Benchmarks Complete!');
}

// Check if we're running with --expose-gc
const hasExposedGC = !!(global as any).gc;
if (!hasExposedGC) {
  console.warn('\n⚠️  For more accurate results, run with: node --expose-gc benchmark/memory.js\n');
}

main().catch(console.error);
