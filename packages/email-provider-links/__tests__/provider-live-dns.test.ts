import { getEmailProvider } from '../src/index';
import { readFileSync } from 'fs';
import { resolveMx, resolveTxt } from 'dns';
import { promisify } from 'util';
import { decompressTxtPattern } from '../src/schema';

const resolveMxAsync = promisify(resolveMx);
const resolveTxtAsync = promisify(resolveTxt);

/**
 * Optional live test using the actual providers/emailproviders.json data.
 *
 * Behavior
 * - When RUN_LIVE_DNS=1, iterates all provider domains from the providers file
 *   and performs real DNS lookups (MX and TXT) for test@domain.
 * - Validates any declared MX/TXT patterns from providers/emailproviders.json against live DNS.
 * - Also calls getEmailProvider('test@domain') for completeness.
 * - Fully dynamic; adapts to additions/removals in the providers file.
 */

const runLive = process.env.RUN_LIVE_DNS === '1';

function loadRawProviders(): any[] {
  const raw = JSON.parse(readFileSync(require.resolve('../providers/emailproviders.json'), 'utf8'));
  return Array.isArray(raw.providers) ? raw.providers : [];
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
      // Avoid keeping the event loop alive
      // @ts-ignore Node timer has unref in Node.js environments
      if (typeof (timer as any).unref === 'function') {
        (timer as any).unref();
      }
    })
  ]);
}

async function checkDomain(domain: string, provider: any, timeout = 4000) {
  const mxPatterns: string[] = Array.isArray(provider.mx) ? provider.mx : [];
  const txtPatternsCompressed: string[] = Array.isArray(provider.txt) ? provider.txt : [];
  const txtPatterns = txtPatternsCompressed.map(decompressTxtPattern);

  const results: { mxPresent?: boolean; mxOk?: boolean; txtOk?: boolean; details?: any } = {};

  // MX lookup (always)
  try {
    const mx = await withTimeout(resolveMxAsync(domain), timeout);
    const exchanges = (mx || []).map(r => String(r.exchange || '').toLowerCase());
    results.mxPresent = exchanges.length > 0;
    if (mxPatterns.length > 0) {
      const mxOk = mxPatterns.some(p => exchanges.some(x => x.includes(p.toLowerCase())));
      results.mxOk = mxOk;
      if (!mxOk) {
        results.details = { ...(results.details || {}), mx: { exchanges, expected: mxPatterns } };
      }
    }
  } catch (e) {
    results.mxPresent = false;
    results.details = { ...(results.details || {}), mxError: String((e as Error).message || e) };
  }

  // TXT lookup if patterns exist
  if (txtPatterns.length > 0) {
    try {
      const txt = await withTimeout(resolveTxtAsync(domain), timeout);
      const flat = (txt || []).flat().map(x => String(x).toLowerCase());
      const txtOk = txtPatterns.some(p => flat.some(t => t.includes(p.toLowerCase())));
      results.txtOk = txtOk;
      if (!txtOk) {
        results.details = { ...(results.details || {}), txt: { records: flat, expected: txtPatterns } };
      }
    } catch (e) {
      results.txtOk = false;
      results.details = { ...(results.details || {}), txtError: String((e as Error).message || e) };
    }
  }

  // Also ensure our API still maps the domain to the provider
  try {
    const api = await withTimeout(getEmailProvider(`test@${domain}`, timeout), timeout);
    if (api.provider?.companyProvider !== provider.companyProvider) {
      results.details = { ...(results.details || {}), apiMismatch: { actual: api.provider?.companyProvider || null, expected: provider.companyProvider, method: api.detectionMethod, error: api.error } };
    }
  } catch (e) {
    results.details = { ...(results.details || {}), apiError: String((e as Error).message || e) };
  }

  return results;
}

// Simple concurrency limiter
async function runPool<T>(items: T[], worker: (item: T) => Promise<void>, concurrency = 10) {
  const q = items.slice();
  const runners: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    runners.push((async function loop() {
      while (q.length) {
        const item = q.shift()!;
        await worker(item);
      }
    })());
  }
  await Promise.all(runners);
}

(runLive ? describe : describe.skip)('Live DNS verification (dynamic from providers file)', () => {
  const providers = loadRawProviders();
  const domains: Array<{ domain: string; provider: any }> = [];

  for (const p of providers) {
    if (Array.isArray(p.domains)) {
      for (const d of p.domains) {
        domains.push({ domain: d, provider: p });
      }
    }
  }

  const strict = process.env.RUN_LIVE_DNS_STRICT === '1';

  it(`performs MX/TXT lookups for ${domains.length} domains`, async () => {
    const failures: Array<{ domain: string; provider: string; details: any }> = [];

    await runPool(domains, async ({ domain, provider }) => {
      const res = await checkDomain(domain, provider, 5000);
      const mxNeeded = Array.isArray(provider.mx) && provider.mx.length > 0;
      const txtNeeded = Array.isArray(provider.txt) && provider.txt.length > 0;

      const apiOk = !(res.details && res.details.apiMismatch);
      const mxPresentOk = res.mxPresent === true;
      const patternsOk = (!strict)
        ? true
        : (mxNeeded ? res.mxOk === true : true) && (txtNeeded ? res.txtOk === true : true);

      const ok = apiOk && mxPresentOk && patternsOk;
      if (!ok) {
        failures.push({ domain, provider: provider.companyProvider, details: res.details || {} });
      }
    }, 8); // modest concurrency

    if (failures.length > 0) {
      // eslint-disable-next-line no-console
      console.error('Live DNS mismatches:', JSON.stringify(failures, null, 2));
    }

    expect(failures).toHaveLength(0);
  }, 300000); // allow up to 5 minutes
});
