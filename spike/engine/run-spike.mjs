// Engine spike orchestrator. It starts the harness server, runs each scenario in a
// fresh browser context (so caches are empty), and writes results/engine-spike.json.
// Set PYODIDE_DIST to the extracted pyodide/ folder and BROWSER to chromium or webkit.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { startServer } from './serve.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = process.env.PYODIDE_DIST;
if (!distDir) throw new Error('Set PYODIDE_DIST to the extracted pyodide/ folder.');
const browserName = process.env.BROWSER ?? 'chromium';
const engines = { chromium, webkit };
const appDir = path.join(here, 'app');
const outDir = path.join(here, 'results');
const PYODIDE_VERSION = '314.0.7';
const SAMPLE_TIMEOUT_MS = 5 * 60 * 1000;

const STACK = ['numpy', 'pandas', 'matplotlib', 'scipy', 'scikit-learn'];
const JOBS = [
  { id: 'coldStart', fn: 'coldStart', args: {}, reps: 5 },
  ...STACK.map((name) => ({ id: `package:${name}`, fn: 'packageAlone', args: { name }, reps: 3 })),
  { id: 'stackLoad', fn: 'stackLoad', args: {}, reps: 3 },
  { id: 'seaborn', fn: 'seabornProbe', args: {}, reps: 3 },
  { id: 'functional', fn: 'functional', args: {}, reps: 1 },
  { id: 'isolation', fn: 'isolation', args: {}, reps: 1 },
  { id: 'interruptSharedBuffer', fn: 'interruptSharedBuffer', args: {}, reps: 2 },
  { id: 'interruptRestart:core', fn: 'interruptRestart', args: { withStack: false }, reps: 3 },
  { id: 'interruptRestart:stack', fn: 'interruptRestart', args: { withStack: true }, reps: 3 },
  { id: 'csp:production', fn: 'cspProbe', args: {}, reps: 1, policy: 'production' },
  { id: 'csp:noWasmEval', fn: 'cspProbe', args: {}, reps: 1, policy: 'noWasmEval' },
];

async function runSample(browser, baseUrl, job) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && consoleErrors.length < 5) consoleErrors.push(message.text().slice(0, 300));
  });
  try {
    await page.goto(`${baseUrl}/`);
    await page.waitForFunction(() => window.spikeReady === true, null, { timeout: 60_000 });
    const sample = await Promise.race([
      page.evaluate(([fn, args]) => window.spike[fn](args), [job.fn, job.args]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('sample timed out')), SAMPLE_TIMEOUT_MS)),
    ]);
    return { ...sample, consoleErrors };
  } catch (error) {
    return { error: String(error.message ?? error).split('\n')[0].slice(0, 300), consoleErrors };
  } finally {
    await context.close();
  }
}

const brotliCache = new Map();
function wireSize(name) {
  if (brotliCache.has(name)) return brotliCache.get(name);
  const entry = lock.packages[name];
  if (!entry) return null;
  const bytes = fs.readFileSync(path.join(distDir, entry.file_name));
  const size = {
    name,
    file: entry.file_name,
    rawBytes: bytes.length,
    brotliBytesQ9: zlib.brotliCompressSync(bytes, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 },
    }).length,
  };
  brotliCache.set(name, size);
  return size;
}

const lock = JSON.parse(fs.readFileSync(path.join(distDir, 'pyodide-lock.json'), 'utf8'));
const playwrightVersion = JSON.parse(
  fs.readFileSync(path.join(here, 'node_modules/playwright/package.json'), 'utf8'),
).version;

const servers = {
  production: await startServer({ distDir, appDir, policy: 'production' }),
  noWasmEval: await startServer({ distDir, appDir, policy: 'noWasmEval' }),
};

const browser = await engines[browserName].launch();
const results = {
  meta: {
    browser: browserName,
    browserVersion: browser.version(),
    playwright: playwrightVersion,
    pyodide: PYODIDE_VERSION,
    python: lock.info.python,
    startedAt: new Date().toISOString(),
  },
  jobs: {},
};

for (const job of JOBS) {
  const server = job.policy === 'noWasmEval' ? servers.noWasmEval : servers.production;
  const started = Date.now();
  const samples = [];
  for (let rep = 0; rep < job.reps; rep += 1) {
    samples.push(await runSample(browser, server.baseUrl, job));
  }
  results.jobs[job.id] = { samples, wallSeconds: (Date.now() - started) / 1000 };
  console.error(`done ${job.id} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

results.closures = {};
for (const name of STACK) {
  const sample = results.jobs[`package:${name}`].samples[0];
  results.closures[name] = (sample.loaded ?? []).map(wireSize).filter(Boolean);
}

await browser.close();
await Promise.all([servers.production.close(), servers.noWasmEval.close()]);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'engine-spike.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
