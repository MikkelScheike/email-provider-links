/**
 * Provider Data Loader
 * 
 * Handles loading email provider data with performance optimizations.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  Provider,
  ProvidersData,
  decompressTxtPattern
} from './schema';
import { EmailProvider } from './index';

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
 * Convert compressed provider to EmailProvider format
 */
function convertProviderToEmailProvider(compressedProvider: Provider): EmailProvider {
  const provider: EmailProvider = {
    companyProvider: compressedProvider.name,
    loginUrl: compressedProvider.url,
    domains: compressedProvider.domains || []
  };

  // Convert DNS detection patterns
  if (compressedProvider.mx?.length || compressedProvider.txt?.length) {
    provider.customDomainDetection = {};
    
    if (compressedProvider.mx?.length) {
      provider.customDomainDetection.mxPatterns = compressedProvider.mx;
    }
    
    if (compressedProvider.txt?.length) {
      // Decompress TXT patterns
      provider.customDomainDetection.txtPatterns = compressedProvider.txt.map(decompressTxtPattern);
    }
  }

  return provider;
}

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
    
    const content = readFileSync(dataPath, 'utf8');
    const data: ProvidersData = JSON.parse(content);
    
    // Validate format
    if (!data.version || !data.providers || !Array.isArray(data.providers)) {
      throw new Error('Invalid provider data format');
    }
    
    const providers = data.providers.map(convertProviderToEmailProvider);
    const fileSize = content.length;

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

  const startTime = Date.now();
  const domainMap = new Map<string, EmailProvider>();
  
  for (const provider of providers) {
    for (const domain of provider.domains) {
      domainMap.set(domain.toLowerCase(), provider);
    }
  }
  
  cachedDomainMap = domainMap;
  
  if (loadingStats) {
    console.log(`🗺️  Domain map built in ${Date.now() - startTime}ms (${domainMap.size} entries)`);
  }
  
  return domainMap;
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
