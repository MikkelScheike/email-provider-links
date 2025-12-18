/**
 * Provider Data Loader
 * 
 * Handles loading email provider data with performance optimizations.
 */

import { join } from 'path';
import { EmailProvider } from './api';
import { convertProviderToEmailProviderShared, readProvidersDataFile, buildDomainMapShared } from './provider-store';

/**
 * Provider loader configuration
 */
interface LoaderConfig {
  /** Enable debug logging */
  debug: boolean;
  /** Custom provider file path */
  path?: string;
}

/**
 * Loading statistics for performance monitoring
 */
interface LoadingStats {
  fileSize: number;
  loadTime: number;
  providerCount: number;
  domainCount: number;
}

/**
 * Internal cached data
 */
let cachedProviders: EmailProvider[] | null = null;
let cachedDomainMap: Map<string, EmailProvider> | null = null;
let loadingStats: LoadingStats | null = null;

/**
 * Default loader configuration
 */
const DEFAULT_CONFIG: LoaderConfig = {
  debug: false
};

/**
 * Internal provider data loader with configuration
 */
function loadProvidersInternal(config: Partial<LoaderConfig> = {}): {
  providers: EmailProvider[];
  stats: LoadingStats;
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  // Return cached data if available
  if (cachedProviders && !mergedConfig.debug) {
    return {
      providers: cachedProviders,
      stats: loadingStats!
    };
  }

  try {
    // Determine file path
    const basePath = join(__dirname, '..', 'providers');
    const dataPath = mergedConfig.path || join(basePath, 'emailproviders.json');

    if (mergedConfig.debug) console.log('🔄 Loading provider data...');
    
    const { data, fileSize } = readProvidersDataFile(dataPath);
    const providers = data.providers.map(convertProviderToEmailProviderShared);

    if (mergedConfig.debug) {
      console.log(`✅ Loaded ${providers.length} providers`);
      console.log(`📊 File size: ${(fileSize / 1024).toFixed(1)} KB`);
    }

    const loadTime = Date.now() - startTime;
    const domainCount = providers.reduce((sum, p) => sum + p.domains.length, 0);

    // Cache the results
    cachedProviders = providers;
    loadingStats = {
      fileSize,
      loadTime,
      providerCount: providers.length,
      domainCount
    };

    if (mergedConfig.debug) {
      console.log(`⚡ Loading completed in ${loadTime}ms`);
      console.log(`📊 Stats: ${providers.length} providers, ${domainCount} domains`);
    }
    
    if (process.env.NODE_ENV === 'development') {
      const memoryUsageInMB = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`🚀 Current memory usage: ${memoryUsageInMB.toFixed(2)} MB`);
    }

    return {
      providers,
      stats: loadingStats
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load provider data: ${errorMessage}`);
  }
}

/**
 * Build optimized domain-to-provider lookup map
 */
export function buildDomainMap(providers: EmailProvider[]): Map<string, EmailProvider> {
  if (cachedDomainMap) {
    return cachedDomainMap;
  }

  cachedDomainMap = buildDomainMapShared(providers);
  return cachedDomainMap;
}

/**
 * Clear all caches (useful for testing or hot reloading)
 */
export function clearCache(): void {
  cachedProviders = null;
  cachedDomainMap = null;
  loadingStats = null;
}

/**
 * Get loading statistics from the last load operation
 */
export function getLoadingStats(): LoadingStats | null {
  return loadingStats;
}

/**
 * Load all providers with optimized domain map for production
 */
export function loadProviders(): {
  providers: EmailProvider[];
  domainMap: Map<string, EmailProvider>;
  stats: LoadingStats;
} {
  const { providers, stats } = loadProvidersInternal({ debug: false });
  const domainMap = buildDomainMap(providers);
  
  return { providers, domainMap, stats };
}

/**
 * Load providers with debug information
 */
export function loadProvidersDebug(): {
  providers: EmailProvider[];
  domainMap: Map<string, EmailProvider>;
  stats: LoadingStats;
} {
  clearCache(); // Always reload in debug mode
  const { providers, stats } = loadProvidersInternal({ debug: true });
  const domainMap = buildDomainMap(providers);
  
  return { providers, domainMap, stats };
}
