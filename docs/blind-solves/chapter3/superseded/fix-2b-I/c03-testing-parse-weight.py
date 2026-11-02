def test_decimal_text_with_spaces_is_a_float():
    result = entry(" 4.5 ")
    assert isinstance(result, float)
    assert result == 4.5


def test_whole_number_text_is_a_float():
    result = entry("12")
    assert isinstance(result, float)
    assert result == 12.0


def test_text_that_is_not_a_number_gives_none():
    for text in ("heavy", "4 kg", "4.5.1", ""):
        assert entry(text) is None, text


def test_value_that_is_not_text_raises_type_error():
    for value in (4.5, 4, None):
        try:
            entry(value)
        except TypeError:
            continue
        assert False, "expected TypeError for " + repr(value)


def test_nan_and_inf_give_none():
    for text in ("nan", "NaN", "inf", "-inf"):
        assert entry(text) is None, text
