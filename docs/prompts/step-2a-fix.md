# Step 2a fix prompt

Step 2a review. Save this prompt to docs/prompts/step-2a-fix.md. These items come before Step 2b.

1. Docs access: first check whether docs.python.org, wiki.python.org, numpy.org, pandas.pydata.org, matplotlib.org, docs.scipy.org, scikit-learn.org, requests.readthedocs.io, docs.pytest.org, and developer.mozilla.org are reachable from this session (I may have added them to the environment's allowed domains). If they're still blocked, build the fallback:
   - A GitHub Actions workflow (manual and on changes to a URL list file) that fetches each listed docs page, converts it to plain text the same way the quote checker does, and commits the text to a separate docs-snapshots branch with the URL and fetch date.
   - You read quotes from those snapshots via git, never from memory.
   - The docs-quotes job still verifies every quote against the live pages in CI.
2. Backfill Chapter 1 citations: add verified quotes for lesson claims that need a doc source (for example dict insertion order, integer vs float division, mutable default arguments, generator behavior, with statements), and ship the "If you know JavaScript" notes with verified Python docs and MDN quotes. Interpreter demonstrations remain fine for behavior claims.
3. Quote job: make docs-quotes fail when any lesson section with a doc-dependent claim has no quote, or when the quote file is empty while lessons exist.
4. Owner decisions, each with a new test case and a wrong variant under the coverage rule, then a blind re-solve:
   - in_batches: a size below 1 raises ValueError (matching itertools.batched).
   - parse_weight: nan and inf return None.
   - format_label: keep strip(); add a case with tabs and newlines, and a "strips spaces only" wrong variant.
5. Add at least one graded item for with blocks (for example writing and reading a file in the virtual filesystem with a context manager), with wrong variants under the coverage rule and a blind solve.
6. Record in CLAUDE.md, for the deploy step: the isolation headers (COOP, COEP, CORP) must be present on every response, including 304 Not Modified, and the deploy step must verify this on the live host.

Keep every check passing, push, fast-forward main after CI passes in both browsers, confirm HEAD equals origin/main, and commit the audit to docs/audits/step-2a-fix.md.

Audit headings: docs access result (allowlist or snapshot fallback); Chapter 1 citations and JavaScript notes added (with counts); the quote job change; the owner decisions and new items, with blind-solve results; anything you were unsure of, and deviations; test and check results, and push status.

Then start Step 2b from docs/prompts/step-2b.md (saving it there first if it isn't already). Its Part 0 gate now includes this fix step.
