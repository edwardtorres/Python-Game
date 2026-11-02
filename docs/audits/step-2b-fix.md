# Step 2b review audit

**Status.** The review's code and content changes pass CI in both browsers at `15c35e8` (run `41370176780`). This commit adds only this file. One item is still open: TimeComplexity (A4), see the deviations below.

## CI results

Run `41370176780` on `15c35e8`:

| Job | Result |
|---|---|
| types, lint, unit tests, build, production scan | Pass. Unit: 11 files, 507 tests. The build passed and the hook scan found no test hooks. |
| script tests and the static Python 3.10 check | Pass. 19 script tests, 0 failures. |
| docs quotes | Pass. 51 quotes, 0 failed, 0 warnings. |
| CPython 3.10 (every grading payload) | Pass. |
| e2e (chromium) | 53 passed, 1 flaky, 1 skipped. |
| e2e (webkit) | 54 passed, 1 skipped. |

The skipped test in both browsers is `e2e/capture-v1-save.spec.ts`. It runs only with `CAPTURE_V1=1`, by design.

**Flaky test, not fixed here.** In chromium, `e2e/workers.spec.ts` (second and third workers, production headers) failed once at 400 ms with "the built worker script was not found", and passed on retry. The test waits for the engine's status element, which always has text, so it reads the page's resource list before the worker script has loaded. This is a weak precondition that predates this step. It is recorded below as a known issue.

**Efficiency flow in both browsers.** The chapter 2 efficiency ticket (stock check: the slow `list-lookup` variant is graded too slow, its mistake is named, then the reference passes) passed at 390 px and 1280 px in both browsers. The efficiency measurement spec passed in both browsers.

**Other flows in both browsers.** The chapter 2 class ticket, the chapter 3 weak-suite and test-driven-fix flows, and the chapter 3 boss passed at both widths.

**Earlier runs in this step.**

- Run `41368215334` (`fd7fde6`): chromium failed only in the efficiency measurement spec. The job-queue reference measured over 50 ms, and repeated tickets measured 46 to 50 times at its visible size. WebKit passed. These findings drove the decisions below.
- Run `41246477878` (`3ace787`): the efficiency flow failed in both browsers at a 200,000-job queue, which was too fast for the budget message. Sized at 400,000 in `df29597`, and passed in CI.

**The WebKit csp failure (the first part of this step).**

- Run `41161368223` (`0870994`) and run `41163075343` (`d3321c5`) failed the production csp test in WebKit. Run `41162712628` (`4d3f7b4`) was cancelled when I pushed `d3321c5`, because the workflow cancels a run in progress for the same ref.
- The cause was in the production policy, not in the engine. `style-src 'self'` refused CodeMirror's injected style element and the inline style attributes it sets on its gutter elements. The "Python ready" wait was also a test error: the engine starts on the first grade.
- The fix is a production `style-src 'self' 'unsafe-inline'`, with `script-src` unchanged. Run `41171534718` (`ed19a38`) passed in both browsers with the fix.
- Not shown: how the refused styles break WebKit's input. The runs show an association, not a mechanism.

**Other parts of the step.**

- Pytest (A1): pytest 9.0.2 and its pure-Python dependencies load from the Pyodide lock for chapter 3 testing items only. `scripts/fetch-pyodide.mjs` checks each wheel's SHA-256. The testing and suite flows pass in both browsers.
- Class items (A3): three function-kind items (`c02-class-parcel-order`, `c02-class-pallet-inherit`, `c02-class-version-dunders`), with structure checks `decorated_with`, `subclass_of`, and `defines` within a class.
- JavaScript notes: chapter 2 has three (`js-object-keys`, `js-array-copy`, `js-object-identity`). Chapter 3 has two (`js-assert-truthiness`, `js-test-identity`). `docs/quotes.json` has 51 entries, all verified in CI.
- TimeComplexity (A4): **open.** No direct URL has been found. `docs/snapshot-urls.txt` leaves it out, because its URL answers with a script redirect.

## The job-queue decision and the measured margins

**Decision: the job queue is converted to untimed.** The owner's rule keeps a timed item only if the slow variant is at least 50 times slower and over the 1-second budget, while the reference stays under 50 ms, in both browsers. In run `41368215334` (`fd7fde6`), the reference measured 52.2 ms and then 51.2 ms in chromium, over the 50 ms ceiling. WebKit measured 49.3 ms, just under it. The rule fails in chromium, so the item converts.

The converted item, `c02-eff-job-queue`, has:

- Five behaviour cases: the four earlier untimed cases, plus a ten-job case.
- Two structure checks. `popleft` must be called within `running_totals`. `pop(0)` must not be called there: `forbids_method` with `arg: 0` forbids only a literal 0 as the first argument.
- Rule 3: "Keep the waiting jobs in a collections.deque, and take each job off its front with popleft." The wrong variant `list-front-pop` keeps its tag, `LIST_FRONT_POP`. It fails both checks, which name rule 3.

**Measured margins.** Each row is the slow variant divided by the reference, from the `EFFICIENCY` lines in the CI logs.

Before the change, run `41368215334` (`fd7fde6`):

| Item | Case | Browser | Reference | Slow variant | Ratio |
|---|---|---|---|---|---|
| Job queue (timed then) | visible | chromium | 52.2 ms | 5894 ms, over budget | 113x |
| Job queue | visible | chromium, retry | 51.2 ms | 5932 ms, over budget | 116x |
| Job queue | hidden | chromium | 43.5 ms | 5932 ms, over budget | 136x |
| Job queue | visible | webkit | 49.3 ms | 5886 ms, over budget | 119x |
| Job queue | hidden | webkit | 42.6 ms | 6026 ms, over budget | 141x |
| Repeated tickets (2000 visible) | visible | chromium | 0.7 ms | 35.6 ms | 50x |
| Repeated tickets | visible | chromium, retry | 0.8 ms | 35.9 ms | 46x |
| Repeated tickets | hidden (8000) | chromium | 2.2 ms | 582.1 ms | 266x |
| Repeated tickets (2000 visible) | visible | webkit | 0.5 ms | 35.1 ms | 76x |
| Repeated tickets | hidden (8000) | webkit | 2.2 ms | 534.3 ms | 241x |
| Stock check (2000 visible) | visible | chromium | 0.3 ms | 49.1 ms | 149x |
| Stock check | visible | chromium, retry | 0.4 ms | 49.5 ms | 134x |
| Stock check (8000 hidden) | hidden | chromium | 1.5 ms | 763.0 ms | 519x |
| Stock check | hidden | chromium, retry | 1.5 ms | 761.8 ms | 495x |
| Stock check | visible | webkit | 0.3 ms | 47.0 ms | 147x |
| Stock check | hidden | webkit | 1.4 ms | 744.1 ms | 532x |

After the change, run `41370176780` (`15c35e8`):

| Item | Case | Browser | Reference | Slow variant | Ratio |
|---|---|---|---|---|---|
| Repeated tickets (4000 visible) | visible | chromium | 0.8 ms | 102.4 ms | 128x |
| Repeated tickets | hidden (8000) | chromium | 1.2 ms | 408.5 ms | 331x |
| Repeated tickets (4000 visible) | visible | webkit | 1.1 ms | 133.6 ms | 117x |
| Repeated tickets | hidden (8000) | webkit | 2.3 ms | 526.0 ms | 229x |
| Stock check (2000 visible) | visible | chromium | 0.4 ms | 29.7 ms | 83x |
| Stock check | hidden (8000) | chromium | 1.0 ms | 458.4 ms | 477x |
| Stock check | visible | webkit | 0.4 ms | 46.6 ms | 117x |
| Stock check | hidden | webkit | 1.5 ms | 725.5 ms | 497x |

**What the numbers show.**

- Repeated tickets: the visible size moved from 2000 to 4000, because its ratio was 46 to 50 in chromium, under the 50x floor. The slow variant scans a slice on every step, so its time grows faster than the reference's, and the ratio rises with size. The hidden size stays at 8000.
- Ratios move between runs, because the reference takes 0.3 to 1.5 ms and timer noise shows in it. Stock check's chromium visible ratio was 149x and 134x in one run, and 83x in the next. Every ratio in the final runs is at least 83x, and every reference is under 50 ms.
- The efficiency flow now uses stock check. Its slow variant fails with a "took … ms" message on the visible case, not "ran past the budget". No timed item's slow variant runs past the 1-second budget now, so that message no longer appears in the browser flows.

## The chapter 3 rule-text fix and blind-solve results

- **`c03-testing-in-batches`.** Rule 4 says a size below 1 raises ValueError when the function is called, not when the batches are used. The reference was a generator, so its ValueError came on first use, and the rule and the reference disagreed. I changed the reference, not only the rule text: it now validates at call time, as the chapter 1 item does. I added a `raises-lazily` mutant (rule 4, hidden) and two call-time model tests, `test_size_zero_raises_on_call` and `test_size_zero_raises_on_call_with_no_items`. The model suite now kills every mutant with at least two test functions.
- **`c03-testing-parse-weight`.** Rule 4 says nan, inf, and text that overflows to inf, such as `1e400`, give None. The reference already returned None for all three, because `float("1e400")` is infinite, and a non-finite value gives None. Only the rule text changed.
- **Fresh blind solves (batch K).** `in_batches` passes 6 of 6, and `parse_weight` passes 5 of 5. The brief is `docs/blind-solves/chapter3/briefs/fix-2b/K.md`.
- **Superseded, not deleted.** `docs/blind-solves/chapter3/superseded/fix-2b-I/` holds the earlier solves for the two testing items. `superseded/G5/c03-testing-in-batches.py` wraps every call in `list()`, so it never checks the call-time rule, and the new mutant catches it (5 of 6). Its brief was written before the call-time wording.
- **Exception list: empty.** `src/content/blind-solves.test.ts` has no exception list. All 15 chapter 3 records in `regrade.json` pass.
- **Chapter 2 job queue (batches L and M).** The first fresh solve, L, used `itertools.accumulate`. It is correct and avoids `pop(0)`, but it never calls `popleft`, so it fails the structure check. Rule 3 did not say a deque with popleft was required, so the rule now says so. A fresh solve, M, written from the new brief, passes 7 of 7. L is kept in `docs/blind-solves/chapter2/superseded/fix-2b-L/`. The older H solve, written for the timed wording, still passes 7 of 7 and stays in the record.
- **Regrade totals.** Chapter 2: 37 of 37 pass. Chapter 3: 15 of 15 pass. Chapter 1: 38 of 39 pass. The one failing record, `solutions/G1/c01-guided-format-label.py` (4 of 6), predates this step and was already failing at `5d34c86`. Its fix-2a and fix-2b re-solves pass, and the test does not require it. I did not change it. See the deviations.

## The new unit tests

`src/engine/python.test.ts` gains 11 tests in three groups, run under Pyodide in Node.

- **Efficiency timing (3).** A learner as fast as the reference passes, and reports its timed cases only when asked. A correct learner far slower than the reference fails, and the message names the margin. A call over the budget stops as a timeout, and a hidden timed case says only that it is too slow.
- **Eager validation (3).** An eager learner passes an eager case. A lazy learner fails an eager case, because it returns a value where the reference raises. The same lazy learner passes a case that uses the batches, because the error is raised then.
- **Class structure checks (5).** `decorated_with` passes with the decorator, including a call with arguments, and fails without it. `subclass_of` passes with the base and fails without it. `defines` within a class finds a dunder method on that class and not one elsewhere. A function item with checks grades its cases and its checks together.

CI ran the full unit suite at `15c35e8`: 11 files, 507 tests, all passing.

## Anything you were unsure of, and deviations

1. **The Step 2b prompt.** `docs/prompts/step-2b-reconstructed.md` holds the reconstruction, and `docs/prompts/step-2b.md` is the same reconstruction, because the owner's prompt is not on any ref. The original is in the owner's chat. I did not wait for it.
2. **A rule changed after a blind solve.** The first fresh solve for the job queue failed on the structure check, because rule 3 did not state the deque requirement. I changed rule 3 and ran a new fresh solve, M, against the new text. L is kept in `superseded/`, and M is the record for the item.
3. **The reference changed, not only the rule text,** for `c03-testing-in-batches`. The reference had to match the rule. The new mutant and the model tests cover the change.
4. **Repeated-tickets visible size, 2000 to 4000.** The owner's margin rule was not changed. The size was, because chromium measured 46 to 50 times.
5. **Timed verdicts use wall-clock time.** The grading rule asks for the same result on every run. A timed verdict can change if a ratio sits near 50x. The final runs stay at 83x or more, which is the margin the rule relies on.
6. **The `pop(0)` check is exact only for a literal 0.** A learner who writes `queue.pop(i)` with `i` set to 0 in a variable is not caught. No wrong variant in the item does that.
7. **The efficiency flow uses stock check.** The flow no longer uses the job queue, which is untimed now.
8. **Known flaky test.** `e2e/workers.spec.ts` (chromium, preview) failed once and passed on retry, as described under CI results. Its wait accepts status text that is always present, so the test should wait for the worker resource before reading it. Not changed in this step.
9. **Chapter 1 record.** `solutions/G1/c01-guided-format-label.py` records 4 of 6. It is a Step 2a solve from before the 2a-fix rules, and its re-solves pass. The owner may want it moved to `superseded/`, so the record has no failing rows.
10. **TimeComplexity (A4) is open.** No direct URL has been found, so the complexity claims are not sourced to it.
11. **Earlier history.** Run `41162712628` was cancelled by my push `d3321c5`. I follow the rule now: no push while a run on the branch is in progress. Commit `4d3f7b4` has no `Co-Authored-By` trailer. It was already pushed, and CLAUDE.md forbids rewriting pushed history, so it stays.
12. **An earlier `create_session` call.** I could not confirm it from the transcript or the session list, and no child session from this run appears in the list. Nothing further is recorded about it.
13. **Commit grouping.** The commit `2c115d5` includes the chapter 3 G5 rename that was already staged. It has no content effect.
14. **Committer.** Commits are authored by Edward Torres. The committer is `Claude <noreply@anthropic.com>` for the commits in this step, as for the earlier commits on the branch. CLAUDE.md says the committer does not matter.

## Test and check results

At `15c35e8`, run locally before the push:

- `npm run typecheck` and `npm run lint`: clean.
- `npm test`: 11 files, 507 tests passing.
- `npm run test:scripts`: 19 passing.
- `npm run build`, with the type check, production build, and hook scan: passing, with no test hooks found.
- `npm run check:py310`: 385 snippets, 0 problems.
- `npx vitest run src/content/chapters.test.ts`: 332 passing.
- `UPDATE_BLIND=1`, then the blind-solve test without it: 6 of 6 passing.
- Local chromium, the efficiency measurement spec and the chapter 2 efficiency flow: 3 passing. Repeated tickets measured 94x visible and 132x hidden. Stock check measured 112x visible and 303x hidden.

CI at `15c35e8`, run `41370176780`: all six jobs passed. The results are under CI results above. WebKit ran only in CI.

## Push status

- `claude/busy-wright-rooppm` is pushed through `15c35e8`, a fast-forward from `fd7fde6`, and CI run `41370176780` passed.
- This audit is the next commit on the branch. Its CI run has to pass before `main` moves.
- `main` stays at `7c22dcf` until then. After it moves, HEAD should equal `origin/main`.
