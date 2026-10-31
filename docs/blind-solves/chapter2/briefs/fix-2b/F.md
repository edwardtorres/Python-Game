# Blind solve brief: Chapter 2, guided functions and tickets (batch F)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c02-guided-loading-order: Guided: order parcels for loading

From Ravi, Outbound, subject "Loading order":

Write loading_order(parcels). parcels is a list of (name, kg) pairs, where name is text and kg is a number. Return the names in loading order, with the heaviest parcel first. Parcels with the same weight go A to Z by name, which is Python's default string order: uppercase sorts before lowercase.

Rules:
1. Return the names only, as a list.
2. The heaviest parcel comes first.
3. Parcels with the same weight are ordered A to Z by name.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def loading_order(parcels):
    pass
```

## c02-guided-dock-totals: Guided: weight per dock

From Jun, Dock Planning, subject "Weight per dock":

Each parcel is a (dock, kg) pair. Return a dict from each dock to the total kg of its parcels. An empty list gives an empty dict. Write dock_totals(parcels). parcels is a list of (dock, kg) pairs, where dock is text and kg is a number.

Rules:
1. Each dock maps to the total kg of its parcels.
2. An empty list gives an empty dict, not None.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def dock_totals(parcels):
    pass
```

## c02-guided-depth: Guided: how deep is a nested list?

From Lena, Data Quality, subject "Nesting depth":

A value that is not a list has depth 0. A list has one more than the deepest item inside it, so an empty list has depth 1. Write depth(value). value can be any value, including lists nested inside lists.

Rules:
1. A value that is not a list has depth 0.
2. A list has one more than the deepest item inside it, so an empty list has depth 1.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def depth(value):
    pass
```

## c02-ticket-recent-events: Ticket: keep the last events

From Omar, Gate Control, subject "Last events on the board":

Show the last n events, oldest first. If there are fewer than n events, show them all. A count of 0 shows nothing. Write last_events(events, n). events is a list of event strings, oldest first, and n is a whole number.

Rules:
1. Return the last n events, oldest first.
2. If there are fewer than n events, return all of them.
3. When n is 0, return an empty list.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def last_events(events, n):
    pass
```

## c02-ticket-three-heaviest: Ticket: the heaviest weights

From Priya, Loading, subject "Heaviest parcels first":

Return the n heaviest weights, heaviest first. A weight that appears twice counts twice. Write heaviest(weights, n). weights is a list of numbers, and n is a whole number.

Rules:
1. Return the n heaviest weights.
2. The heaviest comes first.
3. A weight listed twice counts twice.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def heaviest(weights, n):
    pass
```

## c02-ticket-first-seen: Ticket: each dock once, in order

From Sam, Yard Office, subject "Docks in order of arrival":

Return each dock name once, in the order it first appears in the log. An empty log gives an empty list. Write first_seen(log). log is a list of dock names as text, one per scan.

Rules:
1. Each dock name appears once.
2. The order is the order each name first appears.
3. An empty log gives an empty list, not None.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def first_seen(log):
    pass
```

Write your files into: docs/blind-solves/chapter2/fix-2b/F/
