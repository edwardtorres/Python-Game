// Chapter 3 lessons. Each example runs in the engine, and its output is recorded in
// generated/chapter3.outputs.json. A section with no quote is labelled as demonstrated by the
// interpreter, and its example is the evidence.
import type { Lesson } from '../types';

export const LESSONS: Lesson[] = [
  {
    id: 'c03-testing/assert',
    number: 1,
    title: 'Assert statements',
    competency: 'assert',
    jsNotes: [],
    intro: 'An assert statement checks a condition. A true condition does nothing, and a false one stops the code with an error that names the check.',
    sections: [
      {
        id: 'assert-basics',
        docClaim: false,
        quotes: [],
        title: 'A true check does nothing, and a false one fails',
        paragraphs: [
          'An assert statement checks a condition. A true condition does nothing. A false one raises AssertionError.',
        ],
        examples: [
          { id: 'c03-assert-1', code: 'def add_tax(amount):\n    return round(amount * 1.2, 2)\n\n\nassert add_tax(10) == 12.0\nprint("first check passed")\ntry:\n    assert add_tax(10) == 11.0\nexcept AssertionError as error:\n    print("second check failed", type(error).__name__)\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'assert-message',
        docClaim: true,
        quotes: ['pytest-assert-message'],
        title: 'A message says what the check expected',
        paragraphs: [
          'Put a comma and a message after the condition. The message is shown with the failure, so it should say what was expected.',
        ],
        examples: [
          { id: 'c03-assert-2', code: 'def add_tax(amount):\n    return round(amount * 1.2, 2)\n\n\ntry:\n    assert add_tax(10) == 11.0, "tax is wrong"\n    print("passed")\nexcept AssertionError as error:\n    print("failed:", error)\n' },
        ],
        commonMistakes: ['ASSERT_MESSAGE_OMITTED'],
      },
      {
        id: 'assert-float',
        docClaim: true,
        quotes: ['pytest-approx'],
        title: 'Compare floats with a tolerance',
        paragraphs: [
          'Floats are not always exact, so a check that uses == on a float sum can fail for a reason that is not a bug. Compare with a tolerance instead.',
        ],
        examples: [
          { id: 'c03-assert-3', code: 'import math\n\ntry:\n    assert 0.1 + 0.2 == 0.3\n    print("exact")\nexcept AssertionError:\n    print("not exact")\nprint(math.isclose(0.1 + 0.2, 0.3))\n' },
        ],
        commonMistakes: ['FLOAT_EXACT_COMPARE'],
      },
    ],
  },
  {
    id: 'c03-testing/pytest-style',
    number: 2,
    title: 'Test functions',
    competency: 'pytest-style',
    jsNotes: [],
    intro: 'A test is a function that checks what another function returns. This game runs the test functions itself, one at a time.',
    sections: [
      {
        id: 'test-functions',
        docClaim: false,
        quotes: [],
        title: 'The game runs each test_ function',
        paragraphs: [
          'A test is a function whose name starts with test_. The game calls each one, and a test passes when it returns without an error.',
          'The game runs the tests itself. It does not run pytest, so pytest fixtures and plugins are not available here.',
        ],
        examples: [
          { id: 'c03-pytest-1', code: 'def test_adds_tax():\n    assert round(10 * 1.2, 2) == 12.0\n\n\ndef test_fails_on_purpose():\n    assert round(10 * 1.2, 2) == 13.0\n\n\ndef helper():\n    return 1\n\n\nfor name in ["test_adds_tax", "test_fails_on_purpose", "helper"]:\n    if name.startswith("test_"):\n        try:\n            globals()[name]()\n            print(name, "passed")\n        except AssertionError:\n            print(name, "failed")\n' },
        ],
        commonMistakes: ['HELPER_RUN_AS_TEST', 'ASSERT_SWALLOWED'],
      },
      {
        id: 'test-shape',
        docClaim: true,
        quotes: ['pytest-assert-standard'],
        title: 'A test checks the result with assert',
        paragraphs: [
          'Inside a test, call the function with inputs you choose, and use assert to check the result. The assert is what makes the test able to fail.',
        ],
        examples: [
          { id: 'c03-pytest-2', code: 'def in_batches(items, size):\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n\n\ndef test_splits_into_pairs():\n    assert list(in_batches([1, 2, 3], 2)) == [[1, 2], [3]]\n\n\ntest_splits_into_pairs()\nprint("test ran")\n' },
        ],
        commonMistakes: ['TEST_NEVER_RUN'],
      },
    ],
  },
  {
    id: 'c03-testing/good-cases',
    number: 3,
    title: 'Choosing good test cases',
    competency: 'good-test-cases',
    jsNotes: [],
    intro: 'A few well-chosen cases catch more bugs than many similar ones. Pick the edges of each rule, and always include the empty input.',
    sections: [
      {
        id: 'cases-boundaries',
        docClaim: false,
        quotes: [],
        title: 'Test the edges of each rule',
        paragraphs: [
          'Choose inputs at the edges of a rule: the size itself, a size that divides the items exactly, and a size just past the number of items.',
        ],
        examples: [
          { id: 'c03-cases-1', code: 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n\n\nfor size in (1, 3, 4):\n    print(size, list(in_batches([1, 2, 3], size)))\n' },
        ],
        commonMistakes: ['BOUNDARY_UNTESTED', 'SIZE_BELOW_ONE_UNTESTED', 'NAN_UNTESTED'],
      },
      {
        id: 'cases-empty',
        docClaim: false,
        quotes: [],
        title: 'Test the empty input',
        paragraphs: [
          'An empty input is a case of its own. Many bugs only appear when there are no items to work on.',
        ],
        examples: [
          { id: 'c03-cases-2', code: 'def in_batches(items, size):\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n\n\nprint(list(in_batches([], 3)))\nprint(len(list(in_batches([1], 3))))\n' },
        ],
        commonMistakes: ['EMPTY_INPUT_UNTESTED', 'ORDER_UNTESTED'],
      },
    ],
  },
  {
    id: 'c03-testing/test-first',
    number: 4,
    title: 'Test first, then fix',
    competency: 'test-driven-fixes',
    jsNotes: [],
    intro: 'Write the test before the fix, watch it fail, then change the code until the test passes. A fix is done when every test passes.',
    sections: [
      {
        id: 'test-first',
        docClaim: false,
        quotes: [],
        title: 'Watch the test fail first',
        paragraphs: [
          'Write the test first and run it. A test that fails on the broken code shows that the test can catch the bug.',
        ],
        examples: [
          { id: 'c03-first-1', code: 'def double(x):\n    return x + 1\n\n\ndef test_double():\n    assert double(3) == 6\n\n\ntry:\n    test_double()\n    print("passes")\nexcept AssertionError:\n    print("fails, so the fix is still needed")\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'test-fix',
        docClaim: false,
        quotes: [],
        title: 'A fix is done when every test passes',
        paragraphs: [
          'After the change, run every test, not only the one that failed. A fix that breaks another test is not done.',
        ],
        examples: [
          { id: 'c03-first-2', code: 'def double(x):\n    return x * 2\n\n\ndef test_double():\n    assert double(3) == 6\n\n\ndef test_double_zero():\n    assert double(0) == 0\n\n\nfor test in (test_double, test_double_zero):\n    test()\nprint("both tests pass")\n' },
        ],
        commonMistakes: [],
      },
    ],
  },
];
