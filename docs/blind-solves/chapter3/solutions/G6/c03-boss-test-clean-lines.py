def test_trims_spaces_from_both_ends():
    result = clean_lines(["  Sales  ", "Q1 totals   ", "   Costs"])
    assert list(result) == ["Sales", "Q1 totals", "Costs"]
    result = clean_lines(["  lead", "trail  ", "  a b  "])
    assert list(result) == ["lead", "trail", "a b"]


def test_drops_lines_blank_after_trimming():
    result = clean_lines(["Sales", "   ", "", "Costs", "      "])
    assert list(result) == ["Sales", "Costs"]
    result = clean_lines(["   ", "  "])
    assert list(result) == []


def test_keeps_original_order():
    result = clean_lines(["  zebra ", "apple", "   ", "  mango", "bread  "])
    assert list(result) == ["zebra", "apple", "mango", "bread"]
    result = clean_lines(["c", "b", "a"])
    assert list(result) == ["c", "b", "a"]
