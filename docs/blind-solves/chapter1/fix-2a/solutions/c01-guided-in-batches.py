def in_batches(items, size):
    if size < 1:
        raise ValueError("size must be at least 1")
    data = list(items)
    return [data[start:start + size] for start in range(0, len(data), size)]
