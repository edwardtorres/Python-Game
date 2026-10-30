def count_words(lines):
    counts = {}
    for line in lines:
        for word in line.split():
            key = word.lower()
            counts[key] = counts.get(key, 0) + 1
    return counts
