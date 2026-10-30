# Blind solves: churn_by_region

Each round gave a fresh solver the brief only, then graded its solution with the grader in this repository. The solver did not write the sample.

| Round | Brief | Result | What changed after |
|---|---|---|---|
| 1 (Step 1) | `round-1/brief-v1.md` | Disagreed with the reference on integer width. The grader compared dtypes exactly. | Step 1 added rule 7 (counts are int64) and an int32 variant. |
| 2 (Step 1) | `round-2/v2-brief.md` | Passed: visible export and two hidden exports, 3 of 3. `round-2/grade-report-v2.json`. | Step 2a removed rule 7, the int32 variant, and the width check. The grader now compares integer widths by kind. |
| 3 (Step 2a) | `round-3/brief.md` | Passed: visible export and two hidden exports, 3 of 3. `round-3/grade-report-v3.json`. | None. This is the current sample. |

The round 3 solver's notes are `round-3/notes.md`, and its code is `round-3/solution.py`.
