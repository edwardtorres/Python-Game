// Production scan: the built app must contain no test or debug hooks. Each marker
// is a name that only appears in dev-only code. If any is found, the build fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKERS = ['forceInterruptFailure', 'recycleThresholdBytes', '__LARKSPUR_TEST__', 'larkspur-test-hook'];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(dist)) {
  console.error('check-production-hooks: dist/ is missing. Run the build first.');
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|mjs|html|css|map)$/.test(entry.name)) files.push(full);
  }
})(dist);

const hits = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const marker of MARKERS) {
    if (text.includes(marker)) hits.push(`${path.relative(root, file)} contains ${marker}`);
  }
}

if (hits.length > 0) {
  console.error(`check-production-hooks: test hooks leaked into the production build:\n${hits.join('\n')}`);
  process.exit(1);
}
console.log(`check-production-hooks: scanned ${files.length} files, no test hooks found`);
