def test_splits_words_on_any_whitespace():
    result = count_words(["one\ttwo  three", "  three\nfour  ", "   "])
    assert result == {"one": 1, "two": 1, "three": 2, "four": 1}
    result = count_words(["red\tgreen\tblue"])
    assert result == {"red": 1, "green": 1, "blue": 1}


def test_counting_ignores_case():
    result = count_words(["Apple apple APPLE", "aPPle pear"])
    assert isinstance(result, dict)
    assert len(result) == 2
    apple_counts = [count for word, count in result.items() if word.lower() == "apple"]
    assert apple_counts == [4]
    assert result.get("pear") == 1
    result = count_words(["THE the The"])
    the_counts = [count for word, count in result.items() if word.lower() == "the"]
    assert the_counts == [3]
    assert len(result) == 1


def test_result_is_a_dict_from_word_to_count():
    result = count_words(["the cat and the hat", "the end"])
    assert isinstance(result, dict)
    assert result == {"the": 3, "cat": 1, "and": 1, "hat": 1, "end": 1}
    assert count_words([]) == {}
