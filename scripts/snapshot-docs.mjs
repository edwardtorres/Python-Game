// Fetches every page in docs/snapshot-urls.txt and writes its visible text, the same text the
// quote checker searches, under an output folder. Each page gets a header with its URL and fetch
// time, and index.json records the URL, file, fetch time, and SHA-256 of the HTML for every page.
// Exits 1 if any page could not be fetched, so a missing page fails the workflow.
//
// Usage: node scripts/snapshot-docs.mjs <output-dir>
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchWithRetry, visibleText } from './lib/quotes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(process.argv[2] ?? 'snapshot-out');
const urls = fs
  .readFileSync(path.join(root, 'docs', 'snapshot-urls.txt'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '' && !line.startsWith('#'));

// https://developer.mozilla.org/en-US/docs/Glossary/Truthy -> pages/developer.mozilla.org/en-US__docs__Glossary__Truthy.txt
export function fileFor(url) {
  const parsed = new URL(url);
  const trimmed = parsed.pathname.replace(/^\/+|\/+$/g, '');
  const name = trimmed === '' ? 'index' : trimmed.replace(/\//g, '__');
  return path.join('pages', parsed.hostname, `${name}.txt`);
}

const index = [];
const failures = [];
for (const url of urls) {
  const page = await fetchWithRetry(url);
  if (page.kind !== 'ok') {
    failures.push(`${url}: ${page.kind === 'missing' ? `missing (${page.reason})` : `could not fetch (${page.reason})`}`);
    continue;
  }
  const fetched = new Date().toISOString();
  const sha256 = createHash('sha256').update(page.text).digest('hex');
  const text = visibleText(page.text);
  const file = fileFor(url);
  const target = path.join(outDir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `URL: ${url}\nFetched: ${fetched}\nSHA-256 of the HTML: ${sha256}\n----\n${text}\n`);
  index.push({ url, file, fetched, sha256, characters: text.length });
  console.log(`ok ${url} (${text.length} characters)`);
}

if (failures.length > 0) {
  console.error(`snapshot-docs: ${failures.length} of ${urls.length} pages failed:\n${failures.join('\n')}`);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
console.log(`snapshot-docs: ${index.length} pages written to ${outDir}`);
