import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(packageRoot, '..', 'email-provider-links', 'providers', 'emailproviders.json');
const destinationPath = join(packageRoot, 'src', 'data', 'providers-data.ts');
const raw = readFileSync(sourcePath, 'utf8');
const json = JSON.stringify(JSON.parse(raw));

mkdirSync(dirname(destinationPath), { recursive: true });
writeFileSync(
  destinationPath,
  `/* Generated from packages/email-provider-links/providers/emailproviders.json. Do not edit. */\nexport const providersData: unknown = ${json};\n`,
  'utf8'
);
