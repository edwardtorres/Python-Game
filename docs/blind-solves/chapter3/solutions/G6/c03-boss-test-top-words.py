def test_highest_count_comes_first():
    result = top_words({"apple": 1, "pear": 3, "fig": 2}, 3)
    assert [tuple(pair) for pair in result] == [("pear", 3), ("fig", 2), ("apple", 1)]
    result = top_words({"x": 1, "yy": 7, "zzz": 4}, 3)
    assert [tuple(pair) for pair in result] == [("yy", 7), ("zzz", 4), ("x", 1)]


def test_ties_are_ordered_a_to_z():
    result = top_words({"melon": 2, "apple": 2, "kiwi": 2, "fig": 5}, 4)
    assert [tuple(pair) for pair in result] == [
        ("fig", 5),
        ("apple", 2),
        ("kiwi", 2),
        ("melon", 2),
    ]
    result = top_words({"zebra": 2, "ant": 2, "bee": 2}, 2)
    assert [tuple(pair) for pair in result] == [("ant", 2), ("bee", 2)]


def test_at_most_n_pairs_are_returned():
    counts = {"a": 1, "b": 4, "c": 3, "d": 2, "e": 5}
    result = top_words(counts, 2)
    assert [tuple(pair) for pair in result] == [("e", 5), ("b", 4)]
    result = top_words(counts, 1)
    assert [tuple(pair) for pair in result] == [("e", 5)]
    result = top_words({"x": 2, "y": 1}, 10)
    assert [tuple(pair) for pair in result] == [("x", 2), ("y", 1)]
