from collections import deque


def running_totals(jobs):
    queue = deque(jobs)
    totals = []
    total = 0
    while queue:
        total += queue.popleft()
        totals.append(total)
    return totals
