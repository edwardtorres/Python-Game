# Blind solve brief: Chapter 1, tickets (batch B)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c01-ticket-unique-routes: Ticket: unique routes

From Dev, Network Planning, subject "Route list for the board":

Write unique_routes(stops). stops is a list of stop names, as text, and it may repeat a name. Give the board each stop once, in A to Z order. A to Z means Python's default string order: uppercase letters sort before lowercase, so "Zed" comes before "amy".

Rules:
1. Each stop appears once.
2. The list is in A to Z order, with uppercase before lowercase.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def unique_routes(stops):
    pass
```

## c01-ticket-route-pairs: Ticket: route pairs

From Dev, Network Planning, subject "Legs of a trip":

A trip visits stops in order. Give one (from, to) pair for each leg. A trip with one stop has no legs. Write route_pairs(stops). stops is a list of stop names, as text, in the order of the trip.

Rules:
1. Each leg is a (from, to) pair, in trip order.
2. There is one pair for each pair of neighbouring stops.
3. A trip with one stop gives an empty list.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def route_pairs(stops):
    pass
```

## c01-ticket-build-label: Ticket: build a crate label

From Priya, Dock Operations, subject "Crate labels":

A label starts with the name. Tags go in brackets, in the order given. Options come last, as key=value, sorted by key. Write build_label(name, *tags, **options). name is text, tags are text values, and options are keyword arguments whose values are text or numbers.

Rules:
1. The name comes first.
2. Tags go in square brackets, in the order given, separated by ", ". No tags means no brackets.
3. Options are added as key=value, sorted by key.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def build_label(name, *tags, **options):
    pass
```

## c01-ticket-parse-weight: Ticket: read a weight

From Sam, Loading Bay, subject "Scanner weights":

Write parse_weight(text). text is the weight the scanner sent, as a string. The scanner sends weights as text. Return a float. Return None when the text is not a number, and also for nan and inf, which are not weights. Text such as "1e400" is too large for a float, so it overflows to inf and returns None. Any other input is a bug, so it must still raise TypeError.

Rules:
1. Text such as " 4.5 " gives the float 4.5.
2. Text that is not a number gives None.
3. A value that is not text raises TypeError.
4. Text that reads as nan or inf gives None, and so does text that overflows to inf, such as 1e400, because it is not a weight.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def parse_weight(text):
    pass
```

## c01-ticket-save-lines: Ticket: save and reload the batch notes

From Hana, Outbound, subject "Batch notes on disk":

Write save_and_reload(path, lines). path is the file name as text, and lines is a list of note strings. Write each note on its own line, with a line break after every note, the last one included. The file then holds exactly that text: ["Dock 1", "Dock 2"] is written as "Dock 1\nDock 2\n". Read the file back and return the notes as a list, without their line breaks. Use a with block for each open file, so each file is closed before the next step.

Rules:
1. Each note is written on its own line, and the file ends with a line break after the last note.
2. Reading the file back gives the notes without their line breaks.
3. An empty list of notes gives an empty list back.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def save_and_reload(path, lines):
    pass
```

Write your files into: docs/blind-solves/chapter1/fix-2b/B/
