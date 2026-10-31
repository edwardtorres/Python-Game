from collections import deque


def serve_all(queue):
    parcels = deque(queue)
    served = []
    while parcels:
        served.append(parcels.popleft())
    return served
