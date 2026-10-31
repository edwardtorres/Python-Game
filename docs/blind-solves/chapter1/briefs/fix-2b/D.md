# Blind solve brief: Chapter 1, boss parts (batch D)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c01-boss-clean-lines: Boss part 1: clean the lines

From Edward, Analytics Lead, subject "Weekly word report (boss)":

Write clean_lines(lines). lines is a list of text lines. Remove spaces from both ends of each line, drop lines that are blank after trimming, and keep the lines in their original order. Each part is graded on its own.

Rules:
1. Remove spaces from both ends of each line.
2. Drop lines that are blank after trimming.
3. Keep the lines in their original order.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def clean_lines(lines):
    pass
```

## c01-boss-count-words: Boss part 2: count the words

From Edward, Analytics Lead, subject "Weekly word report (boss)":

Write count_words(lines). lines is a list of text lines. Words are separated by any whitespace, and counting ignores case, so "Dock" and "dock" count as one word. Return a dict from each word to its count. Each part is graded on its own.

Rules:
1. Words are separated by any whitespace.
2. Counting ignores case.
3. Return a dict from each word to its count.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def count_words(lines):
    pass
```

## c01-boss-top-words: Boss part 3: rank the top words

From Edward, Analytics Lead, subject "Weekly word report (boss)":

Write top_words(counts, n). counts maps each word (text) to its count (a whole number), and n is how many pairs to return. Return up to n (word, count) pairs, highest count first. Ties are ordered A to Z by word, which is Python's default string order, so uppercase sorts before lowercase. Clean the lines, count the words, rank the top words, and format the report. Each part is graded on its own.

Rules:
1. The highest count comes first.
2. Ties are ordered A to Z, with uppercase before lowercase.
3. Return at most n (word, count) pairs.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def top_words(counts, n):
    pass
```

## c01-boss-report-lines: Boss part 4: format the report

From Edward, Analytics Lead, subject "Weekly word report (boss)":

Write report_lines(pairs). pairs is a list of (word, count) pairs. Each line reads "word: count", and the order of the pairs is kept. Each part is graded on its own.

Rules:
1. Each line reads "word: count".
2. Keep the order of the pairs.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def report_lines(pairs):
    pass
```

Write your files into: docs/blind-solves/chapter1/fix-2b/D/
