def top_words(counts, n):
    if n <= 0:
        return []
    ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))
    return ranked[:n]
