# Blind solve brief: Chapter 2, fixes and structure (batch G)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c02-fix-longest-first: Fix: longest words first

From Hana, Labels, subject "Label order is backwards":

Write longest_first(words). words is a list of words, as text. Show the longest word first, and words of the same length go A to Z, which is Python's default string order: uppercase sorts before lowercase. The current code puts the shortest word first.

Rules:
1. The longest word comes first.
2. Words of the same length are ordered A to Z.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def longest_first(words):
    return sorted(words, key=len)
```

## c02-fix-nested-total: Fix: add up nested lists

From Noor, Finance, subject "Totals miss nested lists":

The total should add every number, including numbers inside nested lists. An empty list adds up to 0. The current code keeps only the last nested total. Write nested_total(values). values is a list whose items are numbers or lists of numbers, nested to any depth.

Rules:
1. Add up every number, however deeply it is nested.
2. An empty list adds up to 0.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def nested_total(values):
    total = 0
    for value in values:
        if isinstance(value, list):
            total = nested_total(value)
        else:
            total += value
    return total
```

## c02-structure-hinted-functions: Structure: annotate two functions

From Tomas, Reporting, subject "Hints for the report tool":

The report tool reads the type hints. Add them to total_weight and label_for so the tool can read each parameter and each result. Write total_weight(weights) and label_for(name, kg). weights is a list of numbers, and name is text and kg is a number.

Rules:
1. Define total_weight and label_for.
2. Annotate every parameter and the return value of each function.

Write the function named by "entry", with the signature shown in the starter. The rules say how the code must be written, so follow them literally.

Starter:
```python
def total_weight(weights):
    pass


def label_for(name, kg):
    pass
```

## c02-structure-queue-popleft: Structure: serve the queue from the front

From Bea, Gate 4, subject "Serve the queue in order":

Serve every parcel from a deque, front first, and return the parcels in the order they were served. Write serve_all(queue). queue is a list of parcels, in the order they arrived.

Rules:
1. Define serve_all.
2. Take each item from the front with popleft(), and do not use pop(0).

Write the function named by "entry", with the signature shown in the starter. The rules say how the code must be written, so follow them literally.

Starter:
```python
def serve_all(queue):
    pass
```

## c02-structure-smallest-heapq: Structure: three smallest with heapq

From Kenji, Warehouse, subject "Three lightest parcels":

Write smallest_three(values). values is a list of weights, as numbers. Return the three smallest weights in ascending order, lowest first. Use heapq.nsmallest, imported with from heapq import nsmallest, and do not sort the whole list.

Rules:
1. Define smallest_three.
2. Use heapq.nsmallest, imported with from heapq import nsmallest, and do not call sorted().

Write the function named by "entry", with the signature shown in the starter. The rules say how the code must be written, so follow them literally.

Starter:
```python
def smallest_three(values):
    pass
```

Write your files into: docs/blind-solves/chapter2/fix-2b/G/
