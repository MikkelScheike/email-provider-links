import { testProviders } from '../__tests__/__fixtures__/test-providers';

export const loadProviders = jest.fn().mockImplementation(() => ({
  success: true,
  providers: testProviders,
  securityReport: {
    hashVerification: true,
    urlValidation: true,
    totalProviders: testProviders.length,
    validUrls: testProviders.length,
    invalidUrls: 0,
    securityLevel: 'SECURE' as const,
    issues: []
  }
}));

export const clearCache = jest.fn();

export default {
  loadProviders,
  clearCache
};
