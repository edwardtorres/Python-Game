def test_strips_spaces_from_both_ends():
    assert clean_lines(["  left", "right  ", "  both  "]) == ["left", "right", "both"]
    assert clean_lines(["  inner space  "]) == ["inner space"]


def test_drops_lines_blank_after_trimming():
    assert clean_lines(["   ", "", "kept", "    "]) == ["kept"]
    assert clean_lines(["  ", " "]) == []


def test_keeps_original_order():
    assert clean_lines(["  zeta ", "", "alpha", " mid", "   ", "beta"]) == ["zeta", "alpha", "mid", "beta"]
