export const testProviders = [
  {
    companyProvider: 'Test No Case',
    domains: ['test-no-case.com'],
    loginUrl: 'https://test-no-case.com/login',
    type: 'public_provider',
    alias: {
      case: { ignore: true, strip: true },
      dots: { ignore: false, strip: false },
      plus: { ignore: true, strip: true }
    }
  },
  {
    companyProvider: 'Test No Dots',
    domains: ['test-no-dots.com'],
    loginUrl: 'https://test-no-dots.com/login',
    type: 'public_provider',
    alias: {
      case: { ignore: true, strip: true },
      dots: { ignore: true, strip: false },
      plus: { ignore: true, strip: true }
    }
  }
];
