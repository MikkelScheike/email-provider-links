#!/usr/bin/env tsx
/**
 * Copy a minified providers JSON into dist/ for the published package.
 * Source file stays pretty-printed for humans; hash verification runs on the source.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const root = join(__dirname, '..');
const sourcePath = join(root, 'providers', 'emailproviders.json');
const destPath = join(root, 'dist', 'providers', 'emailproviders.json');

const raw = readFileSync(sourcePath, 'utf8');
const minified = JSON.stringify(JSON.parse(raw));

mkdirSync(dirname(destPath), { recursive: true });
writeFileSync(destPath, minified, 'utf8');

console.log(
  `Prepared minified providers: ${raw.length} → ${minified.length} bytes (${destPath})`
);
