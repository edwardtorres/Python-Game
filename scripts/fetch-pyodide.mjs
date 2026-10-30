// Fetches the pinned Pyodide release, verifies it, and copies only the files the
// app needs into public/pyodide: the core runtime plus the wheels for the packages
// the game uses (and their dependency closure). Nothing loads from a CDN at runtime.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const VERSION = '314.0.7';
const TARBALL = `pyodide-${VERSION}.tar.bz2`;
const TARBALL_URL = `https://github.com/pyodide/pyodide/releases/download/${VERSION}/${TARBALL}`;
const TARBALL_SHA256 = '192b5864e6e6d30ab074861af800cb8b4acb0998ef0f9342c3367448aeb86645';
const PACKAGES = ['numpy', 'pandas', 'matplotlib', 'scikit-learn'];
const CORE_FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
// seaborn is not in the 314.0.7 release. It is a pure-Python wheel, vendored from PyPI
// and checked by SHA-256. Only chapter 8 may load it, after pandas and matplotlib.
const SEABORN = {
  file: 'seaborn-0.13.2-py3-none-any.whl',
  url: 'https://files.pythonhosted.org/packages/83/11/00d3c3dfc25ad54e731d91449895a79e4bf2384dc3ac01809010ba88f6d5/seaborn-0.13.2-py3-none-any.whl',
  sha256: '636f8336facf092165e27924f223d3c62ca560b1f2bb5dff7ab7fad265361987',
};
const MARKER_VALUE = `${VERSION} seaborn ${SEABORN.file}`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, '.cache', 'pyodide');
const outDir = path.join(root, 'public', 'pyodide');
const marker = path.join(outDir, '.version');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function ensureTarball() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const tarball = path.join(cacheDir, TARBALL);
  if (fs.existsSync(tarball) && sha256(tarball) === TARBALL_SHA256) return tarball;
  const response = await fetch(TARBALL_URL);
  if (!response.ok || !response.body) throw new Error(`download failed: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(tarball));
  const actual = sha256(tarball);
  if (actual !== TARBALL_SHA256) {
    fs.rmSync(tarball);
    throw new Error(`SHA-256 mismatch for ${TARBALL}: got ${actual}`);
  }
  return tarball;
}

async function ensureSeaborn() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const wheel = path.join(cacheDir, SEABORN.file);
  if (fs.existsSync(wheel) && sha256(wheel) === SEABORN.sha256) return wheel;
  const response = await fetch(SEABORN.url);
  if (!response.ok || !response.body) throw new Error(`seaborn download failed: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(wheel));
  const actual = sha256(wheel);
  if (actual !== SEABORN.sha256) {
    fs.rmSync(wheel);
    throw new Error(`SHA-256 mismatch for ${SEABORN.file}: got ${actual}`);
  }
  return wheel;
}

function closure(lock, names) {
  const seen = new Set();
  const queue = [...names];
  while (queue.length > 0) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    const entry = lock.packages[name];
    if (!entry) throw new Error(`package not in lock file: ${name}`);
    seen.add(name);
    for (const dep of entry.depends ?? []) queue.push(dep);
  }
  return [...seen].sort();
}

async function main() {
  if (fs.existsSync(marker) && fs.readFileSync(marker, 'utf8').trim() === MARKER_VALUE) {
    console.log(`Pyodide ${VERSION} and ${SEABORN.file} already present in public/pyodide`);
    return;
  }
  const tarball = await ensureTarball();
  const extractDir = path.join(cacheDir, `extract-${VERSION}`);
  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });
  execFileSync('tar', ['-xjf', tarball, '-C', extractDir]);
  const release = path.join(extractDir, 'pyodide');
  const lock = JSON.parse(fs.readFileSync(path.join(release, 'pyodide-lock.json'), 'utf8'));

  const wheelNames = closure(lock, PACKAGES).map((name) => lock.packages[name].file_name);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  for (const file of [...CORE_FILES, ...wheelNames]) {
    fs.copyFileSync(path.join(release, file), path.join(outDir, file));
  }
  const seaborn = await ensureSeaborn();
  fs.copyFileSync(seaborn, path.join(outDir, SEABORN.file));
  fs.writeFileSync(marker, `${MARKER_VALUE}\n`);
  console.log(`Pyodide ${VERSION}: copied ${CORE_FILES.length + wheelNames.length + 1} files to public/pyodide`);
}

await main();
