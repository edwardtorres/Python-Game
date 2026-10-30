def in_batches(items, size):
    if size < 1:
        raise ValueError("size must be at least 1")
    seq = list(items)
    return [seq[start:start + size] for start in range(0, len(seq), size)]
