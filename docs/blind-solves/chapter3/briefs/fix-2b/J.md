# Blind solve brief: Chapter 3, boss test parts (batch J)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c03-boss-test-clean-lines: Boss part 1: tests for clean_lines

From Ana, Report Desk, subject "Tests for clean_lines":

clean_lines prepares the lines of a report. Write tests for it, one test function for each rule the owner lists. The game runs your tests against the correct version and against wrong versions. Write test functions for clean_lines(lines). lines is a list of text lines.

Rules:
1. A test checks that spaces are removed from both ends of each line.
2. A test checks that lines blank after trimming are dropped.
3. A test checks that the lines keep their original order.

Write a Python module of test functions. Each test function name starts with test_, and it checks the function named by "entry" with assert statements. Do not define or import the function under test; it is provided when the tests run. Write tests that would catch the rules below.

Starter:
```python
def test_example():
    pass
```

## c03-boss-test-count-words: Boss part 2: tests for count_words

From Bea, Report Desk, subject "Tests for count_words":

count_words counts the words on the report lines. Write tests for it, one test function for each rule the owner lists. The game runs your tests against the correct version and against wrong versions. Write test functions for count_words(lines). lines is a list of text lines.

Rules:
1. A test checks that words are split on any whitespace.
2. A test checks that counting ignores case.
3. A test checks that the result is a dict from each word to its count.

Write a Python module of test functions. Each test function name starts with test_, and it checks the function named by "entry" with assert statements. Do not define or import the function under test; it is provided when the tests run. Write tests that would catch the rules below.

Starter:
```python
def test_example():
    pass
```

## c03-boss-test-top-words: Boss part 3: tests for top_words

From Cal, Report Desk, subject "Tests for top_words":

top_words picks the most common words for the report. Write tests for it, one test function for each rule the owner lists. The game runs your tests against the correct version and against wrong versions. Write test functions for top_words(counts, n). counts maps each word to its count, and n is how many pairs to return.

Rules:
1. A test checks that the highest count comes first.
2. A test checks that ties are ordered A to Z.
3. A test checks that at most n pairs are returned.

Write a Python module of test functions. Each test function name starts with test_, and it checks the function named by "entry" with assert statements. Do not define or import the function under test; it is provided when the tests run. Write tests that would catch the rules below.

Starter:
```python
def test_example():
    pass
```

## c03-boss-test-report-lines: Boss part 4: tests for report_lines

From Dev, Report Desk, subject "Tests for report_lines":

report_lines writes the report lines. Write tests for it, one test function for each rule the owner lists. The game runs your tests against the correct version and against wrong versions. Write test functions for report_lines(pairs). pairs is a list of (word, count) pairs.

Rules:
1. A test checks that each line reads "word: count".
2. A test checks that the order of the pairs is kept.

Write a Python module of test functions. Each test function name starts with test_, and it checks the function named by "entry" with assert statements. Do not define or import the function under test; it is provided when the tests run. Write tests that would catch the rules below.

Starter:
```python
def test_example():
    pass
```

Write your files into: docs/blind-solves/chapter3/fix-2b/J/
