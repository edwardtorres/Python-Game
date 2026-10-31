def test_words_split_on_any_whitespace():
    assert count_words(["one\ttwo  three", "  four   one "]) == {"one": 2, "two": 1, "three": 1, "four": 1}


def test_counting_ignores_case():
    assert count_words(["The the THE", "tHe cat"]) == {"the": 4, "cat": 1}


def test_returns_dict_of_word_to_count():
    result = count_words(["b a b", "c b"])
    assert isinstance(result, dict)
    assert result == {"a": 1, "b": 3, "c": 1}
