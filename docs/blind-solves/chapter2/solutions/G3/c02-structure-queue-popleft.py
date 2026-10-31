from collections import deque


def serve_all(queue):
    line = deque(queue)
    served = []
    while line:
        served.append(line.popleft())
    return served
