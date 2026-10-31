// Chapter 3 graded items: 2 testing tasks, where the learner writes tests for a function, and 2 suite
// tasks, where the learner fixes a function until the owner's tests pass. Every case names the rules
// it checks. A testing item grades its mutants, and each mutant is one wrong version of the function.
import type { ChallengeSpec } from '../../challenges/types';
import { type GradedItem, fn, suiteSpec, type TestingItem, testingSpec } from '../graded';

const TESTING: TestingItem[] = [
  {
    id: 'c03-testing-in-batches',
    title: 'Tests for in_batches',
    lessonId: 'c03-testing/good-cases',
    competencies: ['good-test-cases'],
    ticket: { from: 'Yara, Dock Quality', subject: 'Tests for batching', body: 'in_batches has been in use for a month. Write tests for it. Each test is a function whose name starts with test_, and it uses assert. The game runs your tests against the correct version of in_batches and against wrong versions of it. Write test functions for in_batches(items, size). items is a list and size is a whole number.' },
    rules: ['A test checks the size of each batch.', 'A test checks that items keep their order, inside a batch and between batches.', 'A test checks an empty input.', 'A test checks that a size below 1 raises ValueError.'],
    entry: 'in_batches',
    starter: 'def test_example():\n    pass\n',
    reference: 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n',
    modelTests: 'def test_batch_sizes():\n    assert list(in_batches([1, 2, 3, 4, 5], 2)) == [[1, 2], [3, 4], [5]]\n\n\ndef test_order_inside_batches():\n    assert list(in_batches(["a", "b", "c", "d"], 2)) == [["a", "b"], ["c", "d"]]\n\n\ndef test_empty_input():\n    assert list(in_batches([], 3)) == []\n\n\ndef test_empty_input_any_size():\n    assert list(in_batches([], 1)) == []\n\n\ndef test_size_below_one():\n    try:\n        list(in_batches([1, 2], 0))\n    except ValueError:\n        return\n    assert False, "a size below 1 must raise ValueError"\n\n\ndef test_size_below_one_with_no_items():\n    try:\n        list(in_batches([], 0))\n    except ValueError:\n        return\n    assert False, "a size below 1 must raise ValueError, even with no items"\n',
    weakTests: 'def test_batch_count():\n    assert len(list(in_batches([1, 2, 3, 4, 5], 2))) == 3\n',
    mutants: [
      { id: 'reversed-inside', label: 'Reverses the items inside each batch', code: 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    batch = []\n    for item in items:\n        batch.insert(0, item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n', tag: 'INSERT_AT_FRONT', rule: 1, visibility: 'visible' },
      { id: 'size-plus-one', label: 'Makes each batch one item too big', code: 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size + 1:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n', tag: 'OFF_BY_ONE_RANGE', rule: 0, visibility: 'visible' },
      { id: 'one-empty-batch', label: 'Yields one empty batch for an empty input', code: 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    if len(items) == 0:\n        yield [None]\n        return\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n', tag: 'EMPTY_IS_NONE', rule: 2, visibility: 'hidden' },
      { id: 'no-size-check', label: 'Accepts a size below 1 without an error', code: 'def in_batches(items, size):\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n', tag: 'UNCHECKED_ARGUMENT', rule: 3, visibility: 'hidden' },
    ],
    hints: ['Each rule needs a test that would fail if the rule broke. Start with the batch sizes.', 'The empty input and a size below 1 are cases of their own, and each needs a test.', 'Call in_batches inside a try block, and check for ValueError when the size is 0.'],
  },
  {
    id: 'c03-testing-parse-weight',
    title: 'Tests for parse_weight',
    lessonId: 'c03-testing/good-cases',
    competencies: ['good-test-cases'],
    ticket: { from: 'Ravi, Scale Desk', subject: 'Tests for weight text', body: 'parse_weight reads a weight typed at the scale. Write tests for it. It returns a float for a number, None for text that is not a number, and it raises TypeError for a value that is not text. Write test functions for parse_weight(text). text is a string.' },
    rules: ['A test checks decimal text with spaces, such as " 4.5 ".', 'A test checks text that is not a number, which gives None.', 'A test checks that a value that is not text raises TypeError.', 'A test checks that nan and inf give None.'],
    entry: 'parse_weight',
    starter: 'def test_example():\n    pass\n',
    reference: 'import math\n\n\ndef parse_weight(text):\n    if not isinstance(text, str):\n        raise TypeError("text must be a string")\n    try:\n        value = float(text.strip())\n    except ValueError:\n        return None\n    if not math.isfinite(value):\n        return None\n    return value\n',
    modelTests: 'def test_decimal_text():\n    assert parse_weight(" 4.5 ") == 4.5\n\n\ndef test_decimal_text_again():\n    assert parse_weight("2.75") == 2.75\n\n\ndef test_letters_give_none():\n    assert parse_weight("abc") is None\n\n\ndef test_empty_text_gives_none():\n    assert parse_weight("") is None\n\n\ndef test_number_value_raises():\n    try:\n        parse_weight(12)\n    except TypeError:\n        return\n    assert False, "a value that is not text must raise TypeError"\n\n\ndef test_none_value_raises():\n    try:\n        parse_weight(None)\n    except TypeError:\n        return\n    assert False, "None is not text, so it must raise TypeError"\n\n\ndef test_nan_gives_none():\n    assert parse_weight("nan") is None\n\n\ndef test_inf_gives_none():\n    assert parse_weight("inf") is None\n',
    weakTests: 'def test_decimal_text():\n    assert parse_weight(" 4.5 ") == 4.5\n',
    mutants: [
      { id: 'whole-numbers-only', label: 'Rejects decimal weights', code: 'def parse_weight(text):\n    if not isinstance(text, str):\n        raise TypeError("text must be a string")\n    try:\n        return float(int(text.strip()))\n    except ValueError:\n        return None\n', tag: 'INT_FROM_TEXT', rule: 0, visibility: 'visible' },
      { id: 'no-fallback', label: 'Raises instead of returning None for text', code: 'import math\n\ndef parse_weight(text):\n    if not isinstance(text, str):\n        raise TypeError("text must be a string")\n    value = float(text.strip())\n    return value if math.isfinite(value) else None\n', tag: 'NO_FALLBACK', rule: 1, visibility: 'visible' },
      { id: 'catches-everything', label: 'Returns None for a value that is not text', code: 'import math\n\ndef parse_weight(text):\n    try:\n        value = float(text)\n    except Exception:\n        return None\n    return value if math.isfinite(value) else None\n', tag: 'EXCEPTION_TOO_BROAD', rule: 2, visibility: 'hidden' },
      { id: 'returns-non-finite', label: 'Returns nan and inf as numbers', code: 'def parse_weight(text):\n    if not isinstance(text, str):\n        raise TypeError("text must be a string")\n    try:\n        return float(text.strip())\n    except ValueError:\n        return None\n', tag: 'NON_FINITE_FLOAT', rule: 3, visibility: 'hidden' },
    ],
    hints: ['Decimal text needs a test of its own, with spaces around it.', 'A test for text that is not a number, and a test for a value that is not text, are separate cases.', 'nan and inf are text too. Check each of them, and assert the result is None.'],
  },
];

const SUITE: Array<GradedItem & { ownerTests: string }> = [
  {
    id: 'c03-suite-fix-dock-count',
    title: 'Fix: count the docks',
    lessonId: 'c03-testing/test-first',
    competencies: ['test-driven-fixes'],
    ticket: { from: 'Mina, Yard Office', subject: 'Count the docks', body: 'Write count_docks(log). log is a list of dock names, as text, with one entry per scan, and each entry is an exact dock name such as "Dock 1". Return how many different dock names appear in it. The owner tests run against your function, and the current code fails them.' },
    rules: ['Count each dock name once, however often it appears.', 'An empty log has zero docks.', 'Names are compared exactly, so "Dock 1" and "dock 1" are different docks.'],
    entry: 'count_docks',
    starter: 'def count_docks(log):\n    return len(log)\n',
    reference: 'def count_docks(log):\n    return len(set(log))\n',
    ownerTests: 'def test_repeats_count_once():\n    assert count_docks(["Dock 1", "Dock 2", "Dock 1"]) == 2\n\n\ndef test_empty_log():\n    assert count_docks([]) == 0\n\n\ndef test_empty_tuple():\n    assert count_docks(()) == 0\n\n\ndef test_names_are_exact():\n    assert count_docks(["Dock 1", "dock 1"]) == 2\n\n\ndef test_mixed_log():\n    assert count_docks(["a", "b", "a", "c", "b", "a", "B"]) == 4\n',
    cases: [
      fn('test_repeats_count_once', 'Repeated names count once', 'visible', [], [0]),
      fn('test_empty_log', 'An empty log has no docks', 'visible', [], [1]),
      fn('test_empty_tuple', 'An empty tuple has no docks', 'hidden', [], [1]),
      fn('test_names_are_exact', 'Names that differ in case are different docks', 'hidden', [], [2]),
      fn('test_mixed_log', 'A mixed log', 'hidden', [], [0, 2]),
    ],
    variants: [
      ['counts-lines', 'def count_docks(log):\n    return len(log)\n', 'DUPLICATES_KEPT', 0],
      ['lowercase-names', 'def count_docks(log):\n    return len(set(name.lower() for name in log))\n', 'CASE_SENSITIVE_KEYS', 2],
      ['none-when-empty', 'def count_docks(log):\n    if not log:\n        return None\n    return len(set(log))\n', 'EMPTY_NOT_NONE', 1],
    ],
    hints: [
      'The current code counts every line in the log. Read the first rule.',
      'A set keeps one copy of each value, so its size is the number of different names.',
      'return len(set(log))',
    ],
  },
  {
    id: 'c03-suite-fix-median',
    title: 'Fix: the median of delivery times',
    lessonId: 'c03-testing/test-first',
    competencies: ['test-driven-fixes'],
    ticket: { from: 'Oscar, Analytics', subject: 'Median delivery time', body: 'Write median(values). values is a list of delivery times, as numbers. Sort the values. When the count is odd, return the middle value unchanged. When the count is even, return the mean of the two middle values as a float. An empty list raises ValueError. The current code fails the owner tests.' },
    rules: ['Sort the values, and when the count is odd, return the middle value unchanged.', 'When the count is even, return the mean of the two middle values as a float.', 'An empty list raises ValueError.'],
    entry: 'median',
    starter: 'def median(values):\n    return sorted(values)[len(values) // 2]\n',
    reference: 'def median(values):\n    if not values:\n        raise ValueError("median needs at least one value")\n    ordered = sorted(values)\n    middle = len(ordered) // 2\n    if len(ordered) % 2 == 1:\n        return ordered[middle]\n    return (ordered[middle - 1] + ordered[middle]) / 2\n',
    ownerTests: 'def test_odd_count():\n    assert median([3, 1, 2]) == 2\n\n\ndef test_even_count():\n    assert median([4, 1, 3, 2]) == 2.5\n\n\ndef test_two_values():\n    assert median([10, 20]) == 15\n\n\ndef test_unsorted_input():\n    assert median([9, 1, 2]) == 2\n\n\ndef test_skewed_values():\n    assert median([1, 1, 10]) == 1\n\n\ndef test_even_count_is_float():\n    assert isinstance(median([4, 1, 3, 2]), float)\n\n\ndef test_empty_raises():\n    try:\n        median([])\n    except ValueError:\n        return\n    assert False, "an empty list must raise ValueError"\n\n\ndef test_empty_again():\n    try:\n        median([])\n    except ValueError:\n        return\n    assert False, "an empty list must raise ValueError, again"\n',
    cases: [
      fn('test_odd_count', 'An odd count', 'visible', [], [0]),
      fn('test_even_count', 'An even count', 'visible', [], [0, 1]),
      fn('test_two_values', 'Two values', 'hidden', [], [0, 1]),
      fn('test_unsorted_input', 'Unsorted values', 'hidden', [], [0]),
      fn('test_skewed_values', 'One large value', 'hidden', [], [0]),
      fn('test_even_count_is_float', 'An even count gives a float', 'hidden', [], [0, 1]),
      fn('test_empty_raises', 'An empty list raises ValueError', 'hidden', [], [2]),
      fn('test_empty_again', 'An empty list raises ValueError, checked again', 'hidden', [], [2]),
    ],
    variants: [
      ['lower-middle', 'def median(values):\n    if not values:\n        raise ValueError("median needs at least one value")\n    ordered = sorted(values)\n    return ordered[(len(ordered) - 1) // 2]\n', 'OFF_BY_ONE_RANGE', 1],
      ['mean', 'def median(values):\n    if not values:\n        raise ValueError("median needs at least one value")\n    return sum(values) / len(values)\n', 'MEAN_NOT_MEDIAN', 0],
      ['empty-none', 'def median(values):\n    if not values:\n        return None\n    ordered = sorted(values)\n    middle = len(ordered) // 2\n    if len(ordered) % 2 == 1:\n        return ordered[middle]\n    return (ordered[middle - 1] + ordered[middle]) / 2\n', 'EMPTY_NOT_NONE', 2],
      ['unsorted', 'def median(values):\n    if not values:\n        raise ValueError("median needs at least one value")\n    return values[len(values) // 2]\n', 'UNSORTED_OUTPUT', 0],
      ['int-division-mean', 'def median(values):\n    if not values:\n        raise ValueError("median needs at least one value")\n    ordered = sorted(values)\n    middle = len(ordered) // 2\n    if len(ordered) % 2 == 1:\n        return ordered[middle]\n    return (ordered[middle - 1] + ordered[middle]) // 2\n', 'INT_DIVISION', 1],
    ],
    hints: [
      'The current code takes the middle of the list without sorting it first. Read the first rule.',
      'When the count is even there are two middle values, and the rule says to average them.',
      'ordered = sorted(values), then average ordered[middle - 1] and ordered[middle] when the count is even.',
    ],
  },
];

export const GRADED_SPECS: ChallengeSpec[] = [
  ...TESTING.map((item) => testingSpec('c03-testing', item)),
  ...SUITE.map((item) => suiteSpec('c03-testing', item)),
];
