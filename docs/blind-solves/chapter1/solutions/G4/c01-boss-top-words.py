def top_words(counts, n):
    ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))
    if n <= 0:
        return []
    return ranked[:n]
