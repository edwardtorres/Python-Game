# Step 1 audit: engine, curriculum, grader, samples, UI, CI

Date: 2026-10-30
Branch: `claude/busy-wright-rooppm`, head `b6cd456` at the time of writing
Status: **Step 1 closed.** CI for `b0d8d7b` passed in every job, including Chromium and WebKit end-to-end. `main` was created from `b0d8d7b` by a fast-forward push, and HEAD equals `origin/main`. The first WebKit run that could have passed (`b6cd456`) was cancelled by a later docs-only push, so it never produced a WebKit result; the WebKit failure seen on `e5936f9` was a stale worker cache, fixed in `b0d8d7b` (see "Push" below).

The earlier partial audit (commit `de86faf`) is preserved in git history. This file replaces it.

## Interrupt decision (hybrid)

**Decision:** stop a run by raising the interrupt buffer (a `SharedArrayBuffer`). If the worker does not confirm `KeyboardInterrupt` within 2 seconds, terminate the worker and start a new one.

**Evidence** (`spike/engine/RESULTS.md`):

| Method | Chromium (local) | WebKit (CI) |
|---|---|---|
| (a) Buffer, signal to reply | median 3 ms (2–9) | median 1.9 ms (1.7–3.6), one context of two hung |
| (b) Terminate and recreate, core only | median 1,868 ms | median 1,889 ms |
| (b) Terminate and recreate, with the full stack | median 6,240 ms | median 4,622 ms |

The buffer is about 600× faster than a restart. The restart is kept as the fallback, for the case where the buffer is unavailable or the worker does not confirm in time.

**Tests:**
- Unit (`src/engine/client.test.ts`, fake worker and fake timers): buffer stop confirmed inside the 2 s grace, forced ignore → restart after 2 s, confirmation at 1.5 s stays a buffer stop, confirmation at 2.6 s restarts, stop during start-up is honoured.
- End-to-end (`e2e/engine.spec.ts`): a runaway loop stops in under 4 seconds with no restart; with `?forceInterruptFailure=1` the buffer is ignored, the engine restarts after the grace period, and the next run works.

**Deployment requirement (cross-origin isolation).** `SharedArrayBuffer` needs these headers on the page and on every asset:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-origin`

These are recorded in CLAUDE.md, and `vite.config.ts` sets them for the dev and preview servers. The deployed host must set them too. Without them, every stop costs a worker restart.

## WebKit hang diagnosis

**What was observed.**

- **Run 41104865483** (commit `170ce25`, the original spike, which had no stage instrumentation): one of the two WebKit interrupt contexts never returned a sample and hit the 5-minute sample timeout. The other context's three interrupts all worked. No stage was recorded.
- **Run 41114548275** (commit `7a918df`, instrumented): both WebKit interrupt contexts returned all three interrupts. The job failed only because of a harness bug: the CSP probe's expected timeout was counted as a failure. That bug is fixed.
- **Run 41114548397** (`webkit-interrupt-diagnosis`, commit `7a918df`): 50 fresh WebKit contexts, two interrupts each, 100 attempts. All 100 returned `KeyboardInterrupt` within a few milliseconds, and the buffer was reset to 0 in every attempt. No attempt was classified as a failure, so no stage was observed.

**Stage classifier.** The diagnosis records each attempt's stage: loop not started, signal not consumed, reply lost, or unexpected reply. No attempt reached any failure stage, so the classifier never fired.

**Rate.** One hang in 54 WebKit contexts across the three runs. Zero in 100 instrumented attempts. With 0 failures in 100 attempts, the 95% upper bound on the per-attempt hang rate is about 3.7%.

**Cause.** Not diagnosed. The one hang was not captured with the stage instrumentation, and it has not recurred in 100 instrumented attempts. The hybrid fallback exists for exactly this case: a stuck buffer costs two seconds and a worker restart, not a frozen page.

**Not run:** the diagnosis itself is the spike's evidence. The product's WebKit end-to-end suite runs in CI (see push status).

## Engine spike: numbers and decisions

Full numbers: `spike/engine/RESULTS.md`. Summary:

- **Engine:** Pyodide 314.0.7 (CPython 3.14.2), self-hosted under `public/pyodide`. The release tarball is fetched from GitHub, and its SHA-256 is checked in both the fetch script and CI.
- **Cold start:** 2.3 s median in Chromium, 1.6 s in WebKit (worker creation to first Python result).
- **Core:** 13.5 MB on the wire (4 resources). Brotli q9 estimate about 5.8 MB.
- **Packages (wire bytes, dependency closure):** numpy 2.96 MB, pandas 7.89 MB, matplotlib 13.27 MB, scipy 16.99 MB, scikit-learn 21.64 MB, seaborn 17.74 MB (with pandas and matplotlib).
- **Full stack:** load 3.9 s Chromium, 2.4 s WebKit. Wasm memory 94.2 MB after load, 195.6 MB after functional checks.
- **Functional checks:** 7 of 7 pass in both browsers.
- **Isolation:** 9 of 9 checks as designed in both browsers. NumPy's RNG state persists across runs (confirmed). The product therefore reseeds every graded run.
- **CSP:** `script-src 'self' 'wasm-unsafe-eval'` with `worker-src 'self'` is required. Without `'wasm-unsafe-eval'`, Python cannot start and the worker hangs silently. The product checks WebAssembly on the page first and shows a clear error.
- **Seaborn:** not in the 314.0.7 release. The spike vendored its pure-Python wheel (SHA-256 checked) and loads it by URL, which does not resolve dependencies.

## Curriculum tree and competency coverage

Eleven chapters with prerequisites, 79 competencies, and one planned lesson per competency (79 lessons). Source: `src/curriculum/data.ts`.

```
c01 Foundations refresh (13)
 └─ c02 Informatics fundamentals (11)
     ├─ c03 Testing (4)
     │   └─ c05 APIs and automation (7) ← c04 Files and formats (5)
     ├─ c06 NumPy (4)
     │   └─ c07 pandas (12) ← c04
     │       ├─ c08 Visualization and reporting (5)
     │       └─ c09 Statistics (5) ← c06
     │           └─ c10 Machine learning basics (10) ← c07, c09
c11 Capstones and interviews (3) ← c05, c07, c08, c10
```

Validator tests (`src/curriculum/curriculum.test.ts`): the graph is acyclic, every chapter is reachable, every competency is taught by a lesson, and unknown references fail. Lesson content is not written yet; it arrives in later steps.

## Datasets and generators

Four seeded generators in `src/data/`: shipments, sensor telemetry, customer churn, and pricing experiments. Each returns CSV text from a seeded sfc32 PRNG.

- **Same seed → identical bytes** (tested for every generator).
- Different seeds differ, headers match declared columns, and rows keep a consistent width.
- Shipments: `late` equals `actual_days > promised_days`; about 3% of weights are missing.
- Churn: about 6% of regions are missing, and about 5% of rows are repeated customers.
- Pricing: revenue equals price times units.

Datasets used by the samples: churn seeds 101 (visible), 202 and 303 (hidden); shipments seeds 7 (visible), 8 and 9 (hidden). A Run generates only visible datasets, so hidden data is generated only on Submit.

## Grader design and test results, by challenge type

The grader core is Python (`src/engine/python/grader.py`), run in Pyodide with the same code in the browser and in Node tests.

| Kind | How it grades | Test coverage |
|---|---|---|
| function | Runs the function on each case; compares to the reference with a stated tolerance; matches exceptions by type | samples test; python test |
| pandas | `pandas.testing.assert_frame_equal` with stated rules (dtype, tolerance) | samples test (churn) |
| chart | Inspects the matplotlib figure: type, orientation, series, title, labels, categories, bar heights | samples test (chart) |
| ml | Trains on training data only; scores a hidden holdout against a threshold | python test (pass and fail cases) |
| api | Simulated API with pages, 429 with Retry-After, and 5xx; virtual clock; checks paging, attempts, and backoff | python test (correct, naive, ignores Retry-After) |
| testing | Learner tests must pass on the correct version and fail on each buggy version (mutation) | python test (strong and weak tests) |
| structure | Python `ast` checks: defines, no loops, comprehension, calls | python test |

Cross-cutting behaviour, all tested:

- **Determinism:** identical runs give identical results, including after other runs use the RNG.
- **Isolation:** a file or module written by one run is absent from the next (tested).
- **Redaction:** hidden-case messages never include inputs or expected values (tested for every sample variant).
- **Run versus Submit scope:** a Run grades visible cases with visible data only (tested).
- **Wrong-variant matching:** a learner's output that matches a variant names that mistake (tested for every sample variant).
- **Notebook submissions:** graded as definitions and imports only, so top-level exploration cannot break a graded run.

Unit totals: 135 tests across 7 files, all passing locally.

## The three sample challenges, with hidden tests, wrong variants, and blind-solve results

### 1. Clean the dock scale readings (function, Foundations)

- **Rules (6):** return a new list of floats in order; drop None and blank text; drop non-finite values and booleans; drop negatives and keep zero; keep duplicates; round to 2 decimals with halves up.
- **Cases:** 9 total. Visible: a mixed export, an empty export, and numbers stored as text. Hidden (6): only missing markers, non-finite text, zero and sign boundaries, halves rounding up, duplicates keeping order, and a very large reading.
- **Wrong variants (7), each breaking one rule:** `round-builtin` (rounding), `keeps-negatives` and `drops-zero` (sign and boundary), `sorts-output` (order), `drops-duplicates` (duplicates), `bools-as-numbers` (types), `none-as-zero` (missing data). Every variant is caught by at least two cases.
- **Blind solve:** solver's solution passed **9 of 9** cases.

### 2. Churn rate by region (pandas, notebook, Data)

- **Rules (7):** drop repeated customer rows, keeping the first; missing region becomes `unknown`; column order; churn rate rounded to 4 decimals; sort order; index reset; counts are 64-bit integers.
- **Cases:** 3 total. Visible export (seed 101, 150 base rows plus duplicates). Hidden: seed 202 (150 rows) and seed 303 (80 rows).
- **Wrong variants (8):** `duplicates-kept`, `missing-dropped`, `groupby-dropna-trap` (groupby silently drops NaN keys), `rate-not-rounded`, `sorted-ascending`, `index-not-reset`, `columns-reordered`, and `int32-counts` (bare `int` gives 32-bit counts under Pyodide).
- **Blind solve, v1:** **0 of 3** cases. The solver's `churned` column came back int32, while the reference is int64. The brief never stated an integer width, so the spec had a gap. Pyodide is 32-bit, so a bare `int` is int32 in the browser but int64 on most laptops.
- **Fix:** added rule 7 (counts are int64) and the matching `int32-counts` variant (tests pass with the variant caught by all cases).
- **Blind solve, v2 (fresh solver, updated brief):** **3 of 3** cases.

### 3. Late deliveries by transport mode (chart, Visualization)

- **Rules (6):** one vertical bar series; categories alphabetical; bar height is the late rate; a title; the x-label mentions "mode"; the y-label mentions "rate".
- **Cases:** 3 total. Visible shipments (seed 7, 240 rows). Hidden: seed 8 (300 rows) and seed 9 (120 rows).
- **Wrong variants (8):** `horizontal-bars`, `line-chart`, `two-series` (rule 1); `counts-not-rates` (rule 3); `unsorted-categories` (rule 2); `no-title` (rule 4); `vague-x-label` (rule 5); `vague-y-label` (rule 6). Every variant is caught by at least two cases.
- **Blind solve:** solver's solution passed **3 of 3** cases. Note: matplotlib was not installed in the solver's sandbox, so the solver could not run it there. The grader ran it through the real figure check.

### Blind-solve process notes

- Each solver received a brief with only the ticket, rules, entry point, skeleton, and visible data. The brief contained no reference, no variants, and no hidden data. Solvers were told not to open any other file.
- One solver's report mentioned a stray call to create a session. The permission check denied it, and the solver did not retry. No session was created.

## e2e and axe results (Chromium here; Chromium and WebKit in CI)

**Chromium, local (this container):** 14 of 14 passing across the dev server (13 tests) and the production preview (2 CSP tests).

| Spec | Tests | Result |
|---|---|---|
| `engine.spec.ts` | buffer stop without restart; forced restart when the buffer is ignored; memory recycling on a threshold; load timeout message | 4 of 4 pass |
| `memory.spec.ts` | 45-run pandas soak | pass (see below) |
| `ticket.spec.ts` | axe and 390 px layout; Run and Submit with reference; wrong variant names its mistake; hints and solution unlock; pandas notebook table; notebook inline chart; chart task names a wrong type | 7 of 7 pass |
| `csp.spec.ts` (production preview) | production CSP grades a function; policy without `wasm-unsafe-eval` fails at once with a clear message | 2 of 2 pass |

**axe:** WCAG 2.0 and 2.1 A and AA tags on the first ticket. The test fails on serious and critical violations. It passes after fixes to the CodeMirror scroller (made keyboard-focusable) and to output scroll regions (made focusable with labels).

**Layout:** at 390 px the page has no sideways scroll (checked by document width).

**Memory soak (45 heavy pandas runs, Chromium):**

- Peak WebAssembly memory 74.9 MiB.
- The worker restarted once, at the 40-run heavy-run limit, and the session stayed bounded.
- The 256 MiB memory threshold was not reached by this workload. Its path is covered by the threshold test.

**CI, WebKit and Chromium:** the `ci` workflow runs the same end-to-end suites in both browsers. **Passed for `b0d8d7b`** (both browsers, all jobs green). That run is the Step 1 result.

## Anything you were unsure of, and deviations

**Unsure**

- **WebKit for the full app** has not run yet. The spike ran in WebKit, but the UI has not.
- **WebKit hang:** cause not diagnosed (see the diagnosis section).
- **Blind solves:** three solvers, one challenge each. Blind-solve agreement is a sample, not a proof. Hidden data was generated by the same generators that define the datasets, so a reader of the bundle could see the generator code.
- **Integer width:** bare `int` differs between Pyodide and native Python. Step 1 checked int64 explicitly. Step 2a replaced that with a kind-based comparison (any integer width matches, any float width matches) and removed the int32 variant (see `docs/audits/step-2a.md`).
- **Hidden data is not secret:** it is generated in the browser on Submit, so a determined learner with developer tools can see it. It is withheld from Run, not encrypted.
- **Memory numbers:** wasm memory is read through `pyodide._module.HEAPU8`, an internal field. The 256 MiB threshold was chosen from the spike's 196 MB post-check measurement, not from observed recycling in the app.
- **Stop during start-up** returns `Stopped.` without restarting, because the loop never started. This is intended; the restart path only applies to a running loop.

**Deviations**

- **jsDelivr is blocked** from this container, so Pyodide comes from the GitHub release. The CDN is not used at any point.
- **seaborn is not in the 314.0.7 release**, so the spike vendored its wheel. The product does not load seaborn yet.
- **Playwright pinned to 1.63.0** to match the preinstalled Chromium. `playwright-core` is overridden to 1.63.0 so axe and the test runner share one copy.
- **Churn spec changed after its first blind solve.** The rule and variant were added and the brief regenerated, then a fresh solver passed. The first solve is kept as a record.
- **Bundle size:** the main JavaScript is 639 kB (209 kB gzipped), mostly React and CodeMirror. Python packages load per challenge at runtime, not in the bundle. Splitting the editor into its own chunk is a later performance step.
- **Three grader kinds have no shipped challenge** (ml, api, testing). They are tested with fixtures in the unit suite, and the UI's sample set does not include them. Shipping challenges of those kinds is a later step.
- **Lesson content is not written.** Lessons are planned placeholders.
- **Quote checker not built in Step 1.** Built in Step 2a (`scripts/check-quotes.mjs`, the `docs-quotes` CI job).
- **Test hooks** exist only in the dev build and are reached through the dev server. The production build has none, and the scan checks this on every build.

## Test and check results, and push status

**Local (this container, at `b6cd456`):**

- `tsc --noEmit`: pass.
- `eslint .`: pass. The React block-body rule was verified to fire on a bad example.
- `vitest run`: 135 tests across 7 files, pass.
- `vite build` and `scripts/check-production-hooks.mjs`: pass. Scan covered 6 files with no hook names.
- Chromium end-to-end (dev and preview): 14 of 14, pass.

**Push:**

- `claude/busy-wright-rooppm`: `b6cd456` pushed. Commits this round: `d2750d4` (toolchain), `e5c7777` (engine), `410cd0a` (data, curriculum, save), `633ecad` (samples), `1caa6ca` (UI), `b6cd456` (e2e, CI, CLAUDE.md, spike results). Earlier this step: `de86faf`, `7a918df`, `170ce25`, `b1ee142`.
- All commits authored as Edward Torres. No pull request.
- **CI for `b0d8d7b`:** `ci` passed in every job, Chromium and WebKit. The first WebKit run that could have passed (`b6cd456`) was cancelled by a later docs-only push, so the Step 1 WebKit result is the one for `b0d8d7b`, which contains the cache fix. `e5936f9` failed in WebKit on a stale worker cache (a `304` reply dropped the isolation headers); `b0d8d7b` stops revalidating the worker script.
- **`main`:** created by fast-forward at `b0d8d7b`. HEAD equals `origin/main`.
- **Step 2a** starts from this state; its audit is `docs/audits/step-2a.md`.
