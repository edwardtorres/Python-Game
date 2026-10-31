def test_each_line_reads_word_colon_count():
    assert report_lines([("apple", 3)]) == ["apple: 3"]
    assert report_lines([("a", 1), ("bb", 12)]) == ["a: 1", "bb: 12"]


def test_keeps_pair_order():
    assert report_lines([("zebra", 1), ("apple", 5), ("mango", 3)]) == ["zebra: 1", "apple: 5", "mango: 3"]
