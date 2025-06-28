import { getEmailProvider, getEmailProviderSync } from '../src/index';

// Helper to get memory usage in MB
function getMemoryUsage() {
    if (global.gc) {
        global.gc();
    }
    const usage = process.memoryUsage();
    return {
        heapUsed: Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100,
        rss: Math.round((usage.rss / 1024 / 1024) * 100) / 100
    };
}

async function runMemoryBenchmark() {
    console.log('Starting memory benchmark...');
    
    // Measure initial memory
    const initialMemory = getMemoryUsage();
    console.log('Initial memory:', initialMemory);

    // Load the library
    const beforeLoad = getMemoryUsage();
    const result = await getEmailProvider('test@gmail.com');
    const afterLoad = getMemoryUsage();
    
    console.log('Memory after first load:', afterLoad);
    console.log('Initial load cost:', {
        heap: (afterLoad.heapUsed - beforeLoad.heapUsed).toFixed(2) + 'MB',
        total: (afterLoad.heapTotal - beforeLoad.heapTotal).toFixed(2) + 'MB'
    });

    // Measure batch operations
    const batchSize = 1000;
    const beforeBatch = getMemoryUsage();
    
    for (let i = 0; i < batchSize; i++) {
        getEmailProviderSync('test' + i + '@gmail.com');
    }
    
    const afterBatch = getMemoryUsage();
    
    console.log(`Memory after ${batchSize} operations:`, afterBatch);
    console.log(`Memory cost per ${batchSize} ops:`, {
        heap: ((afterBatch.heapUsed - beforeBatch.heapUsed) / batchSize).toFixed(5) + 'MB',
        total: ((afterBatch.heapTotal - beforeBatch.heapTotal) / batchSize).toFixed(5) + 'MB'
    });
}

runMemoryBenchmark().catch(console.error);
