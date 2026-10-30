# Step 2a audit: tooling fixes and Chapter 1 (Foundations refresh)

Date: 2026-10-30
Branch: `claude/busy-wright-rooppm`
Status: **Part A and Part B are built, pushed, and green in CI in both browsers (run 41142105362 for `bbe52ca`). This audit is committed on top of that. Main is fast-forwarded to this audit's commit only after its CI also passes in both browsers. Step 2b has not started; it waits for owner approval.**

Commits: Part A `a380601`..`21b7f07` (CI green, run 41136934213). Captured version 1 save `c645a69`. Part B `efcce8f`..`bbe52ca` (CI green, run 41142105362).

## CI result for b6cd456, and main creation

- `b6cd456` was the Step 1 commit whose WebKit run could have passed. A later docs-only push cancelled it, because the workflow cancels superseded runs. It never produced a WebKit result. This is disclosed in the Step 1 audit.
- The WebKit failure seen on `e5936f9` was a stale worker cache. A `304 Not Modified` reply dropped the isolation headers, so WebKit refused the worker on its second load. `b0d8d7b` sends `Cache-Control: no-store` on every response.
- CI for `b0d8d7b` passed in every job, Chromium and WebKit end to end (run 41127738417).
- `main` was created by fast-forward at `b0d8d7b`. HEAD equalled `origin/main` at that point.

## Part A results (the dtype change and the churn re-solve, the quote checker, the Python 3.10 check, seaborn)

**A1. Integer and float widths.** `_frame_problem` in `src/engine/python/grader.py` now compares with `check_dtype=False` by default, then compares dtype kinds per column: any integer width matches any integer width, and any float width matches any float width. `rules.dtype = "strict"` keeps exact dtypes. Four tests in `src/engine/python.test.ts` cover this: int32 against int64 passes, float32 against float64 passes, float against integer fails, and a strict task rejects int32 against int64.

The churn sample lost rule 7, the int32 wrong variant, and the width rule. Its blind solve was re-run in three rounds, recorded in `docs/blind-solves/churn-by-region/`:

| Round | Brief | Result |
|---|---|---|
| 1 (Step 1) | `round-1/brief-v1.md` | Disagreed with the reference on integer width. The grader compared dtypes exactly. |
| 2 (Step 1, with rule 7) | `round-2/v2-brief.md` | Passed 3 of 3 |
| 3 (Step 2a, updated brief) | `round-3/brief.md` | Passed 3 of 3 |

**A2. Quote checker.** `scripts/check-quotes.mjs` and `scripts/lib/quotes.mjs` fetch each cited page, strip tags, decode entities, collapse whitespace, and require the quote to appear verbatim. A quote missing from its page fails the job. A missing page (404 or 410) fails the job, because the citation is wrong. A network error is retried three times (2, 4, and 8 seconds) and then reported as a warning. The Node tests in `scripts/lib/quotes.test.mjs` (9 cases) pass in CI.

The `docs-quotes` job passed in run 41142105362. The job checks **zero quotes**, because `docs/quotes.json` is `[]`. See the deviations section.

**A3. Python 3.10 rule.** Two checks:

- **Check 1, static** (`scripts/check-py310.py`, run in the `checks` job on Python 3.12). It parses each snippet with `ast.parse(..., feature_version=(3, 10))`, rejects standard-library names newer than 3.10, and rejects nested same-quote f-strings. `feature_version` accepts the last of these, so a token check catches them on 3.12 and later. `scripts/lib/py310.test.mjs` (5 cases) passes. The snippets number 167, with 0 problems.
- **Check 2, run** (`scripts/py310/run-cases.py`, the `py310` job under CPython 3.10 with pandas 2.2.3, matplotlib 3.9.2, and NumPy 1.26.4). It runs every grading payload (106) and every lesson example and choice option (61), and compares each output with what the engine recorded. Messages are not compared, except that a traceback option compares the exception type only.

Results: the `py310` job passed in CI on the Part A payloads (run 41136934213) and on the Part B payloads, examples, and choice options (run 41142105362). Locally, the same check gave 0 mismatches on Python 3.11.17 with CI's pins, and 0 mismatches on Python 3.13.17 with the engine's pins. No Python 3.10 is installed in the container, so CI is the only 3.10 run.

**A4. seaborn.** `scripts/fetch-pyodide.mjs` downloads `seaborn-0.13.2-py3-none-any.whl` from PyPI and checks its SHA-256 (`636f8336facf092165e27924f223d3c62ca560b1f2bb5dff7ab7fad265361987`) before copying it to `public/pyodide`. CLAUDE.md records the chapter-8-only rule, and that a seaborn item's `requires` lists pandas and matplotlib first. No Chapter 1 item uses seaborn. The rule is not yet enforced by a test, because chapter 8 does not exist. See the deviations section.

**A5. Pin.** `pyodide` is pinned to exactly `314.0.7` in `package.json`, which matches the lock file.

**A6. Audit correction.** The Step 1 audit now records the green CI for `b0d8d7b` and the creation of `main`.

## Chapter 1 item counts and the mistake taxonomy

| Unit | Count | Notes |
|---|---|---|
| Lessons | 13 | One per competency, in curriculum order. 23 runnable examples, each with the prompt "Predict the output, then run it." |
| Predict items | 10 | Options are the printed output of variants, computed by running them |
| Traceback items | 5 | Options are the error type and message of variants, computed by running them |
| Guided items | 4 | Format label, count by mode, classify weight, in batches |
| Ticket items | 4 | Unique routes, route pairs, build label, parse weight |
| Fix-the-bug items | 3 | Add a parcel, total the first parcels, add a stop. Only these start from broken code. |
| Structure items | 2 | Squares of odd values (a comprehension and no loop); countdown (yield and no list) |
| Boss | 1 | Four graded parts, in order: clean the lines, count the words, rank the top words, format the report |

The item count is 15 choice items, 13 graded items, and the boss's four parts, which makes 17 graded specs. Items total 29 (15 + 13 + the boss). With 13 lessons, the units total 42. The plan's "42 items" counted lessons; see the deviations section.

Wrong variants: 44 across the 17 graded specs (2 to 4 each), and 23 across the 15 choice items.

**Mistake taxonomy.** 37 tags, defined once in `src/content/chapter1/mistakes.ts`. Each has a title and an explanation. All 37 are used by lessons, choice items, or graded variants. The content test fails if a variant or a section names a tag that is not in the taxonomy.

**Coverage per competency.** Every competency has a lesson, and every lesson has a runnable example. Predict and traceback items cover types, lists, dicts, sets, tuples, control flow, functions, iterators and generators, exceptions, and modules. Graded items cover strings, dicts, control flow, iterators and generators, sets, tuples, functions, exceptions, lists, and comprehensions. `with` blocks have a lesson and examples, but no item.

## Blind-solve and source-pass results, with resolutions

**Blind solves.** Seven fresh agents, none of which wrote the items. Each saw only a brief in `docs/blind-solves/chapter1/briefs/`: the ticket, the rules, the entry name, and the starter. They did not see the references, the hidden cases, the variants, the hints, or the answer key.

- **Graded (four solvers, 17 specs):** every solution passes all of its cases, visible and hidden, in submit mode. **17 of 17 pass.** The two structure briefs included the check labels, which restate the rules. Those two were not solved fully blind.
- **Predict and traceback (three solvers, 15 items, no code run):** **15 of 15 agree** with the computed answer.
- **Solver notes on ambiguous rules, and how each was resolved:**
  - `in_batches`: the solver raised `ValueError` for a size below 1. The reference does not. The rules do not say what should happen. **Open question for the owner.** No case uses a size below 1.
  - `parse_weight`: the solver returned `None` for `nan` and `inf`. The reference returns the float. **Open question for the owner.** No case uses either value.
  - `format_label`: the solver stripped spaces only, not all whitespace. The reference uses `strip()`. No case depends on the difference.
  - `count_words` and `clean_lines`: the solvers used the literal reading of "spaces" and "whitespace", and the cases agree.

The record is in `docs/blind-solves/chapter1/`. It holds the briefs, the solutions, the predictions, the grader's report, the answer key, and a README.

**Source pass.** Every lesson section has at least one example. Every example's output is recorded in `src/content/generated/chapter1.outputs.json`, and the content test fails if a fresh run differs from it. The content test also fails if any example raises. All 23 examples run cleanly. Lesson claims are therefore demonstrations, and each section's examples show them.

**JavaScript notes: none shipped.** See the deviations section.

## 3 sample items (a function ticket, a fix-the-bug ticket, and the boss) with hidden tests and wrong variants

**Function ticket: unique routes (`c01-ticket-unique-routes`).** Rules: each stop appears once; the list is in A to Z order.

- Reference: `return sorted(set(stops))`.
- Visible cases: a stop listed twice; no stops.
- Hidden cases: `['Yard', 'Gate', 'Yard', 'Bay']`, which gives `['Bay', 'Gate', 'Yard']`; `['b', 'a', 'c', 'a', 'b']`, which gives `['a', 'b', 'c']`.
- Wrong variant `keeps-repeats`: `sorted(stops)`. Tagged SET_ORDER_ASSUMPTION. It breaks rule 1 only, and it fails three cases, one of them visible.
- Wrong variant `first-seen-order`: `list(dict.fromkeys(stops))`. Tagged DICT_ORDER_ASSUMPTION. It breaks rule 2 only, and it fails the visible repeat case.
- A learner who submits `keeps-repeats` sees "Likely mistake: A set is not a list" and "Mistake type: SET_ORDER_ASSUMPTION".

**Fix-the-bug ticket: add a parcel to the end (`c01-fix-with-extra`).** The starter is broken: `items[-1] = extra` then `return items`. It overwrites the last parcel, and it fails on an empty list.

- Reference: `return [*items, extra]`.
- Visible cases: `[1, 2]` with 3; an empty list with `'x'`.
- Hidden cases: `['a']` with `'b'`; `[5, 6, 7]` with 8; an empty list with 0.
- Wrong variant `drops-last`: `items[:-1] + [extra]`. Tagged SLICE_DROPS_LAST. It fails the visible case and the hidden cases with one item and three items.
- Wrong variant `adds-at-front`: `[extra, *items]`. Tagged INSERT_AT_FRONT.
- Wrong variant `empty-returned`: returns an empty list unchanged. Tagged TRUTHINESS. It fails the empty-list cases.

**Boss (`c01-boss-*`).** One item, four graded parts, each checked on its own. Part 2 opens only after part 1 passes, and the same holds for parts 3 and 4.

- **Part 1, clean the lines.** Visible: padding and a blank line; an empty list. Hidden: lines of spaces; lines out of order. Wrong variants: `keeps-blanks` (TRUTHINESS), `no-trim` (STR_IMMUTABLE), `sorted-output` (SORTED_CHANGES_ORDER).
- **Part 2, count the words.** Visible: `Dock dock`; an empty list. Hidden: a tab and double spaces; capitals. Wrong variants: `case-sensitive` (CASE_SENSITIVE_KEYS), `split-on-space` (SPLIT_ON_SPACE), `pairs-not-dict` (CONTAINER_SHAPE).
- **Part 3, rank the top words.** Visible: ties and a leader; fewer words than n. Hidden: ties already in order; reversed ties; more words. Wrong variants: `ties-in-dict-order` (DICT_ORDER_ASSUMPTION), `ascending` (SORTED_CHANGES_ORDER), `one-short` (OFF_BY_ONE_RANGE).
- **Part 4, format the report.** Visible: two pairs; an empty list. Hidden: one word; ties in report order. Wrong variants: `no-colon` (FORMAT_SPEC), `reversed` (REVERSED_ORDER).

## e2e and axe results in both browsers

**Chapter 1 spec (`e2e/chapter1.spec.ts`):** six flows at 390 px and 1280 px, by tap only (`hasTouch`). The flows are a lesson with its example, a predict item, a traceback item, a function ticket with a wrong attempt, a fix-the-bug ticket, and the four-part boss. Each main view runs axe at the WCAG 2 A and AA levels and a sideways-scroll check.

- **Chromium, locally (dev):** 12 of 12 pass.
- **Chromium, CI (dev and preview, run 41142105362):** `e2e (chromium)` passed.
- **WebKit, CI (dev and preview, run 41142105362):** `e2e (webkit)` passed, which includes the Chapter 1 spec.

**Full end-to-end suite:**

- **Chromium, locally (dev and preview):** 27 passed, 1 skipped. The skip is `capture-v1-save.spec.ts`, which runs only with `CAPTURE_V1=1`.
- **Chromium and WebKit, CI (run 41142105362):** both jobs passed.

**Axe:** the Step 1 flows and the Chapter 1 views report no serious or critical violations in either browser, in CI. The one colour-contrast failure found during the build (the "Marked as read" button) was fixed by using a darker green.

## Anything you were unsure of, and deviations

**Deviations**

- **No JavaScript notes shipped.** The plan asked for "If you know JavaScript" notes, each citing MDN or the Python docs with a verified quote. The docs hosts return 403 from this session's proxy. I verified this and did not work around it. The search excerpts I could reach were paraphrases, not page text. I did not write quotes from memory, because the rule is that a quote comes from the page and CI checks it. Adding a note needs a verbatim quote that the `docs-quotes` job can verify.
- **`docs/quotes.json` is empty**, so the `docs-quotes` job checks zero quotes. The job runs and passes, but it verifies nothing yet.
- **The item count.** The plan's "42 items" counted lessons. The units are 29 items plus 13 lessons.
- **The chapter-8 seaborn rule is not enforced by a test.** Chapter 8 does not exist yet, and no item uses seaborn. The rule is recorded in CLAUDE.md.
- **Structure briefs revealed the check labels** to the blind solvers. The labels restate the rules.
- **Predict items** are answered by clicking an option. "Run to check" then runs the code. The plan's "predict, then run" moment is the prompt on each lesson example.
- **Blind solver process.** One blind solver made an unneeded call to a remote-session tool. The permission system denied it, so no session was created. Nothing else outside its brief and output folder was touched.

**Found and fixed while building**

- **Notebook cells failed without pandas or matplotlib loaded.** The renderer imported both for every cell, so a learner's first cell in a session could fail. It now checks `sys.modules`, which the lessons exposed.
- **A starter could overwrite code set just after mount.** `ChallengeView`'s first-visit effect wrote the starter unconditionally. It now writes only into an empty editor. The end-to-end boss and fix-the-bug tests hit this race.
- **Structure tasks did not name their mistakes**, because the grader returned no matches for them. They now match each wrong variant by its check results.
- **Generator results compared as objects.** A generator-returning function could never match its reference. Results are now materialised first, and a reused generator gives an empty list.
- **Contrast failure** on the "Marked as read" button. Changed to a darker green.

**Unsure**

- Whether `in_batches` should reject a size below 1, and whether `parse_weight` should accept `nan` and `inf`. Both are owner decisions, and neither is covered by a case.
- Whether the `docs-quotes` job should fail when it checks zero quotes. It currently passes.
- The chapter-8 seaborn rule has no test yet.

## Test and check results, and push status

**Local, at `bbe52ca` (working tree clean):**

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run test:scripts`: 14 of 14 pass.
- `npm run check:py310`: 167 snippets, 0 problems.
- `scripts/py310/run-cases.py` under Python 3.11.17 with CI's pins: 106 payloads and 61 snippets, 0 mismatches. Under Python 3.13.17: 0 mismatches.
- `npx vitest run`: 9 files, 250 tests, all pass. This includes the Chapter 1 content check (109 tests) and the save migration from the real version 1 save.
- `npm run build` with the hook scan: pass.
- Chromium end-to-end, dev and preview: 27 passed, 1 skipped.

**CI for `bbe52ca`, run 41142105362:** all five jobs passed. These are `docs quotes`, `types, lint, unit tests, build, production scan`, `CPython 3.10 (every grading payload, verdicts against the engine)`, `e2e (chromium)`, and `e2e (webkit)`.

**Push status:**

- `claude/busy-wright-rooppm`: Part A at `21b7f07`, Part B at `bbe52ca`, both pushed.
- This audit is committed on top of `bbe52ca` and pushed. Its CI result is checked before main moves.
- `main`: will be fast-forwarded to this audit's commit after its CI passes in both browsers. HEAD will then be compared with `origin/main`.
