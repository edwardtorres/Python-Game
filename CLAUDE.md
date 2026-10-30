# CLAUDE.md: Python for Data, Larkspur Freight Analytics

An interactive game that teaches Python for data science and informatics, from the basics to entry-level data job readiness. Work arrives as tickets from invented Larkspur Freight colleagues. It is built in numbered steps, and each step ends with an audit at `docs/audits/step-N.md`, which the owner reviews before the next step starts.

## Stack

- Vite 8, React 19.3, TypeScript 5.9 in strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Tailwind 4 through `@tailwindcss/vite`.
- Editor: CodeMirror 6 with Python highlighting and indentation.
- Python engine: Pyodide 314.0.7 (CPython 3.14.2) in a dedicated Web Worker. It is self-hosted under `public/pyodide` by `scripts/fetch-pyodide.mjs`, which checks the release tarball's SHA-256 and copies only the core files and the wheels for the game's packages. Nothing loads from a CDN at runtime.
- No backend. Progress lives in localStorage under `larkspur.save`, with a versioned schema (v1) and migrations.
- Tests: Vitest 5 for unit tests (the grader runs under Pyodide in Node), Playwright 1.63 for end-to-end tests with axe. `playwright-core` is pinned to 1.63.0 through an npm override.
- Lint: ESLint 10 with typescript-eslint and react-hooks.

## Commands

```bash
npm run pyodide:fetch   # fetch and verify the pinned Pyodide release into public/pyodide
npm run dev             # dev server on 5173, with test hooks
npm run typecheck
npm run lint
npm test                # Vitest unit tests
npm run build           # type check, production build, then the test-hook scan
npm run e2e             # Playwright: dev server (Chromium and WebKit) and preview (production CSP)
```

## Git rules

- The author of every commit is Edward Torres <12915571+edwardtorres@users.noreply.github.com>. Set it per commit with `git -c user.name=... -c user.email=...`. The committer doesn't matter.
- Never rewrite pushed history.
- Work-in-progress commits are fine on the working branch, `claude/busy-wright-rooppm`.
- `main` moves only by fast-forward, after all checks and CI pass in both browsers. At the end of every step, confirm that HEAD equals `origin/main`.
- Never commit private links, session links, tokens, account IDs, or local paths. Commit trailers name no model and carry no session link.
- Do not open pull requests unless asked.

## Python engine decisions (Step 1)

Evidence: `spike/engine/RESULTS.md`, with the Chromium and WebKit numbers.

**Stopping a run is hybrid.** The client writes 2 to a shared interrupt buffer (`SharedArrayBuffer`). Python then raises `KeyboardInterrupt` inside the worker. If the worker does not confirm within **2 seconds**, the client terminates the worker and starts a new one, which costs a cold start.

**Deployment requirement: cross-origin isolation.** `SharedArrayBuffer` needs these headers on the page and on every asset:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-origin`

`vite.config.ts` sets them for the dev server and the preview server. The deployed host must set them too. Without them the buffer is unavailable and the client restarts the worker on every stop.

**Content-Security-Policy.** The production policy includes `script-src 'self' 'wasm-unsafe-eval'` and `worker-src 'self'`. Without `'wasm-unsafe-eval'`, Python cannot start, and a worker waiting for it would hang silently. The page therefore checks WebAssembly itself before starting a worker, and shows a clear error if it is blocked.

**Start-up and package timeouts.** The engine has 30 seconds to start and 60 seconds to load packages. Past either limit, the worker is terminated and the learner sees a specific message.

**Worker recycling.** Restart the worker only while idle, never during a run. Restart when WebAssembly memory passes **256 MiB**, or after **40 data-heavy runs** (runs that load pandas, matplotlib, or other packages). A restart costs a cold start, plus package reloads on the next run.

**Randomness.** Before each graded run, the grader reseeds Python's `random` and NumPy's global RNG to `20251030`, and it resets files, figures, and learner-imported modules from earlier runs. Each task may add its own seeds. Notebook sessions seed once when they start.

**Notebooks.** A notebook shares one namespace across its cells. Submit runs the imports and definitions from the cells in a fresh namespace. Top-level exploration is ignored, so a `print` in a cell cannot break grading.

## Grading rules

These apply to every graded item. Tests enforce them: `src/challenges/samples.test.ts` runs them against all samples.

- The reference passes every visible and hidden case, and the grader gives the same result when run twice.
- Every graded item has at least two wrong variants. Each variant has a mistake tag and an explanation, and breaks exactly one stated rule.
- Every stated rule has at least one wrong variant. Each variant is caught by at least two cases, and at least one variant fails on visible data.
- When a learner's output matches a wrong variant on the same cases, the feedback names that mistake.
- A Run uses visible cases and visible datasets only. A Submit uses all of them. Hidden data is generated only when Submit needs it.
- Messages for hidden cases never show inputs or expected values.
- Floats compare with a stated tolerance. pandas results compare with `pandas.testing`, with its rules stated per task.
- Chart tasks inspect the matplotlib figure object, never pixels. ML tasks score a hidden holdout set against a stated threshold, and the training function receives training data only.
- Structure checks use Python's `ast` module, never string matching.
- Hints come in three tiers: nudge, approach, partial code. The solution unlocks after three failed submissions, and a revealed solution earns reduced credit and never counts toward mastery.
- Write tasks get a bare skeleton (`pass`). Only fix-the-bug tasks get a broken starter.
- Before a graded item ships, a blind solver (a fresh agent that did not write the item) must agree with the reference on every dataset and test.

## Code rules

- Strict TypeScript. No `any`, and no unsafe lint suppressions.
- React effects always use block bodies. The lint rule `no-restricted-syntax` enforces it.
- Test hooks exist only in dev builds, through `__TEST_HOOKS__`. The production build replaces it with `false`, and `scripts/check-production-hooks.mjs` fails the build if any hook name reaches `dist/`. Do not put hook names in production code, not even as object keys.
- Self-hosted assets only, with no external origins at runtime. Code-split by feature and load libraries per chapter (partly done: the Python packages load per challenge; splitting the editor is a later step).
- Save: `larkspur.save`, schema 1. A save from a newer schema is kept as a backup and never overwritten. Every storage access is wrapped in try/catch, and the game still works without storage.
- Accessibility: axe runs on each main view in both browsers. The layout works at 390 px with no page-level sideways scroll.

## Testing

- **Unit (Vitest):** the grader running under Pyodide in Node (`src/engine/python.test.ts`), challenge coverage and reference checks (`src/challenges/samples.test.ts`), the engine controller with a fake worker and fake timers (`src/engine/client.test.ts`), generators with same-seed tests, the curriculum graph, save migrations, and progress rules.
- **End-to-end (Playwright):** ticket flows, the notebook, the chart task, a buffer stop, a forced restart (`?forceInterruptFailure=1`), memory recycling (`?recycleThresholdBytes=`), the load timeout, and the production CSP on the preview server. Chromium and WebKit run in CI. Chromium also runs locally.
- **Spike (not required):** `engine-spike` (the harness fails its job on any bad check) and `webkit-interrupt-diagnosis` (50 WebKit contexts, classified by stage) under `.github/workflows/`.

## Audits

- Each step's prompt is saved first to `docs/prompts/step-N.md`.
- Each step's audit is committed to `docs/audits/step-N.md`. Partial audits count too.
- Every heading from the step's prompt appears in the audit. If a section cannot be filled, its heading stays and the section says why.

## Competencies (curriculum)

The source of truth is `src/curriculum/data.ts`. Each competency is taught by a planned lesson. Lesson content arrives in later steps.

1. Foundations refresh: types and conversions, strings and f-strings, lists, dicts, sets, tuples, control flow, functions (defaults, `*args`, `**kwargs`), comprehensions, exceptions, `with` blocks, modules, iterators and generators.
2. Informatics fundamentals: classes, dataclasses, inheritance, dunder methods, Big-O basics, list vs dict vs set, deque and heapq, recursion, sorting with key functions, type hints, reading tracebacks and debugging.
3. Testing: assert statements, pytest-style tests, writing good test cases, test-driven fixes.
4. Files and formats: CSV, JSON, pathlib, datetime, regular expressions.
5. APIs and automation: requests with JSON, query parameters, pagination, HTTP status codes, rate limits and retries with backoff, timeouts, fetch-transform-save scripts.
6. NumPy: arrays, vectorization, broadcasting, boolean masks.
7. pandas: selecting and filtering, missing values, types, duplicates, string cleaning, groupby and aggregation, merges and joins, reshaping (pivot and melt), dates and time series, resample and rolling, method chaining, vectorized operations vs apply.
8. Visualization and reporting: matplotlib figures and axes, choosing the chart, labels and titles, seaborn where available, telling a story with a chart.
9. Statistics: descriptive statistics, distributions, sampling, correlation vs causation, A/B tests with scipy.
10. Machine learning basics: train/test splits, preprocessing pipelines, linear regression, classification, MAE and RMSE, accuracy, precision and recall, the confusion matrix, overfitting and cross-validation, data leakage, feature engineering.
11. Capstones and interviews: an end-to-end capstone, timed entry-level problem solving, a timed pandas screen.

## Roadmap

1. **Engine, curriculum, grader, three samples, UI, save v1, CI.** (This step.)
2. Foundations, informatics fundamentals, and testing content, with blind review.
3. Files, APIs and automation, NumPy, and pandas content.
4. Visualization, statistics, and ML content.
5. Capstones and timed interview problems, including an interview-only reserve.
6. The game loop: office map, ranks, XP, mastery and test-outs, readiness, badges.
7. Spaced review by mistake tag, Weak Spots, and timed interview mode.
8. PWA and offline (cache Pyodide and packages on first use), save protection, performance, Lighthouse.
9. Deploy to python.edwardtorres.dev, reusing the AWS pattern from the SQL app. This uses the account's third and last Free flat-rate CloudFront plan. Also: a weekly docs-quote check and a README.

Ranks run Analytics Intern, Junior Analyst, Analyst, Senior Analyst, Data Scientist I (proposed in the plan; the game loop step builds them).
