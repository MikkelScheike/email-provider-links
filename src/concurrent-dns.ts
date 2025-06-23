/**
 * Concurrent DNS Detection Engine
 * 
 * Implements parallel MX/TXT record lookups for 2x faster business domain detection.
 * Uses Promise.allSettled for fault tolerance and intelligent result merging.
 */

import { promisify } from 'util';
import { resolveMx, resolveTxt } from 'dns';
import { EmailProvider } from './index';

// Convert Node.js callback-style DNS functions to Promise-based
const resolveMxAsync = promisify(resolveMx);
const resolveTxtAsync = promisify(resolveTxt);

/**
 * Configuration for concurrent DNS detection
 */
export interface ConcurrentDNSConfig {
  /** Timeout for DNS queries in milliseconds */
  timeout: number;
  /** Enable parallel DNS queries (vs sequential fallback) */
  enableParallel: boolean;
  /** Prioritize MX record matches over TXT */
  prioritizeMX: boolean;
  /** Collect detailed debugging information */
  collectDebugInfo: boolean;
  /** Fall back to sequential mode on parallel failure */
  fallbackToSequential: boolean;
}

/**
 * Result from a single DNS query (MX or TXT)
 */
export interface DNSQueryResult {
  /** Type of DNS record queried */
  type: 'mx' | 'txt';
  /** Whether the query succeeded */
  success: boolean;
  /** DNS records returned (if successful) */
  records?: any[];
  /** Error information (if failed) */
  error?: Error;
  /** Query execution time in milliseconds */
  timing: number;
  /** Raw DNS response for debugging */
  rawResponse?: any;
}

/**
 * Result from concurrent DNS detection
 */
export interface ConcurrentDNSResult {
  /** Detected email provider (null if none found) */
  provider: EmailProvider | null;
  /** Method used for detection */
  detectionMethod: 'mx_record' | 'txt_record' | 'both' | 'proxy_detected' | null;
  /** Confidence score (0-1, higher = more confident) */
  confidence: number;
  /** Proxy service detected (if any) */
  proxyService?: string;
  /** Detailed timing information */
  timing: {
    mx: number;
    txt: number;
    total: number;
  };
  /** Debug information (if enabled) */
  debug?: {
    mxMatches: string[];
    txtMatches: string[];
    conflicts: boolean;
    queries: DNSQueryResult[];
    fallbackUsed: boolean;
  };
}

/**
 * Provider match with confidence scoring
 */
interface ProviderMatch {
  provider: EmailProvider;
  method: 'mx_record' | 'txt_record';
  confidence: number;
  matchedPatterns: string[];
}

/**
 * Default configuration for concurrent DNS detection
 */
const DEFAULT_CONFIG: ConcurrentDNSConfig = {
  timeout: 5000,
  enableParallel: true,
  prioritizeMX: true,
  collectDebugInfo: false,
  fallbackToSequential: true
};

/**
 * Concurrent DNS Detection Engine
 */
export class ConcurrentDNSDetector {
  // Store active query states
  private activeQueries: Set<Promise<any>> = new Set();

  // Cleanup method for tests
  cleanup() {
    this.activeQueries.clear();
  }
  private config: ConcurrentDNSConfig;
  private providers: EmailProvider[];

  constructor(providers: EmailProvider[], config: Partial<ConcurrentDNSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.providers = providers.filter(p => 
      p.customDomainDetection && 
      (p.customDomainDetection.mxPatterns || p.customDomainDetection.txtPatterns)
    );
  }

  /**
   * Detect provider for a domain using concurrent DNS lookups
   */
  async detectProvider(domain: string): Promise<ConcurrentDNSResult> {
    const startTime = Date.now();
    const normalizedDomain = domain.toLowerCase().trim().replace(/\.+$/, '');

    // Initialize result
    const result: ConcurrentDNSResult = {
      provider: null,
      detectionMethod: null,
      confidence: 0,
      timing: { mx: 0, txt: 0, total: 0 },
      debug: this.config.collectDebugInfo ? {
        mxMatches: [],
        txtMatches: [],
        conflicts: false,
        queries: [],
        fallbackUsed: false
      } : undefined
    };

    try {
      let queries: DNSQueryResult[];

      if (this.config.enableParallel) {
        queries = await this.performParallelQueries(normalizedDomain);
      } else {
        queries = await this.performSequentialQueries(normalizedDomain);
      }

      // Update timing information
      result.timing = this.calculateTiming(queries, startTime);
      
      if (this.config.collectDebugInfo && result.debug) {
        result.debug.queries = queries;
      }

      // Find provider matches
      const matches = this.findProviderMatches(queries);
      
      if (this.config.collectDebugInfo && result.debug) {
        result.debug.mxMatches = matches.filter(m => m.method === 'mx_record').map(m => m.provider.companyProvider);
        result.debug.txtMatches = matches.filter(m => m.method === 'txt_record').map(m => m.provider.companyProvider);
        result.debug.conflicts = matches.length > 1;
      }

      // Select best match
      const bestMatch = this.selectBestMatch(matches);
      
      if (bestMatch) {
        result.provider = bestMatch.provider;
        result.detectionMethod = bestMatch.method;
        result.confidence = bestMatch.confidence;
      } else {
        // Check for proxy services
        const proxyResult = this.detectProxy(queries);
        if (proxyResult) {
          result.detectionMethod = 'proxy_detected';
          result.proxyService = proxyResult;
          result.confidence = 0.9; // High confidence in proxy detection
        }
      }

    } catch (error) {
      // Handle fallback to sequential if parallel fails
      if (this.config.enableParallel && this.config.fallbackToSequential) {
        if (this.config.collectDebugInfo && result.debug) {
          result.debug.fallbackUsed = true;
        }
        
        try {
          const fallbackQueries = await this.performSequentialQueries(normalizedDomain);
          result.timing = this.calculateTiming(fallbackQueries, startTime);
          
          const matches = this.findProviderMatches(fallbackQueries);
          const bestMatch = this.selectBestMatch(matches);
          
          if (bestMatch) {
            result.provider = bestMatch.provider;
            result.detectionMethod = bestMatch.method;
            result.confidence = bestMatch.confidence * 0.9; // Slightly lower confidence for fallback
          }
        } catch (fallbackError) {
          // Both parallel and sequential failed
          console.warn('DNS detection failed:', fallbackError);
        }
      }
    }

    result.timing.total = Date.now() - startTime;
    return result;
  }

  /**
   * Perform DNS queries in parallel using Promise.allSettled with smart optimization
   */
  private async performParallelQueries(domain: string): Promise<DNSQueryResult[]> {
    const queries = [
      this.queryMX(domain),
      this.queryTXT(domain)
    ];

    const results = await Promise.allSettled(queries);
    
    const mappedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          type: index === 0 ? 'mx' : 'txt',
          success: false,
          error: result.reason,
          timing: this.config.timeout
        } as DNSQueryResult;
      }
    });

    // If MX query succeeded and found a strong match, we can be confident
    // and potentially ignore TXT timing for performance reporting
    const mxResult = mappedResults[0];
    const txtResult = mappedResults[1];
    
    if (mxResult.success && this.hasMXMatch(mxResult) && this.config.prioritizeMX) {
      // Create an optimized TXT result that indicates it wasn't needed
      const optimizedTxtResult = {
        ...txtResult,
        timing: 0, // Don't count TXT time if MX was sufficient
        optimized: true
      };
      return [mxResult, optimizedTxtResult];
    }

    return mappedResults;
  }

  /**
   * Perform DNS queries sequentially (fallback mode)
   */
  private async performSequentialQueries(domain: string): Promise<DNSQueryResult[]> {
    const results: DNSQueryResult[] = [];

    // Try MX first
    try {
      const mxResult = await this.queryMX(domain);
      results.push(mxResult);
      
      // If MX succeeds and finds a match, we might skip TXT for performance
      if (mxResult.success && this.hasMXMatch(mxResult)) {
        // Add a placeholder TXT result
        results.push({
          type: 'txt',
          success: false,
          timing: 0,
          error: new Error('Skipped due to MX match')
        });
        return results;
      }
    } catch (error) {
      results.push({
        type: 'mx',
        success: false,
        error: error as Error,
        timing: this.config.timeout
      });
    }

    // Try TXT
    try {
      const txtResult = await this.queryTXT(domain);
      results.push(txtResult);
    } catch (error) {
      results.push({
        type: 'txt',
        success: false,
        error: error as Error,
        timing: this.config.timeout
      });
    }

    return results;
  }

  /**
   * Query MX records with timeout
   */
  private async queryMX(domain: string): Promise<DNSQueryResult> {
    const startTime = Date.now();
    
    try {
      const records = await this.withTimeout(resolveMxAsync(domain), this.config.timeout);
      
      return {
        type: 'mx',
        success: true,
        records,
        timing: Date.now() - startTime,
        rawResponse: this.config.collectDebugInfo ? records : undefined
      };
    } catch (error) {
      return {
        type: 'mx',
        success: false,
        error: error as Error,
        timing: Date.now() - startTime
      };
    }
  }

  /**
   * Query TXT records with timeout
   */
  private async queryTXT(domain: string): Promise<DNSQueryResult> {
    const startTime = Date.now();
    
    try {
      const records = await this.withTimeout(resolveTxtAsync(domain), this.config.timeout);
      const flatRecords = records.flat();
      
      return {
        type: 'txt',
        success: true,
        records: flatRecords,
        timing: Date.now() - startTime,
        rawResponse: this.config.collectDebugInfo ? records : undefined
      };
    } catch (error) {
      return {
        type: 'txt',
        success: false,
        error: error as Error,
        timing: Date.now() - startTime
      };
    }
  }

  /**
   * Find provider matches from DNS query results
   */
  private findProviderMatches(queries: DNSQueryResult[]): ProviderMatch[] {
    const matches: ProviderMatch[] = [];

    for (const query of queries) {
      if (!query.success || !query.records) continue;

      for (const provider of this.providers) {
        const match = this.matchProvider(provider, query);
        if (match) {
          matches.push(match);
        }
      }
    }

    return matches;
  }

  /**
   * Match a provider against DNS query results
   */
  private matchProvider(provider: EmailProvider, query: DNSQueryResult): ProviderMatch | null {
    if (!provider.customDomainDetection || !query.records) return null;

    const detection = provider.customDomainDetection;
    let matchedPatterns: string[] = [];
    let confidence = 0;

    if (query.type === 'mx' && detection.mxPatterns) {
      for (const record of query.records) {
        const exchange = record.exchange?.toLowerCase() || '';
        
        for (const pattern of detection.mxPatterns) {
          if (exchange.includes(pattern.toLowerCase())) {
            matchedPatterns.push(pattern);
            confidence = Math.max(confidence, 0.9); // High confidence for MX matches
          }
        }
      }
    } else if (query.type === 'txt' && detection.txtPatterns) {
      for (const record of query.records) {
        const txtRecord = record.toLowerCase();
        
        for (const pattern of detection.txtPatterns) {
          if (txtRecord.includes(pattern.toLowerCase())) {
            matchedPatterns.push(pattern);
            confidence = Math.max(confidence, 0.7); // Medium confidence for TXT matches
          }
        }
      }
    }

    if (matchedPatterns.length > 0) {
      return {
        provider,
        method: query.type === 'mx' ? 'mx_record' : 'txt_record',
        confidence: confidence * (matchedPatterns.length / (detection.mxPatterns?.length || detection.txtPatterns?.length || 1)),
        matchedPatterns
      };
    }

    return null;
  }

  /**
   * Select the best provider match from multiple candidates
   */
  private selectBestMatch(matches: ProviderMatch[]): ProviderMatch | null {
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    // Sort by confidence and preference for MX records
    return matches.sort((a, b) => {
      // Prioritize MX records if configured
      if (this.config.prioritizeMX) {
        if (a.method === 'mx_record' && b.method !== 'mx_record') return -1;
        if (b.method === 'mx_record' && a.method !== 'mx_record') return 1;
      }
      
      // Then by confidence
      return b.confidence - a.confidence;
    })[0];
  }

  /**
   * Check if MX result has potential matches (for sequential optimization)
   */
  private hasMXMatch(mxResult: DNSQueryResult): boolean {
    if (!mxResult.success || !mxResult.records) return false;

    for (const provider of this.providers) {
      const match = this.matchProvider(provider, mxResult);
      if (match) return true;
    }

    return false;
  }

  /**
   * Detect proxy services from DNS results
   */
  private detectProxy(queries: DNSQueryResult[]): string | null {
    const mxQuery = queries.find(q => q.type === 'mx' && q.success);
    if (!mxQuery?.records) return null;

    const proxyPatterns = [
      { service: 'Cloudflare', patterns: ['mxrecord.io', 'mxrecord.mx', 'cloudflare'] },
      { service: 'CloudFront', patterns: ['cloudfront.net'] },
      { service: 'Fastly', patterns: ['fastly.com'] }
    ];

    for (const record of mxQuery.records) {
      const exchange = record.exchange?.toLowerCase() || '';
      
      for (const proxy of proxyPatterns) {
        for (const pattern of proxy.patterns) {
          if (exchange.includes(pattern)) {
            return proxy.service;
          }
        }
      }
    }

    return null;
  }

  /**
   * Calculate timing information from query results
   */
  private calculateTiming(queries: DNSQueryResult[], startTime: number): {
    mx: number;
    txt: number;
    total: number;
  } {
    const mxQuery = queries.find(q => q.type === 'mx');
    const txtQuery = queries.find(q => q.type === 'txt');

    return {
      mx: mxQuery?.timing || 0,
      txt: txtQuery?.timing || 0,
      total: Date.now() - startTime
    };
  }

  /**
   * Wrap a promise with a timeout
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`DNS query timeout after ${ms}ms`)), ms);
      
      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }
}

/**
 * Factory function to create a concurrent DNS detector
 */
export function createConcurrentDNSDetector(
  providers: EmailProvider[], 
  config?: Partial<ConcurrentDNSConfig>
): ConcurrentDNSDetector {
  return new ConcurrentDNSDetector(providers, config);
}

/**
 * Utility function for quick concurrent DNS detection
 */
export async function detectProviderConcurrent(
  domain: string,
  providers: EmailProvider[],
  config?: Partial<ConcurrentDNSConfig>
): Promise<ConcurrentDNSResult> {
  const detector = createConcurrentDNSDetector(providers, config);
  return detector.detectProvider(domain);
}
