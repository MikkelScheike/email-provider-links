import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getEmailProviderSync } from '../../email-provider-links/dist/index.js';
import { lookupEmailProvider } from '../src/lookup';

interface ProviderFixture {
  domains?: string[];
}

const providersPath = join(
  __dirname,
  '..',
  '..',
  'email-provider-links',
  'providers',
  'emailproviders.json'
);
const providers = JSON.parse(readFileSync(providersPath, 'utf8')) as {
  providers: ProviderFixture[];
};

describe('lookupEmailProvider', () => {
  test('matches getEmailProviderSync for every known domain', () => {
    for (const provider of providers.providers) {
      for (const domain of provider.domains ?? []) {
        const email = `User.Name+tag@${domain}`;
        expect(lookupEmailProvider(email)).toEqual(getEmailProviderSync(email));
      }
    }
  });

  test('matches getEmailProviderSync for IDN and invalid addresses', () => {
    const samples = [
      'user@müller.de',
      'user@例子.com',
      'user@テスト.jp',
      'user@example.com',
      'not-an-email',
      '',
      'user@gmail.com'
    ];

    for (const email of samples) {
      expect(lookupEmailProvider(email)).toEqual(getEmailProviderSync(email));
    }
  });
});
