# Step 2b audit: Chapter 2 (informatics fundamentals), Chapter 3 (testing), and the engine and UI they need

Date: 2026-10-31
Branch: `claude/busy-wright-rooppm`
Prompt: `docs/prompts/step-2b.md`
Status: **Chapter 2 and Chapter 3 are in the app. Every check passes locally. The browser end-to-end run passes in Chromium (34 of 34). The CI result for this step is in the section below. `main` moves only after CI passes in both browsers for the commit that carries this audit.**

## Part 0 gate

The gate was Step 2a-fix. Its audit is `docs/audits/step-2a-fix.md`, and its code commit `12aa0c3` passed CI in both browsers (run `41155013778`). `main` was at `7c22dcf` when Step 2b started, and that commit's CI passed in both browsers (run `41155845963`). The gate is met.

The owner did not supply a Step 2b prompt text. `docs/prompts/step-2b.md` records the decisions the owner made, as the plan presented them. This audit uses the headings of that file.

## Scope

Roadmap item 2 was split, and Step 2b covers the rest of it: Chapter 2 (informatics fundamentals, 11 competencies) and Chapter 3 (testing, 4 competencies). The owner's decisions were:

- Quotes come from the docs-snapshots branch for every doc-dependent claim, as in Step 2a-fix. Lessons with no quote are labelled "Demonstrated by the interpreter", with their example as the evidence.
- Counts, per the plan: Chapter 2 has 11 lessons, 13 practice items (8 predict, 5 traceback), 11 graded items (3 guided, 3 tickets, 2 fixes, 3 structure), and a four-part boss. Chapter 3 has 4 lessons, 5 practice items (3 predict, 2 traceback), 4 graded items (2 testing, 2 suite), and a four-part testing boss.

The counts as built:

| | Chapter 1 | Chapter 2 | Chapter 3 |
|---|---|---|---|
| Lessons | 13 | 11 | 4 |
| Practice items | 15 (10 predict, 5 traceback) | 13 (8 predict, 5 traceback) | 5 (3 predict, 2 traceback) |
| Graded items | 14 (4 guided, 5 tickets, 3 fix, 2 structure) | 11 (3 guided, 3 tickets, 2 fix, 3 structure) | 4 (2 testing, 2 suite) |
| Boss parts | 4 | 4 | 4 |

## Approach

The steps followed the plan, in order, each with its own commits:

- **Step 1, engine** (`cd00f5f`): structure checks `annotated_in`, `calls_method`, `forbids_method`, `calls_symbol`, `recurses_in`; `defines` and `within` reach classes and dotted method names; a testing grader with a scope filter, hidden-label redaction, and an opt-in per-test report; a suite grader; a NaN sentinel so NaN no longer matches None.
- **Step 2, shared types** (`dbde158`): the mistake taxonomy, the lesson and item types, and the output types move to `src/content/`. Chapter 1's recorded outputs stay byte-identical.
- **Step 3, registry and generalisation** (`ce55180`): `src/content/chapters.ts` holds the chapters. The routes take a chapter id, the boss is at `#/boss/<chapterId>`, the header lists every chapter, and the content and CPython checks run over every chapter.
- **Step 4, Chapter 1 amendments** (`5beacf7`): every graded case and structure check names the rules it checks. A wrong variant may fail only the cases that name its rule, and the content check enforces this. The no-strip variant is tagged `UNSTRIPPED_TEXT`. The two `parse_weight` variants that accepted nan and inf now keep the non-finite rule, so each breaks only its own rule. Unquoted lesson sections carry the "Demonstrated by the interpreter" label. The recorded blind solves of Chapter 1 are regraded by a permanent test.
- **Step 5, Chapter 2** (`061dc97`, record `c314a1f`).
- **Step 6, Chapter 3** (`37ebe68`, record `9526d23`).
- **Step 7, UI** (`9526d23`): the testing and suite kinds run through the same Run and Submit path. The `ChallengeView` first-visit effect no longer uses an `eslint-disable`; it reads the latest callback through a ref and keys on the stable spec. A testing item's solution view shows its model suite, not the correct implementation.
- **Step 8, end-to-end** (`00a0e1d`): `e2e/chapter-flows.ts` holds the shared flows. `e2e/chapter1.spec.ts` uses them, and `e2e/chapter2.spec.ts` and `e2e/chapter3.spec.ts` are new.
- **Step 9, audit and close**: this file, and `CLAUDE.md` updated for the commands, the chapters, the rule tags, and the testing items.

## Verification

Each step ran its own checks. The results are in "Test and check results" below. The checks that the plan named were:

- Step 1: `npx vitest run src/engine/python.test.ts`, the typecheck, and lint. Passed.
- Step 2: `git diff --stat src/content/generated` empty, and the Chapter 1 content tests pass. Passed.
- Step 3: the content tests, the Chapter 1 end-to-end spec in Chromium, and `cases.json` unchanged. Passed.
- Steps 4 to 6: the outputs regenerated, the CPython export regenerated, and `npm run check:py310` clean. The blind-solve regrades recorded. Passed.
- Steps 7 and 8: `npm run build` with the hook scan, and the chapter end-to-end specs in Chromium. Passed locally.
- Step 9: the full unit suite, `npm run check:py310-run` under the 3.11 scratch venv, push, and CI in both browsers (see the CI section).

## CI result for this step

The first CI run for the Chapter 2 record (`c314a1f`) failed in two jobs. Both are recorded here, with what was done.

- **docs quotes** (run `41159900076`): one quote failed the live check. `py-heap-root` quoted "The interesting property of a min-heap is that its smallest element is always the root, heap[0]." The heap page now says "The interesting property of a heap is that a[0] is always its smallest element". The quote was copied from the snapshot without a verbatim check, which is the error. Every one of the 50 quotes is now checked verbatim against its snapshot page by script, and the corrected quote is the snapshot sentence.
- **e2e (webkit)** (run `41159900076`): the production-build test `e2e/csp.spec.ts` ("loads Python under the production Content-Security-Policy and grades a function") timed out on the preview server, twice. Every other WebKit test passed, including the worker-start test under the production headers. The status of this failure on the current commit is in the CI status line at the end of this section.

CI for the code commit `00a0e1d` (run `41161186691`): **pending when this audit was written.** The status is recorded at the end of this section once the run finishes.

The diagnostic commit `4d3f7b4` (run `41162712628`) changes only `e2e/csp.spec.ts`. The test now waits for "Python ready" before it types, and on a failure it logs the page text, the engine stats, and the console and worker messages. The WebKit log of that run is the source for the cause of the timeout. Until it finishes, the cause is unknown.

## Engine and grader results (Steps 1 to 3)

- Structure checks: `annotated_in`, `calls_method`, `forbids_method`, `calls_symbol`, and `recurses_in` each have a pass test and a fail test in `src/engine/python.test.ts`, and `defines` and `within` have a class and method test. 36 engine tests pass in all.
- Testing grader: a scope filter (Run grades visible mutants only), hidden labels replaced by "A hidden bug" (the hidden mutant keeps its id as `hidden-<n>`), and an opt-in per-test report. Tests cover all three.
- Suite grader: owner test functions run one case each, a hidden test's message never reveals an input or an expected value, a variant matches on the pass and fail pattern, and an implementation that does not run reports a syntax error with its line.
- NaN: a learner that returns None does not match a variant that returns NaN. The test fails on the old code and passes on the new.
- Grader cases keep their results: the CPython check reports 0 mismatches on the Chapter 1 payloads, which are unchanged apart from their `rules` tags.

## Chapter counts, the mistake taxonomy, and the quote sources

- Mistake taxonomy: 89 tags, every one used by a lesson, a practice item, or a graded variant. The content check fails when a section names a tag that is not in the taxonomy.
- Quotes: 50 entries in `docs/quotes.json`. Every one is checked verbatim against its snapshot page by script. The live check in CI covers the same 50. Sources: the Python tutorial and library pages (classes, dataclasses, heapq, collections, functions, typing, glossary, stdtypes, errors, the data model, the sorting how-to), and the pytest assert how-to (Chapter 3).
- Lesson claims: 28 lessons and 53 sections. 37 sections are doc-dependent, and each cites its quote ids. The rest are labelled "Demonstrated by the interpreter" in the app.
- Recorded outputs: Chapter 1 has 23 examples and 15 practice items, Chapter 2 has 23 examples and 13 practice items, and Chapter 3 has 9 examples and 5 practice items.

## Blind-solve and source-pass results, with resolutions

Every graded item of Chapters 2 and 3 was solved by a fresh agent from its brief, and every practice item was chosen by letter from its brief. The briefs hold the ticket, the rules, the entry name, and the starter, and for practice items the code and the options. They hold no reference, no hidden case, no wrong variant, no hint, no mistake explanation, and for testing items no mutant, model suite, or weak suite.

**Chapter 2 (`docs/blind-solves/chapter2/`):**

| Batch | Items | First solve | Final |
|---|---|---|---|
| G1 guided | loading order, dock totals, depth | 3 of 3 | 3 of 3 |
| G2 tickets | recent events, three heaviest, first seen | 3 of 3 | 3 of 3 |
| G3 fix and structure | longest first, nested total, hinted functions, queue popleft, smallest with heapq | 5 of 5 | 5 of 5 |
| G4 boss | rank rows, dispatch heap, flatten tags | 3 of 3 | 3 of 3 |
| G4 report lines | after the ticket correction | 1 of 5 (first solve) | 5 of 5 (re-solve) |
| C1 predict | 8 items | 8 of 8 | 8 of 8 |
| C2 traceback | 5 items | 5 of 5 | 5 of 5 |

The report-lines item is the one that needed a resolution. The first solver followed the ticket, which said `"dock: total kg"`, while the rule and the reference say `"dock: total"`. The ticket was the content error, and it was corrected. A second fresh solver was given only the corrected brief, and passed 5 of 5. The first solution is kept under `superseded/` and is not regraded. A second ticket change then made explicit that each dock appears in one row, because the solver had noted that "one line per dock" did not say whether a dock may repeat.

**Chapter 3 (`docs/blind-solves/chapter3/`):**

| Batch | Items | Result |
|---|---|---|
| G5 testing and suite | tests for in_batches, tests for parse_weight, fix count_docks, fix median | 4 of 4 pass. Both test modules kill all 4 of their mutants. |
| G6 boss test parts | tests for clean_lines, count_words, top_words, report_lines | 4 of 4 pass. Every mutant is killed (3, 3, 3, and 2). |
| C3 predict and traceback | 5 items | 5 of 5 |

The permanent regrade (`src/content/blind-solves.test.ts`) grades every recorded solution for both chapters, and the Chapter 1 regrade remains as it was. All 15 Chapter 2 solutions and all 8 Chapter 3 solutions pass the current rules.

**Items added to the Chapter 1 record by this step.** The Chapter 1 G1 format-label solution, recorded in Step 2a, strips spaces only. It fails the tabs and line-breaks cases added in 2a-fix (4 of 6). That result is kept as recorded. The 2a-fix re-solve passes.

## Items shipped in Chapters 2 and 3, with hidden tests and wrong variants

Every graded item has at least two wrong variants. Each variant breaks exactly one rule, and every case names the rules it checks. A learner's failing case is therefore attributable to one rule. Examples:

- **c02-guided-depth** (recursion): a non-list value has depth 0 (variant `non-list-one` breaks it), and a list has one more than its deepest item (variant `no-plus-one` breaks it). The cases are visible and hidden.
- **c02-ticket-recent-events** (deque): wrong end, short-list slice, and a zero count are each a variant that breaks one rule.
- **c02-structure-queue-popleft**: `pop-zero` breaks the popleft rule, and `wrong-name` breaks the naming rule. Their checks name the function they inspect.
- **c03-testing-in-batches**: four mutants (reversed items inside a batch, a batch one item too big, an empty input that yields an empty batch, and a missing size check). Two are visible and two are hidden. The model suite kills each one with at least two test functions. The weak suite leaves the visible order mutant alive.
- **c03-testing-parse-weight**: four mutants, one per rule. The weak suite leaves the visible fallback mutant alive.
- **c03-suite-fix-median**: starts from the even-count bug. Three variants (lower middle, the mean, unsorted output) and a fourth (no value for an empty list) break the rules.
- **c03-boss-test-top-words**: the tie order, the lowest-first order, and one fewer pair than n, each a visible or hidden mutant.

Hidden mutant labels are not shown. A hidden owner test shows its label, as a hidden function case already does, and its message never shows an input or an expected value. The hidden test code is in the bundle, as the reference code already is, so this is an exposure the project already accepts for function items.

## e2e and axe results in both browsers

Locally in Chromium, the three chapter specs pass at both widths: 34 of 34. Each spec runs axe on each main view, and checks that the page does not scroll sideways at 390 px.

Two accessibility defects were found by these runs and fixed:

- **Editor colour contrast.** CodeMirror's default style colours special strings (the `f` of an f-string) `#ee4400`, which is 3.8:1 on white. Axe rejected the Chapter 2 lesson page. The editor now uses a complete highlight style with the same colours and a darker orange (`#a83a00`, 6.4:1) for those tokens. The style is complete rather than a fallback, because CodeMirror drops a fallback style once another highlighter is registered. `@lezer/highlight` is declared at the version already installed (1.2.5).
- **Keyboard access to sideways scroll.** A predict item's code block at 390 px scrolls sideways and was not focusable, so axe rejected it. The practice-item code block and the lesson output block now take keyboard focus.

WebKit: the chapter specs are in CI, which runs both browsers. The status is in the CI section above.

## Anything you were unsure of, and deviations

- **Blind solvers were fresh agents.** CLAUDE.md requires a fresh agent that did not write the item. The system guidance for this session discourages spawning agents without an explicit request, so this is recorded as a choice made to follow the project's rule. Each solver was told to read only its brief and to write only to its own scratch folder. The repository does not block a solver from reading other files, so that is a process rule, not an enforced one. The solvers reported that they read only their briefs.
- **Rule tags are a list, not one index.** The plan said "each graded case gets an optional `rule` index". A single index cannot satisfy "a variant fails only the cases that name its rule" for `format_label`. The `no-items-word` variant fails every case, and the strip cases also exercise the format rule. So each case lists every rule it depends on.
- **A predict option that raises is compared by exception type in the CPython check.** A printed option is compared exactly. Pyodide's messages differ from CPython's, so the check compares only the type. The traceback options were compared by type before this step, and this change extends the same rule to a predict option that raises.
- **`parse_weight` edge spellings.** The G5 solver also checked `NaN` and `-inf`, and a `None` value. The rule says `nan` and `inf`, so these go beyond its wording. The cases are unchanged.

### Open questions for the owner

1. **Function signatures are missing from the testing tickets.** The testing solvers assumed `in_batches(items, size)` and `top_words(counts, n)`, and assumed the return types of `count_words`, `clean_lines`, and `report_lines`. The shipped cases did not depend on those choices, so every solution passed. The recommendation is to state each signature in its ticket. A change to a ticket needs a fresh solve of that item.
2. **`count_docks` input shape.** The brief does not say each log entry is an exact dock name. The solver assumed so, from the starter's `len(log)`.
3. **`median` numeric type.** The brief does not say whether an odd count returns an int or a float. The solver returned the middle value as it was. The cases compare with `==`, so both types pass.
4. **`A to Z` order.** The rules mean plain code-point order, so uppercase sorts before lowercase. No case mixes case. The owner may prefer a case-insensitive reading, which would change the order for mixed-case names.
5. **`smallest_three` output order.** The brief does not state it. The reference returns ascending order, which is what `nsmallest` gives.
6. **`report_lines` rounding.** `f"{x:.1f}"` rounds an exact tie to even (2.25 becomes 2.2). The brief does not say half-up, and no case hits a tie.
7. From Step 2a, still open: the `in_batches` error raised on consumption rather than on the call, the embedded line break in `save_and_reload`, and the overflow reading of `parse_weight`.

### Other notes

- **Bundle size.** The production JavaScript grew to 847 kB (264 kB gzipped) with the two new chapters, because the chapter content is in the main bundle. Code-splitting by chapter is a later step, as the plan says.
- **Snapshot commits** are made by the workflow as Edward Torres, as in Step 2a.
- **Quote mistake.** One quote was copied without a verbatim check, and CI's live check caught it. Every quote is now checked by script before it is committed, and this is the rule for later steps.

## Test and check results, and push status

Local results on the current tree:

- `npm run typecheck`: pass. `npm run lint`: pass.
- `npx vitest run` (11 files): **464 tests pass**. This includes the Chapter 1, 2, and 3 content checks, the claims manifest, the Python grader tests, and the two blind-solve regrades.
- `npm run test:scripts`: 19 of 19 pass.
- `npm run build` (typecheck, production build, and the hook scan): pass. The scan finds no test hooks.
- `npm run check:py310`: 344 snippets, 0 problems.
- `scripts/py310/run-cases.py` under CPython 3.11.17 with the CI pins: **212 payloads and 132 snippets, 0 mismatches**. The CPython 3.10 check runs in CI, and that is the real 3.10 check.
- `npx playwright test e2e/chapter1.spec.ts e2e/chapter2.spec.ts e2e/chapter3.spec.ts --project=chromium`: **34 of 34 pass**.
- The quote check against the snapshots: 50 of 50 verbatim.

Push status: the code commit `00a0e1d` is pushed to `origin/claude/busy-wright-rooppm`. `main` is at `7c22dcf`, and it moves only after CI passes in both browsers for the commit that carries this audit.

**CI status:** pending for `4d3f7b4` (run `41162712628`), which was in progress when this file was produced. Recorded here once the run finishes.
