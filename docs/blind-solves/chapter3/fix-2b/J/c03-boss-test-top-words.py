def test_highest_count_comes_first():
    assert top_words({"apple": 2, "pear": 5, "fig": 3}, 3) == [("pear", 5), ("fig", 3), ("apple", 2)]


def test_ties_are_ordered_a_to_z():
    assert top_words({"zebra": 2, "mango": 2, "apple": 2, "kiwi": 1}, 3) == [("apple", 2), ("mango", 2), ("zebra", 2)]


def test_returns_at_most_n_pairs():
    counts = {"a": 4, "b": 3, "c": 2, "d": 1}
    assert top_words(counts, 2) == [("a", 4), ("b", 3)]
    assert top_words(counts, 10) == [("a", 4), ("b", 3), ("c", 2), ("d", 1)]
