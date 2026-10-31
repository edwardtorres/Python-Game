# Blind solve brief: Chapter 3, testing and suite fixes (batch I)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c03-testing-in-batches: Tests for in_batches

From Yara, Dock Quality, subject "Tests for batching":

in_batches has been in use for a month. Write tests for it. Each test is a function whose name starts with test_, and it uses assert. The game runs your tests against the correct version of in_batches and against wrong versions of it. Write test functions for in_batches(items, size). items is a list and size is a whole number.

Rules:
1. A test checks the size of each batch.
2. A test checks that items keep their order, inside a batch and between batches.
3. A test checks an empty input.
4. A test checks that a size below 1 raises ValueError.

Write a Python module of test functions. Each test function name starts with test_, and it checks the function named by "entry" with assert statements. Do not define or import the function under test; it is provided when the tests run. Write tests that would catch the rules below.

Starter:
```python
def test_example():
    pass
```

## c03-testing-parse-weight: Tests for parse_weight

From Ravi, Scale Desk, subject "Tests for weight text":

parse_weight reads a weight typed at the scale. Write tests for it. It returns a float for a number, None for text that is not a number, and it raises TypeError for a value that is not text. Write test functions for parse_weight(text). text is a string.

Rules:
1. A test checks decimal text with spaces, such as " 4.5 ".
2. A test checks text that is not a number, which gives None.
3. A test checks that a value that is not text raises TypeError.
4. A test checks that nan and inf give None.

Write a Python module of test functions. Each test function name starts with test_, and it checks the function named by "entry" with assert statements. Do not define or import the function under test; it is provided when the tests run. Write tests that would catch the rules below.

Starter:
```python
def test_example():
    pass
```

## c03-suite-fix-dock-count: Fix: count the docks

From Mina, Yard Office, subject "Count the docks":

Write count_docks(log). log is a list of dock names, as text, with one entry per scan, and each entry is an exact dock name such as "Dock 1". Return how many different dock names appear in it. The owner tests run against your function, and the current code fails them.

Rules:
1. Count each dock name once, however often it appears.
2. An empty log has zero docks.
3. Names are compared exactly, so "Dock 1" and "dock 1" are different docks.

The starter is broken. Write a corrected version of the function named by "entry". Keep the signature.

Starter:
```python
def count_docks(log):
    return len(log)
```

## c03-suite-fix-median: Fix: the median of delivery times

From Oscar, Analytics, subject "Median delivery time":

Write median(values). values is a list of delivery times, as numbers. Sort the values. When the count is odd, return the middle value unchanged. When the count is even, return the mean of the two middle values as a float. An empty list raises ValueError. The current code fails the owner tests.

Rules:
1. Sort the values, and when the count is odd, return the middle value unchanged.
2. When the count is even, return the mean of the two middle values as a float.
3. An empty list raises ValueError.

The starter is broken. Write a corrected version of the function named by "entry". Keep the signature.

Starter:
```python
def median(values):
    return sorted(values)[len(values) // 2]
```

Write your files into: docs/blind-solves/chapter3/fix-2b/I/
