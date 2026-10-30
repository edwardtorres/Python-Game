# Blind solves: Chapter 1

Each solver was a fresh agent that did not write the item. It saw only its batch brief (`briefs/`), which holds the ticket, the rules, the entry name, and the starter. It did not see the references, the hidden cases, the wrong variants, the hints, or the mistake explanations.

## Graded items (`solutions/`)

Each solution was run through the grader against every case, visible and hidden, in submit mode.

| Batch | Items | Result |
|---|---|---|
| G1 (guided) | format label, count by mode, classify weight, in batches | 4 of 4 pass |
| G2 (tickets) | unique routes, route pairs, build label, parse weight | 4 of 4 pass |
| G3 (fix and structure) | with extra, first total, add stop, squares, countdown | 5 of 5 pass |
| G4 (boss) | clean lines, count words, top words, report lines | 4 of 4 pass |

Solver notes on ambiguous rules are in the handbacks summarised here:

- `format_label` solver stripped spaces only, not all whitespace. The reference uses `strip()`. No case depends on the difference.
- `in_batches` solver raised `ValueError` for a size below 1. No case uses a size below 1, and the rules do not say what should happen. This is left as a question for the owner (see the audit).
- `parse_weight` solver returned `None` for `nan` and `inf`. The reference returns the float. No case uses either value.
- Structure briefs (`batch-G3.json`) include the structure check labels, which restate the rules. Those two items were therefore not solved fully blind.

## Choice items (`predictions/`, `answer-key.json`)

Each predict or traceback solver read the code and chose an option by letter, without running anything. The answer key is `answer-key.json`. The solvers never saw it.

| Batch | Items | Agreement |
|---|---|---|
| C1 | five predict items | 5 of 5 |
| C2 | five predict items | 5 of 5 |
| C3 | five traceback items | 5 of 5 |

`report.json` holds the per-item grader results and the per-item letter comparison.
