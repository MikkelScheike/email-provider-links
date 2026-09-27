import { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import { lookupEmailProvider } from './lookup';
import type { LookupResult } from './types';

export interface UseEmailProviderResult extends LookupResult {
  /** Opens the provider login URL. Returns false when no login URL is known. */
  openLogin: () => Promise<boolean>;
}

export function useEmailProvider(email: string): UseEmailProviderResult {
  const result = useMemo(() => lookupEmailProvider(email), [email]);
  const loginUrl = result.provider?.loginUrl ?? null;

  const openLogin = useCallback(async () => {
    if (!loginUrl) {
      return false;
    }
    await Linking.openURL(loginUrl);
    return true;
  }, [loginUrl]);

  return { ...result, openLogin };
}
