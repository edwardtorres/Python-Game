# Blind solve brief: Chapter 2, job queue, untimed (batch L)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c02-eff-job-queue: Efficiency: work through a job queue

From Tomas, Print Room, subject "Job queue":

jobs is the list of job weights, in the order the jobs arrived. It can have hundreds of thousands of entries. Work through them first in, first out. Return the running total after each job, in the same order. The total after a job includes that job. Write running_totals(jobs). jobs is a list of whole-number job weights, in the order they arrived.

Rules:
1. Return one running total per job, in the order the jobs were worked.
2. Each total includes its own job.
3. Take each job off the front without moving the jobs that wait behind it.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def running_totals(jobs):
    pass
```

Write your file into: docs/blind-solves/chapter2/fix-2b/L/
