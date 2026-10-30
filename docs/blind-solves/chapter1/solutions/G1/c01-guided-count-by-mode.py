def count_by_mode(records):
    counts = {}
    for record in records:
        mode = record["mode"]
        counts[mode] = counts.get(mode, 0) + 1
    return counts
