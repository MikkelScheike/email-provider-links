import { providersData } from './data/providers-data';
import type { KnownProvider, ProviderType } from './types';

interface RawProvider {
  companyProvider?: unknown;
  loginUrl?: unknown;
  domains?: unknown;
  type?: unknown;
  alias?: unknown;
}

function isProviderType(value: unknown): value is ProviderType {
  return value === 'public_provider' || value === 'custom_provider' || value === 'proxy_service';
}

function readAliasRule(value: unknown): { ignore: boolean; strip: boolean } | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const rule = value as { ignore?: unknown; strip?: unknown };
  if (typeof rule.ignore !== 'boolean' || typeof rule.strip !== 'boolean') {
    return undefined;
  }
  return { ignore: rule.ignore, strip: rule.strip };
}

function readProvider(value: RawProvider): KnownProvider | null {
  if (typeof value.companyProvider !== 'string' || !isProviderType(value.type)) {
    return null;
  }

  const domains = Array.isArray(value.domains)
    ? value.domains.filter((domain): domain is string => typeof domain === 'string')
    : [];

  const provider: KnownProvider = {
    companyProvider: value.companyProvider,
    loginUrl: typeof value.loginUrl === 'string' ? value.loginUrl : null,
    domains,
    type: value.type
  };

  if (value.alias && typeof value.alias === 'object') {
    const alias = value.alias as { dots?: unknown; plus?: unknown; case?: unknown };
    const dots = readAliasRule(alias.dots);
    const plus = readAliasRule(alias.plus);
    const caseRule = readAliasRule(alias.case);
    if (dots || plus || caseRule) {
      provider.alias = {
        ...(dots ? { dots } : {}),
        ...(plus ? { plus } : {}),
        ...(caseRule ? { case: caseRule } : {})
      };
    }
  }

  return provider;
}

let domainMap: Map<string, KnownProvider> | null = null;

export function getDomainMap(): Map<string, KnownProvider> {
  if (domainMap) {
    return domainMap;
  }

  const data = providersData as { providers?: RawProvider[] };
  const map = new Map<string, KnownProvider>();
  for (const raw of data.providers ?? []) {
    const provider = readProvider(raw);
    if (!provider) {
      continue;
    }
    for (const domain of provider.domains) {
      map.set(domain.toLowerCase(), provider);
    }
  }

  domainMap = map;
  return map;
}
