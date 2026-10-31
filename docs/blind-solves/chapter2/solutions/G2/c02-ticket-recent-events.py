def last_events(events, n):
    if n <= 0:
        return []
    start = max(0, len(events) - n)
    return list(events[start:])
