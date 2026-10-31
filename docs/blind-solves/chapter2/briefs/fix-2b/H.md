# Blind solve brief: Chapter 2, classes and efficiency (batch H)

You are a fresh solver. You have not seen this game before, and you see only this brief.

Rules for you:
- Read only this file. Do not open any other file in the repository, and do not look for a reference, tests, or answers.
- Write one Python file per item below, into the folder named at the end of this brief. Name each file <item-id>.py.
- The code must run on CPython 3.10 and later, and it may use only the standard library.
- Write only the file contents. Do not explain them in the file.

## c02-class-parcel-order: Class: order parcels with a dataclass

From Dana, Loading, subject "Lightest first":

rows is a list of (kg, name) pairs. Write a dataclass named Parcel with two fields, kg first and then name, and sort the parcels so that the lightest comes first. Parcels with the same weight are ordered A to Z by name. Return the names in that order. Write lightest_names(rows).

Rules:
1. Return the names only, as a list.
2. The lightest parcel comes first.
3. Parcels with the same weight are ordered A to Z by name.
4. Parcel is a dataclass whose fields are kg, then name, so the weight decides the order.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def lightest_names(rows):
    pass
```

## c02-class-pallet-inherit: Class: a pallet is a parcel with a count

From Lena, Pallets, subject "Pallet totals":

rows is a list of (kg, name, count) triples. Parcel is a plain class that stores kg and name. Write Pallet as a subclass of Parcel that adds count, with a total_weight method that returns kg times count. Return a (name, total) pair for each row, in the order the rows were given. Write pallet_totals(rows).

Rules:
1. Return (name, total) pairs, in the order the rows were given.
2. Pallet inherits from Parcel, and its __init__ sets kg and name through Parcel.
3. The total is kg times count, not kg plus count.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def pallet_totals(rows):
    pass
```

## c02-class-version-dunders: Class: versions with __repr__ and __lt__

From Sam, Releases, subject "Version order":

pairs is a list of (major, minor) numbers for each release. Write a class Version with major and minor, a __repr__ that shows Version(major, minor), and a __lt__ that puts the lower version first, so 9.0 comes before 10.0. Return the sorted versions as text, lowest first. Write sorted_versions(pairs). pairs is a list of (major, minor) pairs of whole numbers.

Rules:
1. Return one text entry per version, lowest first.
2. Versions compare as numbers: 9.0 comes before 10.0.
3. Each entry is written as Version(major, minor).

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def sorted_versions(pairs):
    pass
```

## c02-eff-repeated-tickets: Efficiency: repeated tickets

From Priya, Support, subject "Repeated tickets":

tickets is the list of ticket IDs, one per customer message, in the order they arrived. It can have thousands of entries. Return each ID that appears more than once, once each, in the order of its second appearance. Keep each ID as it is written. Write repeated_tickets(tickets).

Rules:
1. Return a list of the repeated IDs, each once.
2. Order them by where their second appearance is.
3. The time grows with the number of tickets, not with the square of it.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def repeated_tickets(tickets):
    pass
```

## c02-eff-job-queue: Efficiency: work through a job queue

From Tomas, Print Room, subject "Job queue":

jobs is the list of job weights, in the order the jobs arrived. It can have hundreds of thousands of entries. Work through them first in, first out. Return the running total after each job, in the same order. The total after a job includes that job. Write running_totals(jobs). jobs is a list of whole-number job weights, in the order they arrived.

Rules:
1. Return one running total per job, in the order the jobs were worked.
2. Each total includes its own job.
3. Taking the next job from the front takes about the same time however many jobs are waiting.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def running_totals(jobs):
    pass
```

## c02-eff-stock-check: Efficiency: check order lines against the catalog

From Omar, Warehouse, subject "Stock check":

catalog is the list of SKUs we stock, and orders is the list of SKUs on today's order lines. The catalog has thousands of SKUs. For each order line, return True if we stock that SKU and False if we do not. Return the answers in the same order as orders. Write stock_check(catalog, orders).

Rules:
1. Return one True or False per order line, in the same order.
2. A line is True only when its SKU is in the catalog.
3. The check for each line takes about the same time however large the catalog is.

Write the function named by "entry", with the signature shown in the starter. Helper functions are allowed.

Starter:
```python
def stock_check(catalog, orders):
    pass
```

Write your files into: docs/blind-solves/chapter2/fix-2b/H/
