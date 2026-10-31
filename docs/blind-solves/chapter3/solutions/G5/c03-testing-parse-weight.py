def test_decimal_text_with_spaces():
    result = parse_weight(" 4.5 ")
    assert isinstance(result, float)
    assert result == 4.5


def test_text_that_is_not_a_number_gives_none():
    assert parse_weight("heavy") is None
    assert parse_weight("4.5 kg") is None


def test_value_that_is_not_text_raises_type_error():
    for value in (4.5, 4, None):
        raised = False
        try:
            parse_weight(value)
        except TypeError:
            raised = True
        assert raised, f"{value!r} is not text, so TypeError is expected"


def test_nan_and_inf_give_none():
    for text in ("nan", "NaN", "inf", "-inf"):
        assert parse_weight(text) is None, f"{text!r} should give None"
