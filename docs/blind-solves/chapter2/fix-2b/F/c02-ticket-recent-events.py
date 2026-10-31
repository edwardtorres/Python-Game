def last_events(events, n):
    if n <= 0:
        return []
    return list(events[-n:])
