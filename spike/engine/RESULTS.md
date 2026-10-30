# Engine spike results

Pyodide 314.0.7 (CPython 3.14.2) in a Web Worker. Chromium 153.0.8010.12 (local) and WebKit 26.6 (GitHub Actions), Playwright 1.63.0. Raw data: `results/engine-spike.json` (Chromium, local), and the CI logs for WebKit.

## Method

- Every sample runs in a fresh browser context, so the HTTP cache starts empty.
- The server sends COOP `same-origin`, COEP `require-corp`, CORP `same-origin`, and CSP `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'`.
- Byte counts are raw wire sizes. The harness does not compress; brotli (quality 9) estimates are in the JSON.
- Medians come with min–max ranges. Repetitions: cold start 5, each package 3, stack 3, restart 3 per variant, interrupt 2 contexts × 3 interrupts.
- The harness exits non-zero when a required check fails, a sample errors, or the CSP outcome is wrong. A CSP probe is expected to fail; its outcome is checked on its own.

## Cold start

| Measure | Chromium (local) | WebKit (CI) |
|---|---|---|
| Worker created to first Python result, median (range) | 2,302 ms (2,101–2,462) | 1,617 ms (1,568–1,654) |
| Core wire bytes, 4 resources | 13,513,276 B | not read from the WebKit log |

The core is `pyodide.asm.wasm` (9.60 MB), `python_stdlib.zip` (2.55 MB), `pyodide.asm.mjs` (1.25 MB), and `pyodide.mjs` (18 KB). Brotli q9 estimates for those four total about 5.8 MB.

## Packages, each alone in a fresh worker (dependency closure included)

| Package | Chromium median | WebKit median | Wire bytes | Files |
|---|---|---|---|---|
| numpy 2.4.6 | 434 ms | 298 ms | 2,960,568 | 1 |
| pandas 3.0.2 | 999 ms | 649 ms | 7,889,748 | 5 (with numpy) |
| matplotlib 3.10.8 | 1,072 ms | 772 ms | 13,266,929 | 12 |
| scipy 1.18.0 | 1,968 ms | 1,318 ms | 16,990,318 | 2 (with numpy) |
| scikit-learn 1.8.0 | 2,818 ms | 1,654 ms | 21,638,477 | 5 |
| seaborn 0.13.2, vendored (with pandas and matplotlib) | 1,442 ms | 1,043 ms | 17,739,592 | 14 |

Closures overlap, so the sizes are not additive. Brotli saves about 1% on wheels, which are already zip-compressed.

seaborn is not in the 314.0.7 distribution. The spike vendors its pure-Python wheel (294,914 B, SHA-256 checked) and loads it by URL. A URL install does not resolve dependencies, so pandas and matplotlib must be loaded first.

## Full stack (numpy, pandas, matplotlib, scipy, scikit-learn)

- Load: 3,908 ms Chromium (3,829–3,966), 2,352 ms WebKit (2,335–2,375). Wire bytes: 36,122,587 in 17 files.
- wasm linear memory after load: 94.2 MB in both browsers. After the seven functional checks: 195.6 MB in both browsers. Memory roughly doubles under real work, so the product needs worker recycling.
- Page JS heap: 10.0 MB in Chromium (a rounded value). WebKit does not expose it.
- UA-specific memory: `SecurityError` in Chromium, unavailable in WebKit. Not measured.
- The wasm figure reads `pyodide._module.HEAPU8`, an internal API.

## Functional checks: 7 of 7 pass in both browsers

Pure Python, a pandas groupby, a matplotlib Agg PNG (signature and size checked), a scikit-learn linear fit, mock-API pagination, a 429 with `Retry-After: 2` followed by a 200, and the mock's call log.

## Isolation: 9 of 9 checks behave as designed in both browsers

- A new globals dict per run hides earlier names.
- The mock API is injected into each run's namespace.
- Before reset, a file and a user module from run A are visible in run B. After reset, both are gone, figures are closed, and `sys.path` is clean.
- NumPy's global RNG state persists across runs. This is a confirmed leak, so each graded run must reseed. The product does this (see CLAUDE.md).

## Interrupting runaway code

| Method | Chromium (local) | WebKit (CI) |
|---|---|---|
| (a) Interrupt buffer, signal to `KeyboardInterrupt` reply | 6 samples: median 3 ms (2–9) | 3 samples: median 1.9 ms (1.7–3.6); one context of two returned no samples (see the hang section) |
| (a) Recovery: next run after the interrupt | median 3 ms (2–5) | 1.7–3.7 ms |
| (a) One native call: 2000×2000 `np.linalg.svd`, signalled after 300 ms | 19 ms (one sample) | not run |
| (b) Terminate and recreate the worker, core only | median 1,868 ms (1,787–1,951) | median 1,889 ms (1,848–1,963) |
| (b) Terminate and recreate, with the full stack | median 6,240 ms (6,024–6,298) | median 4,622 ms (4,583–4,653) |

**Decision (product): hybrid.** Raise the buffer first. If the worker does not confirm `KeyboardInterrupt` within 2 seconds, terminate the worker and start a new one. The engine's tests cover both paths, including a forced fallback.

Deployment needs `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, and `Cross-Origin-Resource-Policy: same-origin` on the page and every asset.

### WebKit hang: what is known

- **CI run 41104865483** (first spike, commit 170ce25, the uninstrumented harness): one of the two WebKit interrupt contexts never returned a sample and hit the 5-minute sample timeout. The other context's three interrupts all worked. The stage was not recorded, because that harness did not instrument the path.
- **CI run 41114548275** (commit 7a918df, instrumented harness): both WebKit interrupt contexts returned all three interrupts. The job failed only because of a harness bug in how the CSP probe's expected timeout was counted, which is now fixed.
- **CI run 41114548397** (`webkit-interrupt-diagnosis`, commit 7a918df): 50 fresh WebKit contexts, two interrupts each, 100 attempts. All 100 returned `KeyboardInterrupt` in a few milliseconds. The buffer was consumed (reset to 0) in every attempt. No stage failed, so none could be classified.
- Across all WebKit runs: one hang in 54 contexts. In the instrumented diagnosis, zero in 100 attempts. With 0 failures in 100, the 95% upper bound on the per-attempt hang rate is about 3.7%.
- **Cause: not diagnosed.** The one hang was not captured with the stage instrumentation, and it has not recurred in 100 instrumented attempts. The hybrid fallback exists for exactly this case: a stuck interrupt costs 2 seconds and a worker restart, not a frozen page.

## CSP

- `script-src 'self' 'wasm-unsafe-eval'` with `worker-src 'self'`: the cold start succeeds in both browsers.
- Without `'wasm-unsafe-eval'`, both browsers refuse to compile WebAssembly. The page-side check fails with `CompileError` (Chromium names `'unsafe-eval'`; WebKit names `'unsafe-eval' or 'wasm-unsafe-eval'`). The worker never settles, so the probe timed out at 60 seconds, and no console error reached the page.

The product therefore needs `'wasm-unsafe-eval'`, and it checks WebAssembly on the page before starting a worker, so a blocked policy fails at once with a clear message.

## Unsure or not measured

- UA-specific memory: `SecurityError` in headless Chromium, unavailable in WebKit.
- The wasm memory figure uses an internal Pyodide field, `_module.HEAPU8`.
- The core's four files add up to 13.41 MB on disk, while the measured wire bytes are 13.51 MB. The 0.10 MB gap is not attributed.
- The WebKit hang has a cause we have not identified (see above).
- The interrupt was tested on one native call (SVD) and one tight loop. Other long native calls are not covered.
- seaborn is vendored, not an official Pyodide package.
