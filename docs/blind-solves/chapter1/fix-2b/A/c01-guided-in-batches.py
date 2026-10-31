def in_batches(items, size):
    if size < 1:
        raise ValueError("size must be at least 1")
    return [list(items[start:start + size]) for start in range(0, len(items), size)]
