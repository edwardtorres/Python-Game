# Blind solves: Chapter 3

Each solver was a fresh agent that did not write the item. It saw only its batch brief (`briefs/`). A testing solver wrote a test module from the ticket and rules, and a suite solver wrote a corrected function from the broken starter. The predict and traceback solver saw the code and the lettered options. None saw the reference, the model or weak suites, the mutants, the owner tests, the hints, or the mistake explanations. The solvers reported that they read only their brief and wrote only to their scratch folder. The repository does not block a solver from reading other files, so this is a process rule that was followed, not an enforced one.

## Graded items (`solutions/`)

A testing solution passes when its suite passes the correct function and kills every mutant. A suite solution passes when its function passes every owner test. `regrade.json` holds the results, and the permanent test in `src/content/blind-solves.test.ts` keeps them current.

| Batch | Items | Result |
|---|---|---|
| G5 (testing and suite) | tests for in_batches, tests for parse_weight, fix count_docks, fix median | 4 of 4 pass; both test modules kill all 4 of their mutants |
| G6 (boss test parts) | tests for clean_lines, count_words, top_words, report_lines | 4 of 4 pass; every mutant killed (3, 3, 3, 2) |

## Choice items (`predictions/`, `answer-key.json`)

The predict and traceback solver read the code and chose an option by letter, without running anything.

| Batch | Items | Agreement |
|---|---|---|
| C3 | three predict items, two traceback items | 5 of 5 |

## Open rule notes from the solvers

These are gaps in the briefs. The solvers filled them with reasonable choices. The shipped cases did not depend on those choices, so every solution passed. They are open for the owner to decide, and they should be fixed in the tickets before the items are used with learners.

- **Function signatures are missing from the testing tickets.** A testing item calls the function by its entry name, but the brief does not say its parameters. Solvers assumed `in_batches(items, size)` and `top_words(counts, n)`, and assumed `count_words` takes a list of line strings and returns a dict. The tickets should state each signature. Changing a ticket means a fresh solve of that item.
- **Return types are not stated.** `clean_lines` and `report_lines` return a list in the reference, but the brief does not say so. The tests wrapped results in `list()`, which accepts a generator as well.
- **`count_docks` input shape.** The brief does not say each log entry is an exact dock name. The solver assumed so, from `len(log)` in the starter.
- **`parse_weight` edge spellings.** The solver checked `"NaN"` and `"-inf"` as well as `"nan"` and `"inf"`, and checked a `None` value. The rule says `nan` and `inf`, so these go beyond the literal wording.
- **`median` numeric type.** The brief does not say whether an odd count returns an int or a float. The solver returned the middle value as it was.
