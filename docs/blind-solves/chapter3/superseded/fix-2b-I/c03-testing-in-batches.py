def test_each_batch_has_the_given_size():
    batches = [list(batch) for batch in entry(list(range(6)), 3)]
    assert [len(batch) for batch in batches] == [3, 3]


def test_last_batch_can_be_shorter():
    batches = [list(batch) for batch in entry(list(range(7)), 3)]
    assert [len(batch) for batch in batches] == [3, 3, 1]


def test_size_larger_than_input_gives_one_batch():
    batches = [list(batch) for batch in entry([1, 2], 5)]
    assert [len(batch) for batch in batches] == [2]


def test_items_keep_their_order_inside_and_between_batches():
    items = list(range(10))
    batches = [list(batch) for batch in entry(items, 3)]
    assert batches == [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]


def test_flattened_batches_equal_the_input():
    items = ["c", "a", "d", "b", "e"]
    batches = [list(batch) for batch in entry(items, 2)]
    flat = [item for batch in batches for item in batch]
    assert flat == items


def test_empty_input_gives_no_batches():
    batches = [list(batch) for batch in entry([], 3)]
    assert batches == []


def test_size_below_one_raises_value_error():
    for size in (0, -1):
        try:
            [list(batch) for batch in entry([1, 2, 3], size)]
        except ValueError:
            continue
        assert False, "expected ValueError for size " + str(size)
