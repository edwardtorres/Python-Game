// Verbatim docs-quote check. Reads docs/quotes.json, checks each quote against its live
// page, and exits 1 on any failure. Network problems are printed as warnings and do not
// fail the run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkEntries, validateEntries } from './lib/quotes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs', 'quotes.json');
const entries = JSON.parse(fs.readFileSync(file, 'utf8'));

const problems = validateEntries(entries);
if (problems.length > 0) {
  console.error(`check-quotes: ${problems.join('; ')}`);
  process.exit(1);
}

const results = await checkEntries(entries);
let failures = 0;
for (const result of results) {
  const label = result.status.toUpperCase().padEnd(8);
  console.log(`${label} ${result.id}${result.reason ? `: ${result.reason}` : ''}`);
  if (result.status === 'fail') failures += 1;
}
const warnings = results.filter((result) => result.status === 'warning').length;
console.log(`check-quotes: ${results.length} quotes, ${failures} failed, ${warnings} warnings`);
process.exit(failures > 0 ? 1 : 0);
