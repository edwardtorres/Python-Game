# Blind solve brief: Chapter 1, fixes and structure (batch C)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c01-fix-with-extra: Fix: add a parcel to the end

From Hana, Outbound, subject "Parcel appears in the wrong place":

with_extra should keep every parcel and add the new one at the end. The current code overwrites the last parcel, and it fails on an empty list. Write with_extra(items, extra). items is a list, and extra is the value to add at the end.

Rules:
1. The result keeps every item and adds extra at the end.
2. An empty list gives a list with only extra.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def with_extra(items, extra):
    items[-1] = extra
    return items
```

## c01-fix-first-total: Fix: total the first few parcels

From Marcus, Route Planning, subject "Totals skip a parcel":

first_total should add the first n weights. The current loop starts at the wrong index, so the first weight is missing. Write first_total(values, n). values is a list of numbers, and n is a whole number.

Rules:
1. Add up the first n values.
2. When n is 0, the total is 0.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def first_total(values, n):
    total = 0
    for i in range(1, n):
        total += values[i]
    return total
```

## c01-fix-add-stop: Fix: add a stop to a route

From Dev, Network Planning, subject "Stops leak between routes":

add_stop should start a new route when none is given. Right now stops from one route appear in the next. Write add_stop(stop, stops=[]). stop is text, and stops is a list of stop names; a call without stops starts a new route.

Rules:
1. The stop is added to the end of the list it is given.
2. A call without a list starts a new list.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def add_stop(stop, stops=[]):
    stops.append(stop)
    return stops
```

## c01-structure-squares: Structure: squares of odd values

From Hana, Outbound, subject "Odd weights, squared":

Write squares_of_odds(values). Use a comprehension, not a loop. Write squares_of_odds(values). values is a list of whole numbers.

Rules:
1. Define squares_of_odds.
2. Build the result with a comprehension, and use no for or while loop in the function.

Write the function named by "entry", with the signature shown in the starter. The rules say how the code must be written, so follow them literally.

Starter:
```python
def squares_of_odds(values):
    pass
```

## c01-structure-countdown: Structure: a countdown generator

From Marcus, Route Planning, subject "Countdown for the board":

Write countdown(n). It yields n, n-1, and so on down to 1. Use yield, and do not build a list. Write countdown(n). n is a whole number.

Rules:
1. Define countdown.
2. Produce the values with yield, and build no list.

Write the function named by "entry", with the signature shown in the starter. The rules say how the code must be written, so follow them literally.

Starter:
```python
def countdown(n):
    pass
```

Write your files into: docs/blind-solves/chapter1/fix-2b/C/
