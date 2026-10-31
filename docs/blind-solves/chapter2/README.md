# Blind solves: Chapter 2

Each solver was a fresh agent that did not write the item. It saw only its batch brief (`briefs/`), which holds the ticket, the rules, the entry name, and the starter. The predict and traceback solvers also saw the code and the lettered options. Neither kind saw the references, the hidden cases, the wrong variants, the hints, or the mistake explanations. The solvers reported that they read only their brief and wrote only to their own scratch folder. The repository does not block a solver from reading other files, so this is a process rule that was followed, not an enforced one.

## Graded items (`solutions/`)

Each solution was run through the grader against every case, visible and hidden, in submit mode. `regrade.json` holds the results, and a permanent test (`src/content/blind-solves.test.ts`) keeps them current.

| Batch | Items | Result |
|---|---|---|
| G1 (guided) | loading order, dock totals, depth | 3 of 3 pass |
| G2 (tickets) | recent events, three heaviest, first seen | 3 of 3 pass |
| G3 (fix and structure) | longest first, nested total, hinted functions, queue popleft, smallest with heapq | 5 of 5 pass |
| G4 (boss) | rank rows, dispatch heap, flatten tags | 3 of 3 pass |
| G4 re-solve | report lines (after the ticket correction) | 1 of 1 pass |

### The report-lines item, solved twice

The first G4 solve of `c02-boss-report-lines` failed 4 of 5 cases. The ticket said each line reads `"dock: total kg"`, but the rule and the reference say `"dock: total"`. The solver followed the ticket, which was the content error. The ticket was corrected, and a fresh solver solved the corrected brief (`briefs/batch-G4-report-lines-r2.json`) and passed 5 of 5. The first solution is kept in `superseded/G4/` and is not regraded, because its brief no longer exists in that form.

The same solver also noted that "one line per dock" did not say whether a dock may repeat. The ticket now states that each dock appears in one row.

## Choice items (`predictions/`, `answer-key.json`)

Each predict or traceback solver read the code and chose an option by letter, without running anything.

| Batch | Items | Agreement |
|---|---|---|
| C1 | eight predict items | 8 of 8 |
| C2 | five traceback items | 5 of 5 |

## Rule notes from the solvers

These notes are rule choices the briefs leave open. None of them changed a result on the shipped cases. They are recorded for the owner to decide whether the rule text should say more.

- `loading_order` and `report_lines`: "A to Z" is plain code-point order, so uppercase sorts before lowercase. No case mixes case.
- `loading_order`: the brief does not say what happens when two parcels share a name. Each parcel gives one name.
- `dock_totals`: the brief does not say whether totals stay int or become float. Plain addition keeps the input type.
- `dock_totals`: a dock with zero-kg parcels still appears, because it appears in the input.
- `depth`: the brief does not say whether a tuple counts as a list. Only `list` is nested.
- `last_events` and `heaviest`: the brief does not say what a negative `n` means. The solvers return an empty list for any `n` of 0 or less.
- `first_seen`: the brief does not say whether names are stripped or case-normalised. They are compared exactly.
- `hinted_functions`: the brief gives no types, so the solver chose `list[float] -> float` and `str, float -> str`.
- `queue_popleft`: the brief does not say whether the input is a deque or a list.
- `smallest_three`: the brief does not state the output order. `nsmallest` returns ascending order, which is what the reference does.
- `report_lines`: `f"{x:.1f}"` rounds an exact tie to even (`2.25` becomes `2.2`). The brief does not say half-up, and no case hits a tie.
- `flatten_tags`: only `list` values are walked. Strings and tuples are single tags.
