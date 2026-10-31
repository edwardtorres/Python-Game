# Step 2b review audit (partial): WebKit csp, and the reconciliation with the prompt

Status at the time of writing: **Part 1 passes in both browsers. Parts 2 and 3 and Step 0 have not started.** The last CI run, on `ed19a38`, passed every job. A temporary five-run loop is still in the csp spec, and it comes out before the step's final commit. Each section below says what is done and what is not.

## The WebKit cause and fix

**What the CI logs show.**

- Run `41161368223` (commit `0870994`): the production-preview csp test failed in WebKit on both attempts. It waited 2 minutes for "Submitted. Every check passed." and never saw it. The test logged nothing else, so this run does not say why. Chromium passed.
- Run `41162712628` (commit `4d3f7b4`): its WebKit and Chromium e2e jobs were **cancelled** when I pushed `d3321c5`. The workflow sets `cancel-in-progress: true` for each ref, so a push cancels the run in progress. This run never reached the csp test's diagnostic output. The process rule that follows: no push while a run on the branch is in progress.
- Run `41163075343` (commit `d3321c5`): the csp test failed in both preview projects at the wait for "Python ready". The wait was wrong. The engine starts lazily, on the first grade (`src/engine/client.ts`, `ensureReady`), so "Python ready" never appears before the first Submit. The dump showed the engine idle, the starter code still in the editor, and no `WORKER created` line from the csp test.

**What the diagnostic showed.**

- Two kinds of item are refused on the editor page, in both browsers, under `style-src 'self'` in the production policy:
  1. CodeMirror's one injected style element. Its exact text hashes to `sha256-F46hirtH8PYJsIDsSPl2wePAnpACTrugnGsv136vcWU=`, the value Chromium reports for it.
  2. Inline `style` attributes that CodeMirror sets on its gutter elements, with heights and margins that change as the document grows. Their values are dynamic, so no hash can list them. Chromium states that hashes do not apply to style attributes.
- Locally in Chromium, against the production preview, the typed reference grades and shows `Submitted. Every check passed.`. The document text is correct once read from the DOM (`textContent`), not from the rendered text, which depends on styles.

**Fix.** The production `style-src` is now `'self' 'unsafe-inline'`. `script-src` keeps `'self' 'wasm-unsafe-eval'`. No hash is listed in the same directive, because browsers that support hashes ignore `'unsafe-inline'` when one is present. `e2e/csp.spec.ts` now fails if the production page refuses a style on the editor, in either browser. The owner chose allowing inline styles over keeping the policy.

**Results.**

- Run `41164449354` (commit `57dd154`): passed in both browsers. That run still had the refusals, and it read the editor's lines from the DOM before Submit. The WebKit test passed on its first attempt.
- Run `41171534718` (commit `ed19a38`): passed in both browsers, with the fix. The csp test ran without the DOM read and without the "Python ready" wait. The temporary loop repeated the typed-and-submitted flow five more times in each browser, and all five passed in Chromium and in WebKit.

**What the evidence shows, and what it does not.**

- With the refusals present and no DOM read, the WebKit csp test failed twice (run `41161368223`, commit `0870994`). With the refusals present and a DOM read, it passed once (`57dd154`). With the policy allowing styles and no DOM read, it passed six times in WebKit (`ed19a38`, the test and the five-run loop).
- The race explanation, that Submit is clicked before the typed text reaches the app, is not supported by these runs. The run that failed and the run that passed had the same typing and click sequence, and they differ in the policy. The style refusals fit the difference better.
- Not shown: how refused styles break WebKit's input. The runs show an association, not a mechanism. No separate run isolated the gutter attributes from the style element.
- The "Python ready" wait was a test error and is removed. That part is confirmed.

**Next step.** Remove the five-run loop before the final commit. The refusal check stays.

## The pytest decision

Not started. Facts recorded for the decision:

- The Pyodide lock (`public/pyodide/pyodide-lock.json`) lists `pytest` 9.0.2, `pluggy` 1.6.0, `iniconfig` 2.3.0, `packaging` 26.1, and `pygments` 2.20.0, all pure Python. `exceptiongroup` and `tomli` are listed too, and are needed only before Python 3.11.
- `scripts/fetch-pyodide.mjs` copies only the closure of `PACKAGES` (numpy, pandas, matplotlib, scikit-learn). A chapter 3 set would be added with each wheel's SHA-256 from the lock.
- The current testing runner (`exec` of `test_*` functions) stays until pytest works in Node and in both browsers.

## Efficiency items and margins in both browsers

Not started. The approved design uses wall-clock timing with a wide margin: the reference must finish under 50 ms at a fixed size, and the slow variant must take at least 50 times as long, measured in both browsers and recorded in CI. Candidates are `in` on a list versus a set, and `+=` on a string versus `"".join`. CPython can optimise `+=`, so that pair may not show the margin, and must be measured first. The "slow version times out" flow stops the variant with the existing buffer interrupt.

## Class items

Not started. Planned as function-kind items: the entry function returns built-in values, so `_same` never compares instances. Structure checks use `ast` (`decorated_with` for `@dataclass`, `defines` for dunders, `calls_method` for `super().__init__`).

## JavaScript notes (with counts)

Not started. Counts: chapter 2, 0 notes; chapter 3, 0 notes. `docs/quotes.json` still has 50 entries, unchanged. The owner's latest instruction adds JavaScript notes for chapters 2 and 3. That overrides the earlier "no JavaScript notes" decision. The notes need quotes verified against the snapshots.

## The owner decisions and changed tickets, with blind-solve results

Not started. Located so far (from reading the content, not yet edited):

| Decision | Where it lives | Status |
|---|---|---|
| `count_docks` states its signature and that each log entry is an exact dock name | `src/content/chapter3/graded-items.ts` (line 58) | not started |
| "A to Z" tickets say uppercase sorts before lowercase, with a mixed-case case and a `case-insensitive` wrong variant (4 tickets) | ch1 route list (`chapter1/graded-items.ts`, line 144); ch1 word count (line 492); ch2 loading order (`chapter2/graded-items.ts`, line 13); ch2 label order (line 188) | not started |
| `report_lines` states `f"{x:.1f}"`, adds a 2.25 → "2.2" tie case, a `rounds-half-up` wrong variant, and a round-half-to-even lesson note | `src/content/chapter2/boss-items.ts` (line 101). The ch1 `report_lines` (line 521) is another item with integer counts and is not changed | not started |
| `median` states that an odd count returns the middle value unchanged and an even count returns the mean as a float | ch3 suite-fix item (`chapter3/graded-items.ts`) | not started |
| `smallest_three` states ascending order | `chapter2/graded-items.ts` (line 300) | not started |
| `in_batches` raises when called, not on the first `next` (matching `itertools.batched`). Its reference is a generator (`yield`), so this needs a change of structure, a case, a `raises-lazily` wrong variant, and a generator-laziness lesson note | `chapter1/graded-items.ts` (lines 114 to 130) | not started |
| `parse_weight` states that `"1e400"` overflows to `inf` and returns `None`, and adds the case. The reference already does this | `chapter1/graded-items.ts` (line 232) | not started |
| `save_and_reload` states the exact text, including line breaks | `chapter1/graded-items.ts` (line 266) | not started |

Each changed ticket gets a fresh blind solve, batched as in Step 2b. Chapter 1 changes regenerate its outputs, the CPython 3.10 cases, and the Chapter 1 blind-solve regrades.

## e2e and axe results in both browsers

CI run `41171534718` on `ed19a38`, all five jobs passed:

- e2e (chromium): 50 passed, 1 skipped. This includes `preview-chromium` csp (the refusal check and the five-run loop) and workers.
- e2e (webkit): 50 passed, 1 skipped. This includes `preview-webkit` csp (the refusal check and the five-run loop) and workers.

Before the loop was added, run `41164449354` on `57dd154` had 49 passed and 1 skipped in each browser.

The new flows the review lists (class ticket, efficiency ticket that times out, test-writing ticket naming the missed mutant) are not written yet.

## Anything you were unsure of, and deviations

- **The prompt text was not in the transcript.** The review said the prompt was pasted above the message, but there was no pasted block. I asked the owner to paste it again, and the paste has not arrived. `docs/prompts/step-2b.md` is still the reconstruction, and Step 0 waits for the paste.
- **Two runs were cancelled by my own pushes.** Run `41162712628` was cancelled by `d3321c5`. The rule is recorded above.
- **The production style policy now allows inline styles.** This was the owner's choice between allowing them and keeping the policy. An injected style can restyle the page but cannot run code, and scripts keep the strict policy. The choice is recorded here so it stays visible.
- **A wrong hash was tried first, and never committed.** I added only the style element's hash, then a probe showed the refused items were style attributes. The change was reverted before the commit, so `ed19a38` carries only the final policy.
- **The temporary five-run loop is still in `e2e/csp.spec.ts`.** It comes out before the step's final commit.
- **The TimeComplexity page cannot be fetched directly.** `docs/snapshot-urls.txt` excludes `wiki.python.org/moin/TimeComplexity`, because its URL answers with a script redirect. A direct URL has not been found yet.
- **Efficiency margins use wall-clock time.** The grading rule asks for the same result on every run. The wide margin carries that rule, and the margin is recorded.
- **The `4d3f7b4` commit has no `Co-Authored-By` trailer.** It was already pushed, and CLAUDE.md forbids rewriting pushed history, so it stays. Later commits carry the trailer.
- **A repro script is in the session scratch folder,** not the repository. It runs the production csp flow in Chromium locally.

## Test and check results, and push status

Local, on the `ed19a38` change:

- `npx eslint e2e/csp.spec.ts vite.config.ts`, `npx tsc --noEmit`: pass.
- `npm run build` (type check, production build, hook scan): pass. The scan found no test hooks.
- `npx playwright test e2e/csp.spec.ts --project=preview-chromium` against the production preview: 3 passed, including the refusal check and the five-run loop.

CI on `ed19a38` (run `41171534718`): all five jobs passed. These are the docs quotes job, the types, lint, unit, build, and scan job, the CPython 3.10 job, and both e2e jobs.

Push status:

- `claude/busy-wright-rooppm` is at `ed19a38`, pushed. This audit update is committed on the same branch as the next commit.
- `main` is still at `7c22dcf`. It does not move while the step is open. Parts 2 and 3 have not started, Step 0 waits for the paste, and the five-run loop is still in the spec.
- HEAD does not equal `origin/main` yet. That is expected while the step is open.
