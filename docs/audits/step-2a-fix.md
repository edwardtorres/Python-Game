# Step 2a-fix audit: docs access, citations, quote job, owner decisions

Date: 2026-10-31
Branch: `claude/busy-wright-rooppm`
Prompt: `docs/prompts/step-2a-fix.md`
Status: **Items 1 to 6 of the fix prompt are built and pushed. CI for the code commit `12aa0c3` passed in every job, in both browsers (run `41155013778`). This audit is committed on top of it, and `main` moves only after this commit's CI passes in both browsers. Step 2b starts after that.**

Commits: `eaf63de` (snapshot fallback and prompt), `a41eafe` (snapshot guard), `b4710af` (citations and quote job), `ffa890e` (owner decisions and with-block ticket), `017dd62` (CLAUDE.md), `a447dd0` (learner file writes stay out of the repository), `12aa0c3` (editor echo fix).

## Docs access result (allowlist or snapshot fallback)

**Result: blocked, so the snapshot fallback is built and running.**

- At 00:45 UTC the egress proxy refused all ten listed hosts with a 403 policy denial on CONNECT (`docs.python.org`, `wiki.python.org`, `numpy.org`, `pandas.pydata.org`, `matplotlib.org`, `docs.scipy.org`, `scikit-learn.org`, `requests.readthedocs.io`, `docs.pytest.org`, `developer.mozilla.org`). The proxy status endpoint recorded each denial. The proxy notes say a policy denial is reported, not routed around, so I did not try.
- Fallback: `.github/workflows/docs-snapshot.yml` runs on changes to `docs/snapshot-urls.txt` and on demand. It fetches each page, converts it with the quote checker's `visibleText`, and commits the text to an orphan `docs-snapshots` branch with the URL, the fetch time, and a SHA-256 of the HTML. `scripts/snapshot-docs.mjs` does the fetch.
- The first run (`41152089803`) returned 37 pages. One of them, the wiki TimeComplexity page, held 64 characters: it answered with a script redirect. `a41eafe` makes the snapshot fail any page with fewer than 200 characters of visible text, and removes that URL. The second run (`41153375140`, on `017dd62`) returned 36 pages, with no wiki page.
- Quotes were read from the snapshots with git (`git show origin/docs-snapshots:pages/...`), never from memory. Each quote was checked for an exact substring match against its snapshot page, and the check was repeated against the refreshed snapshot.
- The docs-quotes job checks every quote against the live pages in CI (`scripts/check-quotes.mjs`). It passed in run `41153582374` with **31 quotes, 0 failed, 0 warnings**. Every quote was verified live, not skipped.

## Chapter 1 citations and JavaScript notes added (with counts)

- **Quotes:** 31 entries in `docs/quotes.json`, from 17 pages: six Python tutorial pages (introduction, control flow, data structures, input and output, errors, modules), four Python library and reference pages (built-in types, built-in functions, expressions, glossary), and seven MDN pages (Truthy, Falsy, Number, Default parameters, Equality, Object.keys, Array.slice, and the JavaScript data types guide). Every quote is cited by at least one section or note, and no id is unused.
- **Sections:** 22 sections in Chapter 1. **18 are doc-dependent** (`docClaim: true`) and each cites one or two quotes. The other four make only behaviour claims, which the examples demonstrate.
- **JavaScript notes:** **7 notes in 5 lessons**: truthiness and division (types), key order (dicts), list copying (lists), `==` and identity (control flow), and default parameters and block scope (functions). Each note cites quotes from MDN and, where the Python side is a documentation claim, from the Python docs.
- **Lesson view:** each cited section shows its quotes with the source link, and a JavaScript notes block appears at the end of each lesson that has notes. Verified in the Chapter 1 Chromium spec (12 of 12, axe included).
- **Manifest:** `docs/lesson-claims.json` lists each section and note with its flag and quote ids. `src/content/claims.test.ts` keeps it in step with the lessons (regenerate with `UPDATE_CLAIMS=1`).

## The quote job change

`scripts/lib/quotes.mjs` has a new `validateClaims`. The `docs-quotes` job (`npm run check:quotes`) now fails when:

- the quote file is empty while lessons exist;
- a section flagged `docClaim` cites no quote;
- a JavaScript note cites no quote;
- a cited id is not in `docs/quotes.json`.

Five new tests in `scripts/lib/quotes.test.mjs` cover each case and the clean case: 19 script tests in total, all passing. The live check keeps its existing rules: a quote not on its page fails, a missing page fails, and a network error is retried and then reported as a warning.

Limit: the `docClaim` flags are written by hand, so a reviewer decides which sections need a citation. The job enforces the flags it is given, not whether a section should carry one.

## The owner decisions and new items, with blind-solve results

**`in_batches`: a size below 1 raises `ValueError`, as `itertools.batched` does.**
- The reference checks the size first. New rule 4 says so. Two new hidden cases (size 0 with parcels, and size 0 with none) expect the error.
- New variant `no-size-check` (tag `UNCHECKED_ARGUMENT`) breaks only rule 4.
- The three existing variants now include the size check, so each breaks only its own rule.

**`parse_weight`: `nan` and `inf` return `None`.**
- The reference returns `None` when the float is not finite, after the existing text checks. New rule 4 says so. Two new hidden cases (`'nan'` and `'inf'`).
- New variant `returns-non-finite` (tag `NON_FINITE_FLOAT`) breaks only rule 4.

**`format_label`: keeps `strip()`, adds a tabs-and-line-breaks case, adds a wrong variant.**
- Rule 2 now says whitespace: spaces, tabs, and line breaks. The reference still uses `strip()`.
- New visible case (`'\tAda\n'`) and hidden case (`'Bo\t \n'`).
- New variant `strips-spaces-only` (tag `PARTIAL_STRIP`) uses `strip(" ")` and breaks only rule 2.

**The with-block ticket: `c01-ticket-save-lines`.**
- A new graded item in the `with-blocks` lesson. It writes each note with a `with` block, reads the file back in a second `with` block, and strips the line breaks.
- Rules: each note on its own line, with a line break after the last; the read-back gives the notes without line breaks; an empty list gives an empty list.
- Five cases (two visible, three hidden). Three wrong variants, one per rule: `no-line-break` (tag `LINE_ENDINGS`), `keeps-line-breaks` (`LINE_ENDINGS`), and `blank-for-no-notes` (`TRUTHINESS`).

**Coverage.** The content test checks every rule, every variant (at least two failing cases each, and at least one visible failure), every tag, and every hint for all 14 items and the boss. It passes with 113 tests.

**New tags:** `UNCHECKED_ARGUMENT`, `NON_FINITE_FLOAT`, `PARTIAL_STRIP`, `LINE_ENDINGS`. The taxonomy has 41 tags, and each is used.

**Blind re-solve.** One fresh agent solved the four items (`in_batches`, `parse_weight`, `format_label`, and `save_and_reload`) from `docs/blind-solves/chapter1/fix-2a/brief.json`. It did not see the references, the hidden cases, the variants, or the hints. Grading each solution against every case, visible and hidden, in submit mode:

| Item | Result |
|---|---|
| `c01-guided-in-batches` | 7 of 7 pass |
| `c01-ticket-parse-weight` | 9 of 9 pass |
| `c01-guided-format-label` | 6 of 6 pass |
| `c01-ticket-save-lines` | 5 of 5 pass |

The solver's notes on ambiguous rules are in `docs/blind-solves/chapter1/fix-2a/README.md`. Two of them are open for the owner (see the deviations below).

**Deploy rule (item 6).** CLAUDE.md now requires the isolation headers (COOP, COEP, CORP) on every response, including `304 Not Modified`, and requires the deploy step to verify them on the live host.

## Anything you were unsure of, and deviations

- **Snapshot commits carry the owner's name.** The snapshot workflow commits as Edward Torres, because CLAUDE.md says the author of every commit is Edward Torres. It is still a workflow commit, not one made by hand.
- **Quotes were checked against the snapshots first.** The live check in CI passed for all 31 quotes, so the snapshot text matched the live text. A later docs change would show up as a CI failure, not silently.
- **`docClaim` is authored.** The job enforces the flags, not the judgement behind them. A reviewer decides which sections make a doc-dependent claim.
- **The wiki TimeComplexity page is not cited.** Its URL redirects with a script the fetch cannot follow. Chapter 2's Big-O items need another source, or demonstrations.
- **Open question for the owner, `in_batches`:** the reference raises `ValueError` only when the result is consumed, because the function is a generator. `itertools.batched` raises when it is called. The grader consumes the result, so the rule holds for the grader. Should the function raise at call time instead?
- **Open question for the owner, `save_and_reload`:** the solver split on `\n` only, so a note with an embedded line break does not round-trip. The brief does not say what should happen. The reference does the same.
- **Open question for the owner, `parse_weight`:** the solver also returns `None` for an overflow to infinity (such as `1e400`). The reference does too, through `math.isfinite`. Confirm that reading.
- **Not done in this step:** the "Demonstrated by the interpreter" labels on lesson claims that have no quote. CLAUDE.md requires them; they belong to the Step 2b plan's Chapter 1 amendments.
- **Engine fix found while building.** A learner's relative path resolved against the Node working directory, so the with-block ticket wrote `notes.txt`, `bay.txt`, and similar files into the repository root under the content test. `reset_runtime` now moves the working directory into `/home/pyodide`, which the browser already uses. The CPython check runs from a scratch folder. The stray files were deleted, and none was committed.
- **Editor race found by CI.** `CodeEditor` reported every document change through `onChange`, including the changes it made to match the `value` prop. A sync that ran while newer code was on its way could send the older code back. The boss test at 390 px hit this once in CI (run `41153582374`). Changes that come from the value prop are now marked with an annotation, and they don't call `onChange`. Learner edits still do. Fixed in `12aa0c3`.
- **Earlier subagent disclosure.** The Step 2a audit already records that one blind solver made an unneeded remote-session call, which the permission system denied. No new subagent issue came up in this step.

## Test and check results, and push status

**Local, on `a447dd0`'s tree:**

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run test:scripts`: 19 of 19 pass.
- `npm run check:py310`: 175 snippets, 0 problems.
- `scripts/py310/run-cases.py` under Python 3.11.17 with the CI pins: 114 payloads and 61 examples, 0 mismatches.
- `npx vitest run`: 10 files, 256 tests, all pass.
- `npm run build` with the hook scan: pass.
- `npx playwright test e2e/chapter1.spec.ts --project=chromium`: 12 of 12 pass (run before the working-directory change, which does not touch the UI).

**CI for `12aa0c3` (run `41155013778`):** success in every job, both browsers included.

**CI for `a447dd0` (run `41153582374`):** four of five jobs passed: `docs quotes` (31 of 31 quotes verified live, 0 failed, 0 warnings), `CPython 3.10`, `checks`, and `e2e (webkit)`. **`e2e (chromium)` failed once**, in the boss test at 390 px: part 3's editor showed the starter code after the test had set the reference. The cause and the fix are in the deviations below, in commit `12aa0c3`. The same boss test passed eight times in a row locally, before and after the fix, and the full Chromium suite passed after it.

**Push status:** `claude/busy-wright-rooppm` is at `12aa0c3` on the remote, with CI green in both browsers (run `41155013778`). This audit and `docs/prompts/step-2b.md` are committed on top of it. `main` is at `758e43d`, the Step 2a audit commit. It moves to this audit's commit only after that commit's CI passes in both browsers, and HEAD is then compared with `origin/main`.
