def heaviest(weights, n):
    if n <= 0:
        return []
    return sorted(weights, reverse=True)[:n]
