def test_batch_sizes():
    # Seven items in batches of three: two full batches and one short batch.
    batches = [list(b) for b in in_batches([1, 2, 3, 4, 5, 6, 7], 3)]
    assert [len(b) for b in batches] == [3, 3, 1]

    # Six items in batches of two: every batch is full.
    batches = [list(b) for b in in_batches([1, 2, 3, 4, 5, 6], 2)]
    assert [len(b) for b in batches] == [2, 2, 2]

    # A size larger than the input gives one batch holding everything.
    batches = [list(b) for b in in_batches([1, 2], 5)]
    assert [len(b) for b in batches] == [2]


def test_items_keep_their_order():
    items = [5, 3, 9, 1, 7]
    batches = [list(b) for b in in_batches(items, 2)]
    # Order inside each batch and between batches must match the input.
    assert batches == [[5, 3], [9, 1], [7]]
    flat = [x for b in batches for x in b]
    assert flat == items


def test_empty_input_gives_no_batches():
    batches = [list(b) for b in in_batches([], 3)]
    assert batches == []


def test_size_below_one_raises_value_error():
    for bad_size in (0, -1):
        raised = False
        try:
            list(in_batches([1, 2, 3], bad_size))
        except ValueError:
            raised = True
        assert raised, f"size {bad_size} should raise ValueError"
