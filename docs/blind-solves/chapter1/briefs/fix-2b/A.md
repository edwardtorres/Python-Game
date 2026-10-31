# Blind solve brief: Chapter 1, guided functions (batch A)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c01-guided-format-label: Guided: format a label

From Priya, Dock Operations, subject "Labels for the pallet board":

Each pallet board line reads "name: count items". Trim spaces, tabs, and line breaks around the name. Write format_label(name, count). name is text, and count is a whole number.

Rules:
1. Return the name, then a colon, a space, the count, and the word items.
2. Remove whitespace from both ends of the name: spaces, tabs, and line breaks.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def format_label(name, count):
    pass
```

## c01-guided-count-by-mode: Guided: count shipments by mode

From Marcus, Route Planning, subject "Shipments per mode":

Each record has a "mode" key. Count how many records each mode has. An empty export gives an empty count. Write count_by_mode(records). records is a list of dicts, each with a "mode" key whose value is text.

Rules:
1. Count each record under its mode.
2. An empty list gives an empty dict, not None.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def count_by_mode(records):
    pass
```

## c01-guided-classify-weight: Guided: classify a parcel weight

From Sam, Loading Bay, subject "Weight bands":

Under 5 kg is light. From 5 to 20 kg, including both ends, is medium. Above 20 kg is heavy. Write classify_weight(kg). kg is a number, a whole number or a float.

Rules:
1. Under 5 kg is "light".
2. From 5 to 20 kg, including 5 and 20, is "medium".
3. Above 20 kg is "heavy".

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def classify_weight(kg):
    pass
```

## c01-guided-in-batches: Guided: send parcels in batches

From Hana, Outbound, subject "Batches of parcels":

Write in_batches(items, size). items is a list of parcels, and size is a whole number. Give the parcel list in batches of size. Each batch holds 1 to size items, in order. An empty list gives no batches. A size below 1 is a mistake: raise ValueError when the function is called, not when the batches are used.

Rules:
1. Each batch holds between 1 and size items, and the last batch may be shorter.
2. The items keep their order, both between batches and inside each batch.
3. An empty input gives no batches.
4. A size below 1 raises ValueError when the function is called, as itertools.batched does.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def in_batches(items, size):
    pass
```

Write your files into: docs/blind-solves/chapter1/fix-2b/A/
