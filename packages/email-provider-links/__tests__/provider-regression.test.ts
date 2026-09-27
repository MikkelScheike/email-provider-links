import { getEmailProviderSync, getSupportedProviders, EmailProvider } from '../src/index';

/**
 * Provider regression test (dynamic)
 *
 * Dynamically verifies that every domain listed in providers/emailproviders.json
 * maps via the synchronous path (domain_match) to the expected provider and login URL.
 *
 * - No network/DNS required; stable and fast.
 * - Adapts automatically when providers/domains are added or removed.
 */

describe('Provider regression (domain -> provider mapping)', () => {
  const providers = getSupportedProviders();

  it('should have at least one provider configured', () => {
    expect(providers.length).toBeGreaterThan(0);
  });

  // Build a flat list of (provider, domain) pairs for testing
  const cases: Array<{ provider: EmailProvider; domain: string }> = [];
  for (const p of providers) {
    if (Array.isArray(p.domains) && p.domains.length > 0) {
      for (const d of p.domains) {
        cases.push({ provider: p, domain: d });
      }
    }
  }

  it(`should validate ${cases.length} domains map to expected providers`, () => {
    const failures: Array<{ domain: string; expected: string; actual?: string | null; loginUrlExpected?: string | null; loginUrlActual?: string | null; method?: string }>= [];

    for (const { provider, domain } of cases) {
      const result = getEmailProviderSync(`test@${domain}`);
      const actualName = result.provider?.companyProvider || null;
      const actualLogin = result.provider?.loginUrl ?? null;

      // Expected values
      const expectedName = provider.companyProvider;
      const expectedLogin = provider.loginUrl || null;

      // Checks
      const nameMatches = actualName === expectedName;
      const methodMatches = result.detectionMethod === 'domain_match';
      const loginMatches = expectedLogin ? actualLogin === expectedLogin : true;

      if (!(nameMatches && methodMatches && loginMatches)) {
        failures.push({
          domain,
          expected: expectedName,
          actual: actualName,
          loginUrlExpected: expectedLogin,
          loginUrlActual: actualLogin,
          method: result.detectionMethod
        });
      }
    }

    if (failures.length > 0) {
      // Helpful output for debugging mismatches
      // eslint-disable-next-line no-console
      console.error('Provider regression mismatches:', JSON.stringify(failures, null, 2));
    }

    expect(failures).toHaveLength(0);
  });
});
