def test_each_line_reads_word_colon_count():
    assert list(report_lines([("apple", 3)])) == ["apple: 3"]
    assert list(report_lines([("fig", 12), ("kiwi", 1)])) == ["fig: 12", "kiwi: 1"]


def test_order_of_pairs_is_kept():
    pairs_in = [("zebra", 1), ("apple", 3), ("mango", 2)]
    assert list(report_lines(pairs_in)) == ["zebra: 1", "apple: 3", "mango: 2"]
    assert list(report_lines([("b", 2), ("a", 2)])) == ["b: 2", "a: 2"]
