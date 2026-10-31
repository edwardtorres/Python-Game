# Blind solve brief: Chapter 2, boss parts (batch E)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c02-boss-rank-rows: Boss part 1: rank the dock rows

From Dana, Dock Board, subject "Sort the dock rows":

Each row is (dock, name, kg). Sort the rows by dock, A to Z. Within a dock, the heaviest parcel comes first. Parcels with the same dock and weight go by name. Return "dock/name" strings in that order. Write rank_rows(rows). rows is a list of (dock, name, kg) tuples, where dock and name are text and kg is a number.

Rules:
1. Sort the rows by dock, A to Z.
2. Within a dock, the heaviest parcel comes first.
3. Parcels with the same dock and weight are ordered by name.
4. Return "dock/name" strings in that order.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def rank_rows(rows):
    pass
```

## c02-boss-dispatch-heap: Boss part 2: dispatch by priority

From Ines, Dispatch, subject "Dispatch order":

Each job is (priority, name). A lower priority number goes first. Jobs with the same priority go in the order they arrived. Return the job names in dispatch order. Write dispatch_order(jobs). jobs is a list of (priority, name) pairs, where priority is a whole number.

Rules:
1. A lower priority number goes first.
2. Jobs with the same priority keep their arrival order.
3. Return the job names only.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def dispatch_order(jobs):
    pass
```

## c02-boss-flatten-tags: Boss part 3: flatten the tags

From Leo, Parcel Tags, subject "Flat list of tags":

Tags arrive in nested lists of any depth. Return one flat list of the tags, in the order they appear. Empty lists add nothing. Write flatten_tags(items). items is a list whose elements are text or lists, nested to any depth.

Rules:
1. The tags keep their left-to-right order.
2. Lists nested at any depth are flattened.
3. An empty list adds nothing.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def flatten_tags(items):
    pass
```

## c02-boss-report-lines: Boss part 4: the dock report

From Farah, Board Report, subject "Report lines":

Write report_lines(rows). rows is a list of (dock, total kg) pairs, where dock is text and total is a number. Each dock appears in one row. Return one line per row, sorted by dock name A to Z, which is Python's default string order: uppercase sorts before lowercase. Each line reads "dock: total", where the total is formatted with f"{x:.1f}", one decimal place. Python rounds an exact tie to the even digit, so 2.25 is written as 2.2.

Rules:
1. Each line reads "dock: total", with the total formatted as f"{x:.1f}".
2. Lines are sorted by dock name, A to Z, with uppercase before lowercase.
3. Return a list of strings.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def report_lines(rows):
    pass
```

Write your files into: docs/blind-solves/chapter2/fix-2b/E/
