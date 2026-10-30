# Step 1 prompt

Step 1: Set up a new interactive game that teaches me Python for data science and informatics, from basics to entry-level data job readiness plus strong foundations for university informatics coursework. Start in plan mode and show me the plan before writing code.

First, save this prompt to docs/prompts/step-1.md. At the start of every future step, save that step's prompt to docs/prompts/step-N.md, and build each audit from the prompt's requested headings.

CONTEXT
I'm an informatics student (transferring to UC Irvine) targeting junior data and cloud roles. My Python level is basics only (variables, loops, functions). I've built a SQL training game with the same process, so many rules below come from that project. I'll mostly play on a laptop, but the fundamentals chapters should also work on my iPhone. It should feel like a game, not a course site. It's built in steps, and each step ends with an audit I review before the next one.

STACK
Vite + React + TypeScript (strict) + Tailwind. No backend; progress is saved in localStorage with a versioned save schema and migrations. Vitest from the start.

GIT RULES (record these in CLAUDE.md)
- The author is Edward Torres at 12915571+edwardtorres@users.noreply.github.com; the committer doesn't matter. Never rewrite pushed history.
- Never commit private links, session links, tokens, account IDs, or local paths.
- Work-in-progress commits are fine on the working branch. main moves only by fast-forward after all checks pass and CI passes in both browsers. Confirm HEAD equals origin/main at the end of every step.

THE PYTHON ENGINE (decide with evidence first)
Use Pyodide (CPython in WebAssembly) in a Web Worker. Before building anything else, run a spike with the current Pyodide release:
- Measure cold start, then the load time and transferred size of each package on its own: numpy, pandas, matplotlib, scipy, scikit-learn, and (if available) seaborn. Measure memory with the full data stack loaded.
- Confirm in Chromium here and in WebKit through GitHub Actions (install with npx playwright install --with-deps): run pure Python, a pandas groupby, a matplotlib figure rendered to an image (Agg backend), a scikit-learn fit, and a simulated HTTP request (see the mock API below).
- Interrupting runaway code: compare (a) Pyodide's interrupt buffer, which needs SharedArrayBuffer and therefore cross-origin isolation (COOP/COEP headers), with (b) terminating and recreating the worker. Measure the recovery time for each, and recommend one. If you choose (a), record the COOP and COEP headers needed for deployment.
- Isolation: each run gets a fresh namespace. Design how module state, files written to the virtual filesystem, and matplotlib figures are reset between runs, and test it.
- Record CSP needs (for example 'wasm-unsafe-eval'). Self-host Pyodide and its packages: no CDN at runtime.
Report the numbers and decisions in the plan. If something core fails in WebKit, stop and tell me.

CURRICULUM (must cover all of this; organize into chapters with prerequisites)
1. Foundations refresh: types, strings and f-strings, lists, dicts, sets, tuples, control flow, functions (defaults, *args and **kwargs), comprehensions, exceptions, with blocks, modules, iterators and generators.
2. Informatics fundamentals: classes, dataclasses, inheritance, dunder methods; data structures and Big-O basics (list vs dict vs set, deque, heapq); recursion; sorting with key functions; type hints; reading tracebacks and debugging.
3. Testing: assert and pytest-style tests, writing good test cases, and test-driven fixes.
4. Files and formats: csv, json, pathlib, datetime, regex basics.
5. APIs and automation: requests with JSON, query parameters, pagination, status codes, rate limits and retries with backoff, timeouts, and small scripts that fetch, transform, and save data.
6. NumPy: arrays, vectorization, broadcasting, boolean masks.
7. pandas: selecting and filtering, cleaning (missing values, types, duplicates, strings), groupby and aggregation, merges and joins, reshaping (pivot, melt), dates and time series (resample, rolling), method chaining, vectorized operations vs apply.
8. Visualization and reporting: matplotlib figures and axes, choosing the right chart, labels and titles, seaborn where available, and telling a story with a chart.
9. Statistics: descriptive statistics, distributions, sampling, correlation vs causation, and A/B test basics with scipy.
10. Machine learning basics with scikit-learn: train/test splits, preprocessing pipelines, linear regression, classification, evaluation (MAE, RMSE, accuracy, precision, recall, the confusion matrix), overfitting and cross-validation, data leakage, and basic feature engineering.
11. Capstones and interviews: end-to-end projects (fetch from the mock API → clean with pandas → analyze → chart → model), plus timed screens (entry-level problem-solving and pandas tasks).
Each chapter maps to these competencies, with a few dialect-style notes where useful (for example how pandas operations relate to the SQL I learned).

THE GAME: LARKSPUR FREIGHT ANALYTICS
Continuity with my SQL game: after the data desk, I'm moved onto Larkspur Freight's analytics team. Work arrives as tickets and projects from colleagues. Use only invented names. Ranks progress from Analytics Intern to Data Scientist I (propose the ladder in the plan). Datasets are fictional and generated deterministically with seeds: shipments, sensor telemetry, customer churn, pricing experiments, and so on.

CHALLENGE TYPES AND HOW EACH IS GRADED
- Function tasks: my function runs against visible tests plus hidden tests (edge cases such as empty input, None, duplicates, and boundaries). Floats compare with a stated tolerance.
- pandas tasks: my resulting DataFrame or Series is compared with the reference on a visible dataset plus at least 2 hidden ones, using pandas.testing with rules stated per task (column order, index, dtypes, float tolerance).
- Chart tasks: graded by inspecting the matplotlib figure object (chart type, axis labels, title, number of series or bars, the plotted values), never by pixels.
- ML tasks: my training function receives only the training data. The grader scores the returned model on a hidden holdout set against a stated threshold, with fixed random seeds. Leakage is impossible by construction, and leakage-specific tasks check pipeline structure.
- API tasks: run against a simulated API inside the worker (deterministic JSON, pagination, 429 rate limits with Retry-After, occasional 5xx errors, timeouts) that records every call, so the grader can check paging, retries, and backoff behavior. No real network calls.
- Testing tasks: my tests must pass on the correct implementation and fail on each of several deliberately buggy versions (mutation testing).
- Structure checks: use Python's ast module (for example "must be vectorized, no Python loops" or "must use a list comprehension"), never string matching.
- Every graded item has at least 2 wrong variants based on real beginner mistakes, each tagged with a mistake type. When my output matches a wrong variant's output, show that mistake's targeted explanation alongside the normal feedback.
- Tiered hints (nudge → approach → partial code), and the solution unlocking after 3 failed attempts. Revealed solutions earn reduced credit and never count toward mastery.

EDITOR AND NOTEBOOK
- A Python editor (CodeMirror 6) with highlighting, indentation, and Run and Submit buttons.
- For data chapters, a notebook mode: multiple cells sharing one namespace, rich DataFrame display, inline charts, and printed output, like Jupyter.
- It works by tap and keyboard at 390 px with no page-level sideways scroll, even though I'll mostly use a laptop.

ACCURACY
Lessons cite the official docs (docs.python.org, numpy.org, pandas.pydata.org, matplotlib.org, scipy.org, scikit-learn.org, requests docs) with verbatim quotes checked by a script against the live pages. Behavior with no quotable sentence is shown as a runnable example labeled "Demonstrated by the interpreter." Never state an output that wasn't produced by running code.

RULES CARRIED OVER FROM MY SQL GAME (record these in CLAUDE.md)
- No graded item ships until a blind solver (a fresh agent that didn't write it) agrees with the reference on every dataset or test.
- Coverage rule: every rule a task states (edge cases, tie-breaks, rounding, missing values) has a wrong variant that violates exactly that rule, caught by at least 2 datasets or tests, and at least one wrong variant per item fails on the visible data.
- Write tasks get bare skeletons; only fix-the-bug tasks get a real broken starter.
- Debug and test hooks work only in dev builds, and a production scan proves it.
- React effects always use block bodies (enforced by lint).
- Self-hosted assets, no external origins at runtime; code-split by feature and load libraries per chapter.
- Commit Playwright e2e specs with axe from the first UI step; run Chromium locally and Chromium plus WebKit in CI on the working branch and main.
- Reviewers save results to files as they go, so a rate-limited run resumes without redoing work.
- Every audit includes every requested section. If one can't be filled, keep its heading and say why.

THIS STEP BUILDS
1. The engine spike and its report.
2. The curriculum as typed data, with tests (acyclic, reachable, every competency covered).
3. Deterministic dataset generators, with same-seed tests.
4. The grader core for every challenge type above, with thorough unit tests, including wrong-variant detection and the mock API's call recording.
5. Three complete sample challenges end to end, each blind-solved: a function task with hidden edge-case tests, a pandas task, and either a chart task or an ML task. They're playable in a minimal UI with the editor, and notebook mode for the data task.
6. Save schema version 1, CLAUDE.md with the stack, rules, competencies, and roadmap, and the CI workflow (Chromium and WebKit).

ROADMAP (later steps; don't build yet)
2. Foundations, informatics fundamentals, and testing content, with blind review.
3. Files, APIs and automation, NumPy, and pandas content.
4. Visualization, statistics, and ML content.
5. Capstones and timed interview problems (including an interview-only reserve).
6. The game loop: office map, ranks, XP, mastery and test-outs, readiness, badges.
7. Spaced review by mistake tag, Weak Spots, and timed interview mode.
8. PWA and offline (cache Pyodide and packages on first use), save protection, performance, and Lighthouse.
9. Deploy to python.edwardtorres.dev, reusing the AWS pattern from my SQL app (note: this uses my account's third and last Free flat-rate CloudFront plan), plus a weekly docs quote check and a README.

END OF STEP: AUDIT
Give me every section, under these headings:
- Engine spike: numbers and decisions (including the interrupt method and any COOP/COEP needs)
- Curriculum tree and competency coverage
- Datasets and generators
- Grader design and test results, by challenge type
- The three sample challenges, with hidden tests, wrong variants, and blind-solve results
- e2e and axe results (Chromium here; Chromium and WebKit in CI)
- Anything you were unsure of, and deviations
- Test and check results, and push status
Don't start Step 2 until I approve.
