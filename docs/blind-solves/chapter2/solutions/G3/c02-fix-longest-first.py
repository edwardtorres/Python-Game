def longest_first(words):
    return sorted(words, key=lambda word: (-len(word), word))
