# Blind solve brief: Chapter 3, testing items, rules updated (batch K)

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
4. A test checks that a size below 1 raises ValueError when the function is called, not when the batches are used.

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
4. A test checks that nan, inf, and text that overflows to inf, such as 1e400, give None.

Write a Python module of test functions. Each test function name starts with test_, and it checks the function named by "entry" with assert statements. Do not define or import the function under test; it is provided when the tests run. Write tests that would catch the rules below.

Starter:
```python
def test_example():
    pass
```

Write your files into: docs/blind-solves/chapter3/fix-2b/K/
