// The Chapter 3 boss: four testing parts, one for each Chapter 1 boss function. Each part is graded on its own.
import type { ChallengeSpec } from '../../challenges/types';
import { type TestingItem, testingSpec } from '../graded';

const BOSS_PARTS: TestingItem[] = [
  {
    id: 'c03-boss-test-clean-lines',
    title: 'Boss part 1: tests for clean_lines',
    lessonId: 'c03-testing/good-cases',
    competencies: ['good-test-cases'],
    ticket: { from: 'Ana, Report Desk', subject: 'Tests for clean_lines', body: 'clean_lines prepares the lines of a report. Write tests for it, one test function for each rule the owner lists. The game runs your tests against the correct version and against wrong versions. Write test functions for clean_lines(lines). lines is a list of text lines.' },
    rules: ['A test checks that spaces are removed from both ends of each line.', 'A test checks that lines blank after trimming are dropped.', 'A test checks that the lines keep their original order.'],
    entry: 'clean_lines',
    starter: 'def test_example():\n    pass\n',
    reference: 'def clean_lines(lines):\n    cleaned = []\n    for line in lines:\n        text = line.strip()\n        if text:\n            cleaned.append(text)\n    return cleaned\n',
    modelTests: 'def test_trims_and_drops_blanks():\n    assert clean_lines(["  Dock 1 ", "", "Bay 2"]) == ["Dock 1", "Bay 2"]\n\n\ndef test_keeps_order():\n    assert clean_lines(["z", " a ", "m"]) == ["z", "a", "m"]\n\n\ndef test_spaces_only_line_is_blank():\n    assert clean_lines(["   ", "Gate"]) == ["Gate"]\n\n\ndef test_empty_input():\n    assert clean_lines([]) == []\n',
    weakTests: 'def test_trims_one_line():\n    assert clean_lines(["  Dock 1 "]) == ["Dock 1"]\n',
    mutants: [
      { id: 'keeps-blanks', label: 'Keeps lines that are blank after trimming', code: 'def clean_lines(lines):\n    return [line.strip() for line in lines]\n', tag: 'TRUTHINESS', rule: 1, visibility: 'visible' },
      { id: 'no-trim', label: 'Keeps the spaces around each line', code: 'def clean_lines(lines):\n    return [line for line in lines if line.strip()]\n', tag: 'STR_IMMUTABLE', rule: 0, visibility: 'visible' },
      { id: 'sorted-output', label: 'Sorts the lines', code: 'def clean_lines(lines):\n    cleaned = []\n    for line in lines:\n        text = line.strip()\n        if text:\n            cleaned.append(text)\n    return sorted(cleaned)\n', tag: 'SORTED_CHANGES_ORDER', rule: 2, visibility: 'hidden' },
    ],
    hints: ['Each rule needs a line that breaks it, so a test can catch it.', 'A blank line and a line of spaces only are different inputs.', 'Check the order with a list whose items are not already sorted.'],
  },
  {
    id: 'c03-boss-test-count-words',
    title: 'Boss part 2: tests for count_words',
    lessonId: 'c03-testing/good-cases',
    competencies: ['good-test-cases'],
    ticket: { from: 'Bea, Report Desk', subject: 'Tests for count_words', body: 'count_words counts the words on the report lines. Write tests for it, one test function for each rule the owner lists. The game runs your tests against the correct version and against wrong versions. Write test functions for count_words(lines). lines is a list of text lines.' },
    rules: ['A test checks that words are split on any whitespace.', 'A test checks that counting ignores case.', 'A test checks that the result is a dict from each word to its count.'],
    entry: 'count_words',
    starter: 'def test_example():\n    pass\n',
    reference: 'def count_words(lines):\n    counts = {}\n    for line in lines:\n        for word in line.lower().split():\n            counts[word] = counts.get(word, 0) + 1\n    return counts\n',
    modelTests: 'def test_counts_ignoring_case():\n    assert count_words(["Dock dock", "rail"]) == {"dock": 2, "rail": 1}\n\n\ndef test_any_whitespace_separates_words():\n    assert count_words(["A\\tb", "a  B"]) == {"a": 2, "b": 2}\n\n\ndef test_double_spaces():\n    assert count_words(["a  b"]) == {"a": 1, "b": 1}\n\n\ndef test_empty_input_gives_empty_dict():\n    assert count_words([]) == {}\n\n\ndef test_returns_a_dict():\n    assert isinstance(count_words(["x"]), dict)\n',
    weakTests: 'def test_counts_one_line():\n    assert count_words(["dock rail dock"]) == {"dock": 2, "rail": 1}\n',
    mutants: [
      { id: 'case-sensitive', label: 'Counts Dock and dock as different words', code: 'def count_words(lines):\n    counts = {}\n    for line in lines:\n        for word in line.split():\n            counts[word] = counts.get(word, 0) + 1\n    return counts\n', tag: 'CASE_SENSITIVE_KEYS', rule: 1, visibility: 'visible' },
      { id: 'split-on-space', label: 'Splits only on spaces, not tabs', code: 'def count_words(lines):\n    counts = {}\n    for line in lines:\n        for word in line.lower().split(" "):\n            counts[word] = counts.get(word, 0) + 1\n    return counts\n', tag: 'SPLIT_ON_SPACE', rule: 0, visibility: 'visible' },
      { id: 'pairs-not-dict', label: 'Returns pairs instead of a dict', code: 'def count_words(lines):\n    counts = {}\n    for line in lines:\n        for word in line.lower().split():\n            counts[word] = counts.get(word, 0) + 1\n    return sorted(counts.items())\n', tag: 'CONTAINER_SHAPE', rule: 2, visibility: 'hidden' },
    ],
    hints: ['A tab is whitespace, and so is a run of spaces.', 'Use a line with capitals, and compare the result with the expected counts.', 'Check the type of the result, and the empty input.'],
  },
  {
    id: 'c03-boss-test-top-words',
    title: 'Boss part 3: tests for top_words',
    lessonId: 'c03-testing/good-cases',
    competencies: ['good-test-cases'],
    ticket: { from: 'Cal, Report Desk', subject: 'Tests for top_words', body: 'top_words picks the most common words for the report. Write tests for it, one test function for each rule the owner lists. The game runs your tests against the correct version and against wrong versions. Write test functions for top_words(counts, n). counts maps each word to its count, and n is how many pairs to return.' },
    rules: ['A test checks that the highest count comes first.', 'A test checks that ties are ordered A to Z.', 'A test checks that at most n pairs are returned.'],
    entry: 'top_words',
    starter: 'def test_example():\n    pass\n',
    reference: 'def top_words(counts, n):\n    ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))\n    return ranked[:n]\n',
    modelTests: 'def test_highest_count_first():\n    assert top_words({"a": 1, "b": 3, "c": 2}, 2) == [("b", 3), ("c", 2)]\n\n\ndef test_highest_again():\n    assert top_words({"x": 5, "y": 1}, 1) == [("x", 5)]\n\n\ndef test_ties_in_alphabetical_order():\n    assert top_words({"m": 2, "b": 2}, 2) == [("b", 2), ("m", 2)]\n\n\ndef test_ties_again():\n    assert top_words({"z": 4, "y": 4}, 2) == [("y", 4), ("z", 4)]\n\n\ndef test_at_most_n_pairs():\n    assert top_words({"p": 1, "q": 1, "r": 1}, 2) == [("p", 1), ("q", 1)]\n\n\ndef test_fewer_words_than_n():\n    assert top_words({"a": 1}, 3) == [("a", 1)]\n',
    weakTests: 'def test_highest_first():\n    assert top_words({"a": 1, "b": 3, "c": 2}, 2) == [("b", 3), ("c", 2)]\n',
    mutants: [
      { id: 'ties-in-dict-order', label: 'Keeps ties in the order they were added', code: 'def top_words(counts, n):\n    ranked = sorted(counts.items(), key=lambda pair: -pair[1])\n    return ranked[:n]\n', tag: 'DICT_ORDER_ASSUMPTION', rule: 1, visibility: 'visible' },
      { id: 'ascending', label: 'Puts the lowest count first', code: 'def top_words(counts, n):\n    ranked = sorted(counts.items(), key=lambda pair: (pair[1], pair[0]))\n    return ranked[:n]\n', tag: 'SORTED_CHANGES_ORDER', rule: 0, visibility: 'hidden' },
      { id: 'one-short', label: 'Returns one pair fewer than n', code: 'def top_words(counts, n):\n    ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))\n    return ranked[: n - 1]\n', tag: 'OFF_BY_ONE_RANGE', rule: 2, visibility: 'visible' },
    ],
    hints: ['Ties need two words with the same count, and a test for each order.', 'A count of 1 each is a tie too.', 'Check the number of pairs against n, and a dict with fewer words than n.'],
  },
  {
    id: 'c03-boss-test-report-lines',
    title: 'Boss part 4: tests for report_lines',
    lessonId: 'c03-testing/good-cases',
    competencies: ['good-test-cases'],
    ticket: { from: 'Dev, Report Desk', subject: 'Tests for report_lines', body: 'report_lines writes the report lines. Write tests for it, one test function for each rule the owner lists. The game runs your tests against the correct version and against wrong versions. Write test functions for report_lines(pairs). pairs is a list of (word, count) pairs.' },
    rules: ['A test checks that each line reads "word: count".', 'A test checks that the order of the pairs is kept.'],
    entry: 'report_lines',
    starter: 'def test_example():\n    pass\n',
    reference: 'def report_lines(pairs):\n    return [f"{word}: {count}" for word, count in pairs]\n',
    modelTests: 'def test_word_colon_count():\n    assert report_lines([["sea", 3], ["air", 2]]) == ["sea: 3", "air: 2"]\n\n\ndef test_single_pair():\n    assert report_lines([["x", 1]]) == ["x: 1"]\n\n\ndef test_keeps_order_of_ties():\n    assert report_lines([["b", 2], ["a", 2]]) == ["b: 2", "a: 2"]\n\n\ndef test_empty_list():\n    assert report_lines([]) == []\n',
    weakTests: 'def test_word_colon_count():\n    assert report_lines([["sea", 3]]) == ["sea: 3"]\n',
    mutants: [
      { id: 'no-colon', label: 'Leaves out the colon', code: 'def report_lines(pairs):\n    return [f"{word} {count}" for word, count in pairs]\n', tag: 'FORMAT_SPEC', rule: 0, visibility: 'hidden' },
      { id: 'reversed', label: 'Reverses the order of the lines', code: 'def report_lines(pairs):\n    return [f"{word}: {count}" for word, count in pairs][::-1]\n', tag: 'REVERSED_ORDER', rule: 1, visibility: 'visible' },
    ],
    hints: ['Check the exact text of one line, including the colon.', 'Two pairs show the order, and a test with ties shows that the order is kept.', 'An empty list is a case of its own.'],
  },
];

export const BOSS_SPECS: ChallengeSpec[] = BOSS_PARTS.map((item) => testingSpec('c03-testing', item));
