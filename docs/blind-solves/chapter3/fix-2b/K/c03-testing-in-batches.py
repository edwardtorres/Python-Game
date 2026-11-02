def test_batch_sizes():
    batches = [list(batch) for batch in in_batches([1, 2, 3, 4, 5], 2)]
    assert len(batches) == 3
    assert len(batches[0]) == 2
    assert len(batches[1]) == 2
    assert len(batches[2]) == 1
    assert batches == [[1, 2], [3, 4], [5]]


def test_exact_multiple_gives_full_batches():
    batches = [list(batch) for batch in in_batches([1, 2, 3, 4, 5, 6], 3)]
    assert [len(batch) for batch in batches] == [3, 3]
    assert batches == [[1, 2, 3], [4, 5, 6]]


def test_size_larger_than_items_gives_one_batch():
    batches = [list(batch) for batch in in_batches([1, 2], 5)]
    assert batches == [[1, 2]]


def test_order_kept_inside_and_between_batches():
    items = ["d", "a", "c", "b", "e", "f", "g"]
    batches = [list(batch) for batch in in_batches(items, 3)]
    assert batches == [["d", "a", "c"], ["b", "e", "f"], ["g"]]
    flat = [item for batch in batches for item in batch]
    assert flat == items


def test_empty_input_gives_no_batches():
    batches = [list(batch) for batch in in_batches([], 3)]
    assert batches == []


def test_size_below_one_raises_when_called():
    for bad_size in (0, -1):
        raised = False
        try:
            in_batches([1, 2, 3], bad_size)
        except ValueError:
            raised = True
        assert raised
