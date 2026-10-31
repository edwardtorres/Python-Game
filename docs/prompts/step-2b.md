# Step 2b prompt

Note: the owner did not supply a Step 2b prompt text. This file records the decisions the owner made for Step 2b, as the plan presented them. If the owner sends a prompt text, it replaces this file before any code changes.

## Part 0 gate

Step 2a-fix covers the docs snapshot fallback, the quote citations and JavaScript notes, the quote job change, the owner decisions on `in_batches`, `parse_weight`, and `format_label`, the with-block ticket, and the CLAUDE.md deploy rule. Its audit is `docs/audits/step-2a-fix.md`. Step 2b starts once that audit's commit passes CI in both browsers and `main` is fast-forwarded to it.

## Scope

Roadmap item 2 is split. Step 2b covers the rest of it: Chapter 2 (Informatics fundamentals, 11 competencies) and Chapter 3 (Testing, 4 competencies). It follows the Chapter 1 rules and the blind-solve process.

- Quotes: the owner chose demonstrations only for Step 2b, but the Step 2a-fix cited quotes for Chapter 1. Chapter 2 and 3 cite quotes for doc-dependent claims, read from the docs-snapshots branch, as in Step 2a-fix.
- Counts, per the plan: Chapter 2 has 11 lessons, 13 choice items (8 predict, 5 traceback), 11 graded items (3 guided, 3 tickets, 2 fixes, 3 structure), and a boss of four function parts. Chapter 3 has 4 lessons, 5 choice items (3 predict, 2 traceback), 4 graded items (2 testing, 2 suite), and a boss of four testing parts.

## Approach

1. Engine: structure checks for type hints, methods, imports, and recursion; the testing grader gets a visibility filter and a per-test report; a suite grader for test-driven fixes.
2. Shared taxonomy and types move out of `src/content/chapter1/`, with no change to Chapter 1's outputs.
3. A chapter registry, one parameterised content test, one parameterised CPython 3.10 exporter, and the app routes by chapter id.
4. Chapter 1 amendments: a per-case rule tag so each wrong variant breaks exactly one rule, the "Demonstrated by the interpreter" labels on claims that have no quote, and a regrade of the Chapter 1 blind-solve solutions.
5. Chapter 2 content and six fresh blind solvers (four graded batches and two predict-only batches).
6. Chapter 3 content and three fresh blind solvers (two graded batches and one predict-only batch).
7. UI for the testing and suite kinds, and removal of the lint suppression in `ChallengeView`.
8. End-to-end specs for Chapters 2 and 3 at 390 px and 1280 px, by tap only, with axe.
9. Audit `docs/audits/step-2b.md`, CI in both browsers, and a fast-forward of `main`.

## Verification

Each step runs its own checks: the typecheck, the lint, the unit tests, the content tests with regeneration where needed, the static CPython 3.10 check, the CPython run under the 3.11 venv with the CI pins, the production build with the hook scan, and the Chromium end-to-end suite. CI runs both browsers.
