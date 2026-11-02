from itertools import accumulate


def running_totals(jobs):
    return list(accumulate(jobs))
