# Engine spike results

Pyodide 314.0.7 (CPython 3.14.2) in a Web Worker. Chromium 153.0.8010.12 headless, Playwright 1.63.0. Raw data: `results/engine-spike.json`.

WebKit results come from the `engine-spike` GitHub Actions workflow, which runs the same harness on the same pinned release. They are added below once that run finishes.

## Method

- Every sample runs in a fresh browser context, so the HTTP cache starts empty.
- The server sends COOP `same-origin`, COEP `require-corp`, CORP `same-origin`, and CSP `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'`.
- Byte counts are raw wire sizes. The harness does not compress. The brotli (quality 9) estimates in the JSON show what compression would save.
- Medians come with min–max ranges. Repetitions: cold start 5, each package 3, stack 3, restart 3 per variant, interrupt 2 contexts × 3 interrupts.

## Cold start

| Measure | Median | Range |
|---|---|---|
| Worker created to first Python result | 2,302 ms | 2,101–2,462 ms |
| Core init (`loadPyodide`) | 2,271 ms | 2,069–2,436 ms |
| Core wire bytes (4 resources) | 13,513,276 B | |

The core is `pyodide.asm.wasm` (9.60 MB), `python_stdlib.zip` (2.55 MB), `pyodide.asm.mjs` (1.25 MB), and `pyodide.mjs` (18 KB). Brotli q9 estimates for those four files total about 5.8 MB.

## Packages, each alone in a fresh worker (dependency closure included)

| Package | Load, median | Wire bytes | Files |
|---|---|---|---|
| numpy 2.4.6 | 434 ms | 2,960,568 | 1 |
| pandas 3.0.2 | 999 ms | 7,889,748 | 5 (with numpy) |
| matplotlib 3.10.8 | 1,072 ms | 13,266,929 | 12 |
| scipy 1.18.0 | 1,968 ms | 16,990,318 | 2 (with numpy) |
| scikit-learn 1.8.0 | 2,818 ms | 21,638,477 | 5 |
| seaborn 0.13.2, vendored (with pandas and matplotlib) | 1,442 ms | 17,739,592 | 14 |

The closure sizes include shared dependencies, so they are not additive. Brotli saves about 1% on the wheels, since they are already zip-compressed.

seaborn is not in the 314.0.7 distribution. The spike vendors its pure-Python wheel (294,914 B, SHA-256 checked) and loads it by URL. A URL install does not resolve dependencies, so pandas and matplotlib must be loaded first.

## Full stack (numpy, pandas, matplotlib, scipy, scikit-learn)

- Load: 3,908 ms median (3,829–3,966 ms). Wire bytes: 36,122,587 across 17 files.
- wasm linear memory after load: 94.2 MB. After the seven functional checks: 195.6 MB. Memory roughly doubles during real work, so the product needs a worker recycling policy.
- Page JS heap: 10.0 MB (`usedJSHeapSize`, reported as rounded).
- UA-specific memory was not measured: `measureUserAgentSpecificMemory()` threw `SecurityError` in this headless run.

## Functional checks (Chromium): 7 of 7 pass

Pure Python, a pandas groupby, a matplotlib Agg PNG (PNG signature and size checked), a scikit-learn linear fit, mock-API pagination (three pages, 25 items), a 429 with `Retry-After: 2` followed by a 200, and the mock's call log (exactly the five expected calls).

## Isolation (Chromium): all checks behave as designed

- A new globals dict per run hides earlier names.
- The mock API is injected into each run's namespace, not the shared builtins.
- Before reset, a file written in run A is visible in run B, and so is a user module cached in `sys.modules`. There is one open matplotlib figure.
- Reset closes all figures, removes modules whose `__file__` is under `/home/pyodide/`, removes `/home/pyodide/work`, and cleans `sys.path`. After reset, all of these are gone.
- NumPy's global RNG state persists across runs (confirmed). Each run must seed its own `np.random.default_rng(seed)`.

## Interrupting runaway code

| Method | Measure | Chromium result |
|---|---|---|
| (a) Interrupt buffer on a SharedArrayBuffer (needs COOP/COEP) | Signal to `KeyboardInterrupt` reply, 6 samples | median 3 ms (2–9 ms) |
| (a) Same, next run after interrupt | Recovery | median 3 ms (2–5 ms) |
| (a) Native call: 2000×2000 `np.linalg.svd`, signalled after 300 ms | Signal to reply | 19 ms (one sample) |
| (b) Terminate and recreate the worker, core only | Terminate to first result | median 1,868 ms (1,787–1,951 ms) |
| (b) Terminate and recreate, with the full stack | Terminate to first result | median 6,240 ms (6,024–6,298 ms) |

**Recommendation: (a), the interrupt buffer, as the primary stop.** It is about 600× faster to recover than (b) with the core alone, and about 2,000× faster with the stack. Keep (b) as the fallback for two cases: when SharedArrayBuffer is unavailable, and when the worker is stuck before it can respond, such as during a package load.

Deployment needs these headers on the page and every asset:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-origin`

## CSP

- `script-src 'self' 'wasm-unsafe-eval'` plus `worker-src 'self'`: the cold start succeeds.
- Without `'wasm-unsafe-eval'`, Chromium refuses to compile WebAssembly. The page-side check fails with `CompileError: ... 'unsafe-eval' is not an allowed source`. The worker never settles: the probe timed out at 60 s, and no console error was captured from the worker.

The product therefore needs `'wasm-unsafe-eval'` and a load timeout that shows the user an error. The 60 s timeout is only a spike probe; the product should use a much shorter timeout, since the cold start is about 2.3 s here.

## Unsure or not measured

- WebKit: pending the GitHub Actions run.
- UA-specific memory: `SecurityError` in headless Chromium, not measured.
- The memory numbers read `pyodide._module.HEAPU8`, an internal API. Replace it with a public measure in the build.
- The core's four files add up to 13.41 MB on disk, while the measured wire bytes are 13.51 MB. The ~0.10 MB gap is not attributed.
- The interrupt was tested on one native call (SVD) and one loop. Other long native calls are not covered.
- Worker memory roughly doubled under the functional checks. The threshold for recycling a worker is not yet set.
- seaborn is vendored, not an official Pyodide package.
