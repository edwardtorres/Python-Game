# Step 2a prompt

Step 1 is approved once the ci run for b6cd456 passes in both browsers (check it first and fix any failure). Then create main by fast-forward and confirm HEAD equals origin/main. Step 2 is split; this is 2a. Save this prompt to docs/prompts/step-2a.md. Start in plan mode and show me the plan before changing anything.

PART A: FIXES AND TOOLING
1. Integer and float widths: Pyodide is a 32-bit build, so a bare int gives int32 there, but on 64-bit machines current NumPy and pandas default to int64. Don't teach a browser artifact. Change the pandas grader to compare integer columns by kind (any signed integer width passes), and float columns by kind with the stated tolerance, unless a task explicitly declares a dtype rule. Remove the int32-counts wrong variant and rule 7 from the churn task, re-run its blind solve, and record the rule in CLAUDE.md.
2. Quote checker: build the verbatim docs-quote script (the SQL game's approach) now, for docs.python.org, numpy.org, pandas.pydata.org, matplotlib.org, scipy.org, scikit-learn.org, the requests docs, and MDN (for JavaScript comparison notes only). Add it to CI. It retries network errors and treats them as warnings.
3. Python version rule (record it in CLAUDE.md): lesson and reference code must run on Python 3.10 and later. Anything newer (for example 3.11+ syntax or library features) gets a "newer Python" label. Add a check that parses every reference and example with a 3.10 grammar target, or an equivalent check you propose.
4. seaborn: keep the vendored wheel (SHA-256 checked), loaded only in the visualization chapter after pandas and matplotlib. Record this in CLAUDE.md.
Push at the end of Part A.

PART B: CHAPTER 1, FOUNDATIONS REFRESH (13 competencies)
Plan the item counts in proportion to the competencies (roughly one lesson per competency, guided practice, independent tickets, and one multi-part boss), and show them in the plan.

Lessons: short sections with runnable, editable examples whose output comes from the interpreter; a "predict, then run" moment per section; common mistakes tagged with mistake types; and "If you know JavaScript" notes where Python differs (for example truthiness, integer vs float division, mutable default arguments, is vs ==, dict ordering, list copying, scope), citing Python docs and MDN with verified quotes or interpreter demonstrations.

Item types to use: function tasks with visible plus hidden tests, predict-the-output (always computed by running), fix-the-bug (the only type with a real starter), structure tasks (ast checks such as "use a comprehension"), and read-the-traceback items (run broken code and choose the cause, with the traceback computed).

Every graded item has:
- At least 2 wrong variants based on real beginner mistakes, each tagged (for example MUTABLE_DEFAULT, OFF_BY_ONE_RANGE, INT_DIVISION, ALIASING_COPY, TRUTHINESS, STR_IMMUTABLE, KEYERROR_VS_GET, EXCEPTION_TOO_BROAD).
- The coverage rule: every stated rule has a variant that violates exactly it, caught by at least 2 tests, with at least one variant failing on the visible tests.
- Tiered hints, the solution unlocking after 3 failures, and mistake-aware feedback.
- A blind solve before it ships.
Also add a source pass on every lesson claim and JavaScript note.

UI: a chapter page with its lessons, guided items, tickets, and boss, with progress saved per item (save version 2, with a migration tested on a real version 1 save captured from the current app).

CHECKS
- Extend the content check: references pass their tests; wrong variants follow the coverage rule; every variant is tagged; hints are present; write-task starters are skeletons; predict and traceback answers match a fresh run; and the Python 3.10 compatibility check passes.
- e2e (both widths, tap only, axe, Chromium here and both browsers in CI): read a lesson and run an example, answer a predict item, complete a function ticket with one wrong attempt showing its mistake feedback, a fix-the-bug ticket, a traceback item, and the boss.
Push at the end, fast-forward main after CI passes in both browsers, and confirm HEAD equals origin/main. Commit the audit to docs/audits/step-2a.md.

END OF STEP: AUDIT (every section, using these headings)
- CI result for b6cd456, and main creation
- Part A results (the dtype change and the churn re-solve, the quote checker, the Python 3.10 check, seaborn)
- Chapter 1 item counts and the mistake taxonomy
- Blind-solve and source-pass results, with resolutions
- 3 sample items (a function ticket, a fix-the-bug ticket, and the boss) with hidden tests and wrong variants
- e2e and axe results in both browsers
- Anything you were unsure of, and deviations
- Test and check results, and push status
Don't start 2b until I approve.
