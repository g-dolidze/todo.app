// Fails when ka.json and en.json do not have exactly the same keys (TDD §11.5).
import { readFileSync } from 'node:fs';

const load = (locale) =>
  JSON.parse(readFileSync(new URL(`../src/i18n/${locale}.json`, import.meta.url), 'utf8'));

function keys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object') return keys(child, path);
    if (typeof child !== 'string' || child.trim() === '') return [`${path} (empty)`];
    return [path];
  });
}

const ka = new Set(keys(load('ka')));
const en = new Set(keys(load('en')));
const problems = [
  ...[...ka].filter((key) => !en.has(key)).map((key) => `missing in en.json: ${key}`),
  ...[...en].filter((key) => !ka.has(key)).map((key) => `missing in ka.json: ${key}`),
  ...[...ka, ...en].filter((key) => key.endsWith('(empty)')).map((key) => `empty text: ${key}`),
];

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`i18n OK — ${ka.size} keys in ka and en`);
