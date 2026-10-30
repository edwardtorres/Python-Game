// WebKit interrupt diagnosis. Runs many fresh browser contexts, each with a cold
// worker and up to two buffer interrupts, and classifies every failure by the
// stage it reached. It always exits 0: a hang is the data we are collecting.
// Set PYODIDE_DIST to the extracted pyodide/ folder and BROWSER to webkit or chromium.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { startServer } from './serve.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = process.env.PYODIDE_DIST;
if (!distDir) throw new Error('Set PYODIDE_DIST to the extracted pyodide/ folder.');
const browserName = process.env.BROWSER ?? 'webkit';
const contexts = Number(process.env.CONTEXTS ?? 50);
const attemptsPerWorker = 2;
const SAMPLE_TIMEOUT_MS = 90_000;

const server = await startServer({ distDir, appDir: path.join(here, 'app'), policy: 'production' });
const browser = await { chromium, webkit }[browserName].launch();

async function oneContext(index) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${server.baseUrl}/`);
    await page.waitForFunction(() => window.spikeReady === true, null, { timeout: 60_000 });
    const result = await Promise.race([
      page.evaluate(([args]) => window.spike.interruptDiagnosis(args), [{ attempts: attemptsPerWorker }]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('context timed out')), SAMPLE_TIMEOUT_MS)),
    ]);
    return { index, ...result };
  } catch (error) {
    return { index, error: String(error.message ?? error).split('\n')[0].slice(0, 300), records: [] };
  } finally {
    await context.close();
  }
}

const started = Date.now();
const runs = [];
for (let index = 0; index < contexts; index += 1) {
  const run = await oneContext(index);
  runs.push(run);
  const last = run.records?.at(-1)?.classification ?? run.error ?? 'no-records';
  console.error(`context ${index}: ${last}`);
}

const attempts = runs.flatMap((run) => (run.records ?? []).map((record) => ({ context: run.index, ...record })));
const counts = {};
for (const run of runs) {
  const key = run.error && (!run.records || run.records.length === 0) ? `harness:${run.error}` : (run.records ?? []).at(-1)?.classification ?? 'no-records';
  counts[key] = (counts[key] ?? 0) + 1;
}
const summary = {
  browser: browserName,
  browserVersion: browser.version(),
  contexts,
  attemptsPerWorker,
  wallSeconds: (Date.now() - started) / 1000,
  contextOutcomes: counts,
  attemptClassifications: attempts.reduce((acc, a) => ({ ...acc, [a.classification]: (acc[a.classification] ?? 0) + 1 }), {}),
  hangingContexts: runs.filter((run) => run.error || (run.records ?? []).some((r) => r.classification !== 'ok')).map((run) => run.index),
};

await browser.close();
await server.close();

fs.mkdirSync(path.join(here, 'results'), { recursive: true });
fs.writeFileSync(path.join(here, 'results', `interrupt-diagnosis-${browserName}.json`), `${JSON.stringify({ summary, runs }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
