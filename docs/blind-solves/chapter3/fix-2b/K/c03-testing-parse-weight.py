def test_decimal_text_with_spaces():
    value = parse_weight(" 4.5 ")
    assert isinstance(value, float)
    assert value == 4.5


def test_plain_decimal_text():
    value = parse_weight("4.5")
    assert isinstance(value, float)
    assert value == 4.5


def test_text_that_is_not_a_number_gives_none():
    assert parse_weight("abc") is None
    assert parse_weight("") is None


def test_non_text_value_raises_type_error():
    for value in (4.5, 4, None):
        raised = False
        try:
            parse_weight(value)
        except TypeError:
            raised = True
        assert raised


def test_nan_inf_and_overflow_give_none():
    assert parse_weight("nan") is None
    assert parse_weight("inf") is None
    assert parse_weight("1e400") is None
