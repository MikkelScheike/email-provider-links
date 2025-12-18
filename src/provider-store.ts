import { readFileSync } from 'fs';
import type { EmailProvider } from './api';
import { Provider, ProvidersData, decompressTxtPattern } from './schema';

export function convertProviderToEmailProviderShared(compressedProvider: Provider): EmailProvider {
  if (!compressedProvider.type) {
    console.warn(`Missing type for provider ${compressedProvider.id}`);
  }
  const provider: EmailProvider = {
    companyProvider: compressedProvider.companyProvider,
    loginUrl: compressedProvider.loginUrl || null,
    domains: compressedProvider.domains || [],
    type: compressedProvider.type,
    alias: compressedProvider.alias
  };

  const needsCustomDomainDetection =
    compressedProvider.type === 'custom_provider' ||
    compressedProvider.type === 'proxy_service';

  if (needsCustomDomainDetection && (compressedProvider.mx?.length || compressedProvider.txt?.length)) {
    provider.customDomainDetection = {};

    if (compressedProvider.mx?.length) {
      provider.customDomainDetection.mxPatterns = compressedProvider.mx;
    }

    if (compressedProvider.txt?.length) {
      provider.customDomainDetection.txtPatterns = compressedProvider.txt.map(decompressTxtPattern);
    }
  }

  return provider;
}

export function readProvidersDataFile(filePath: string): { data: ProvidersData; fileSize: number } {
  const content = readFileSync(filePath, 'utf8');
  const data: ProvidersData = JSON.parse(content);

  if (!data.version || !data.providers || !Array.isArray(data.providers)) {
    throw new Error('Invalid provider data format');
  }

  return { data, fileSize: content.length };
}

export function buildDomainMapShared(providers: EmailProvider[]): Map<string, EmailProvider> {
  const domainMap = new Map<string, EmailProvider>();

  for (const provider of providers) {
    for (const domain of provider.domains) {
      domainMap.set(domain.toLowerCase(), provider);
    }
  }

  return domainMap;
}
