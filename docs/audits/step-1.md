# Step 1 audit: engine spike run (partial)

Date: 2026-10-30
Branch: `claude/busy-wright-rooppm`, pushed at `170ce25`
Status: **Stopped at the WebKit gate.** Step 1 is not complete. This run finished the Phase 0 engine spike in Chromium and mostly in WebKit. One WebKit interrupt context hung, and you asked to be told about core WebKit failures, so nothing else was built. Sections for work that was not started keep their headings and say why.

## Engine spike: numbers and decisions

### Setup

- Engine: Pyodide 314.0.7 (CPython 3.14.2), self-hosted from the GitHub release tarball. SHA-256 `192b5864…86645`, checked in CI.
- Seaborn 0.13.2 is not in the 314.0.7 release. Its pure-Python wheel was vendored from PyPI (SHA-256 `636f8336…61987`, checked in CI).
- Browsers: Chromium 153.0.8010.12 (local run); WebKit 26.6 (CI). Playwright pinned to 1.63.0, the version installed here.
- Every sample runs in a fresh browser context, so caches start empty.
- Headers on the page and all assets: `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, `Cross-Origin-Resource-Policy: same-origin`.
- CSP in production: `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'`.
- Byte counts are raw wire sizes; the harness does not compress.

### Cold start and loading

| Measure | Chromium (local) | WebKit (CI) |
|---|---|---|
| Worker created to first Python result, median (range) | 2,302 ms (2,101–2,462) | 1,617 ms (1,568–1,654) |
| Core wire bytes, 4 resources | 13,513,276 B | not read from the WebKit job log |

Core files: `pyodide.asm.wasm` 9.60 MB, `python_stdlib.zip` 2.55 MB, `pyodide.asm.mjs` 1.25 MB, `pyodide.mjs` 18 KB. Brotli (quality 9) estimate for those four: about 5.8 MB.

### Packages, each alone with its dependency closure

| Package | Chromium median | WebKit median | Wire bytes (both browsers) | Files |
|---|---|---|---|---|
| numpy 2.4.6 | 434 ms | 298 ms | 2,960,568 | 1 |
| pandas 3.0.2 | 999 ms | 649 ms | 7,889,748 | 5 |
| matplotlib 3.10.8 | 1,072 ms | 772 ms | 13,266,929 | 12 |
| scipy 1.18.0 | 1,968 ms | 1,318 ms | 16,990,318 | 2 |
| scikit-learn 1.8.0 | 2,818 ms | 1,654 ms | 21,638,477 | 5 |
| seaborn 0.13.2 (vendored, with pandas and matplotlib) | 1,442 ms | 1,043 ms | 17,739,592 | 14 |

Closures overlap, so they are not additive. Brotli saves about 1% on wheels, which are already zip-compressed.

### Full stack (numpy, pandas, matplotlib, scipy, scikit-learn)

- Load: 3,908 ms Chromium, 2,352 ms WebKit. Wire bytes: 36,122,587 in 17 files.
- wasm linear memory after load: 94,240,768 B (94.2 MB). After the functional checks: 195,624,960 B (195.6 MB). Memory roughly doubles under real work, so the product needs a worker recycling policy.
- JS heap (page): 10.0 MB in Chromium, which reports a rounded value. WebKit does not expose it.
- UA-specific memory: `SecurityError` in Chromium, and not available in WebKit. Not measured.
- The wasm figure reads `pyodide._module.HEAPU8`, an internal API.

### Functional checks: 7 of 7 pass in both browsers

Pure Python; pandas groupby; matplotlib Agg PNG (signature and size checked); scikit-learn linear fit; mock-API pagination (three pages, 25 items); a 429 with `Retry-After: 2` followed by a 200; and the mock's call log, which contains exactly the five expected calls.

### Isolation: 9 of 9 checks behave as designed in both browsers

- A new globals dict per run hides earlier names.
- The mock API is injected into each run's namespace, not the shared builtins.
- Before reset: a file written in run A is visible in run B, a user module stays in `sys.modules`, and one matplotlib figure is open.
- Reset closes all figures, removes modules whose `__file__` is under `/home/pyodide/`, removes `/home/pyodide/work`, and cleans `sys.path`.
- NumPy's global RNG state persists across runs. This is a confirmed leak, so each run must seed its own `np.random.default_rng(seed)`.

### Interrupting runaway code

| Method | Chromium (local) | WebKit (CI) |
|---|---|---|
| (a) Interrupt buffer on a SharedArrayBuffer, signal to `KeyboardInterrupt` reply | 6 samples, median 3 ms (2–9 ms) | 3 samples, median 1.9 ms (1.7–3.6 ms); **1 context hung for the full 5-minute sample timeout, with no samples returned** |
| (a) Recovery: next run after the interrupt | median 3 ms (2–5 ms) | 1.7–3.7 ms (3 samples) |
| (a) One native call: 2000×2000 `np.linalg.svd`, signalled after 300 ms | 19 ms (one sample) | not run |
| (b) Terminate and recreate the worker, core only | median 1,868 ms (1,787–1,951) | median 1,889 ms (1,848–1,963) |
| (b) Terminate and recreate, with the full stack | median 6,240 ms (6,024–6,298) | median 4,622 ms (4,583–4,653) |

The interrupt buffer's `bufferAfter` is 0 in every sample, and the next run after each interrupt returns 2.

**Decision: not final.** The earlier recommendation was (a) with (b) as the fallback. The WebKit hang means (a) is not confirmed in WebKit. The cause is not diagnosed: the signal may not reach the worker, or the loop may not start. The stop-and-report rule applies here, and you have not yet decided between diagnosing with a spike-only CI run and switching to (b) as the primary stop.

Deployment still needs the three headers above on the page and every asset, for (a) to work at all.

### CSP

- With `'wasm-unsafe-eval'`, the cold start succeeds in both browsers.
- Without it, both browsers refuse to compile WebAssembly, and the worker never settles: the probe timed out at 60 s, and no console error reached the page. Chromium's message names `'unsafe-eval'`. WebKit's says `'unsafe-eval' or 'wasm-unsafe-eval'`.
- Product consequence: keep `'wasm-unsafe-eval'`, and add a short load timeout that shows the user an error.

## Curriculum tree and competency coverage

Not built. The spike does not touch the curriculum. The curriculum waits for your approval of the full Step 1 plan, which depends on the interrupt decision above.

## Datasets and generators

Not built. The spike's mock API is a test double for the API grader, not a dataset generator.

## Grader design and test results, by challenge type

Not built. The spike's functional checks are not a grader and have no challenge metadata, hidden tests, or wrong variants. No grader unit tests exist.

## The three sample challenges, with hidden tests, wrong variants, and blind-solve results

Not built. Blind-solve results: none.

## e2e and axe results (Chromium here; Chromium and WebKit in CI)

Not built. There is no UI yet, so there are no Playwright e2e specs and no axe runs. The spike's Playwright runs drive the harness and are not e2e specs.

- Chromium here: n/a.
- Chromium and WebKit in CI: the spike workflow ran in both. Its jobs concluded `success`. The harness records failures instead of failing the job, so the WebKit hang does not appear in the job status.

## Anything you were unsure of, and deviations

**Unsure**

- The WebKit interrupt hang. Its cause is not known, and one run is not enough to say whether it is intermittent or systematic.
- The interrupt has been tested on one native call (SVD) and one tight Python loop. Other long native calls are not covered.
- Memory: UA-specific memory is unavailable in both browsers here, the wasm measure uses an internal API, and the rounded JS heap figure is only indicative.
- Worker memory roughly doubles under real checks. The recycling threshold is not yet set.
- The core's four files add up to 13.41 MB on disk, while the measured wire bytes are 13.51 MB. The 0.10 MB gap is not attributed.
- Brotli figures are estimates at quality 9.
- seaborn is vendored, not an official Pyodide package.
- I did not parse the Chromium CI JSON. Its job passed, but the Chromium numbers above come from my local run of the same code.

**Deviations**

- jsDelivr is blocked from this container, so Pyodide is self-hosted from the GitHub release tarball. The CDN was not used at any point.
- seaborn is not in the 314.0.7 release, so it was vendored from PyPI with a SHA-256 check.
- Playwright is pinned to 1.63.0, not the latest 1.64.1, to match the preinstalled browser.
- Artifact downloads are blocked here, so the WebKit JSON was read from the job log.
- Commit trailers omit the session link and the model name, following your rule on session links and the model-identifier rule. Both commits carry `Co-Authored-By: Claude <noreply@anthropic.com>`.
- You approved running the spike while plan mode was active, so I exited plan mode once for that purpose.
- The Step 1 plan was not shown in full before the spike ran. The full plan was not delivered because the WebKit gate stopped the run.
- The WebKit numbers are not yet in `spike/engine/RESULTS.md`. They are in this audit and in the CI log.

## Test and check results, and push status

**Checks run**

- Spike: functional checks 7/7 in both browsers; isolation 9/9 in both; interrupt method (a) 6/6 in Chromium, 3/6 in WebKit (one context hung); CSP probes as expected in both; seaborn check `0.13.2|True|True` in both.
- Unit tests, lint, typecheck: none. Vitest is not set up yet.

**Push status**

- `claude/busy-wright-rooppm` pushed with two commits, remote head `170ce25`, matching local HEAD.
- Commits: `b1ee142` (prompt file) and `170ce25` (spike, workflow, RESULTS.md). Both are authored as Edward Torres.
- No pull request. No push to any other branch.
- `main` does not exist yet, so the end-of-step HEAD check against `origin/main` does not apply yet.
- CI: `engine-spike` run 41104865483, both jobs `success`.
- This audit file is uncommitted. Say the word and I'll commit it.
