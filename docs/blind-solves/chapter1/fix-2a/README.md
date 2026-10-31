# Blind re-solve: Step 2a fix

One fresh solver wrote four items after their rules changed in the Step 2a fix: `in_batches` (a size below 1 raises ValueError), `parse_weight` (nan and inf give None), `format_label` (whitespace, not spaces only), and `save_and_reload` (the new with-block ticket). The solver saw only `brief.json`, which holds the ticket, the rules, the entry name, and the skeleton. It did not see the references, the hidden cases, the variants, or the hints.

`report.json` holds the grader's result for each solution, run against every case, visible and hidden, in submit mode. All four pass: `in_batches` 7 of 7, `parse_weight` 9 of 9, `format_label` 6 of 6, and `save_and_reload` 5 of 5.

The solver's notes on ambiguous rules:

- `in_batches`: raised ValueError before the empty-input check, and returns a list of lists.
- `parse_weight`: also returns None for an infinite result from overflow (for example `1e400`), and accepts whatever `float()` accepts, such as surrounding spaces.
- `format_label`: uses `str.strip()`, which removes spaces, tabs, and line breaks, and always writes "items", even for a count of 1.
- `save_and_reload`: splits on `\n` only. A note with an embedded line break would not round-trip, and the brief does not say what should happen.
