// Chapter 3 choice items: 3 predict-the-output and 2 read-the-traceback. The right answer and every
// option come from running code. A wrong option is the output or error of a variant that a learner's
// mistake would produce.
import { MISTAKES, type MistakeTag } from '../mistakes';
import type { ChoiceItem, ChoiceVariant, PredictItem, TracebackItem } from '../types';

function variant(id: string, code: string, tag: MistakeTag): ChoiceVariant {
  return { id, code, mistake: MISTAKES[tag] };
}

const PREDICT_PROMPT = 'Predict the output before you run it. Choose the output the code prints.';
const TRACEBACK_PROMPT = 'The code below stops with an error. Choose the error it raises.';

export const PREDICT_ITEMS: PredictItem[] = [
  {
    id: 'c03-predict-assert-message',
    kind: 'predict',
    lessonId: 'c03-testing/assert',
    title: 'What does the failed check say?',
    prompt: PREDICT_PROMPT,
    code: 'def add_tax(amount):\n    return round(amount * 1.2, 2)\n\n\ntry:\n    assert add_tax(10) == 11.0, "tax is wrong"\n    print("passed")\nexcept AssertionError as error:\n    print("failed:", error)\n',
    variants: [
      variant('message-dropped', 'def add_tax(amount):\n    return round(amount * 1.2, 2)\n\n\ntry:\n    assert add_tax(10) == 11.0\n    print("passed")\nexcept AssertionError as error:\n    print("failed:", error)\n', 'ASSERT_MESSAGE_OMITTED'),
    ],
    hints: [
      'The check compares add_tax(10) with 11.0. Work out what add_tax(10) returns.',
      'When the assert fails, the message after the comma is the error text.',
      'The message is "tax is wrong", so the printed line ends with those words.',
    ],
  },
  {
    id: 'c03-predict-float-tolerance',
    kind: 'predict',
    lessonId: 'c03-testing/assert',
    title: 'Is 0.1 + 0.2 exactly 0.3?',
    prompt: PREDICT_PROMPT,
    code: 'try:\n    assert 0.1 + 0.2 == 0.3\n    print("exact")\nexcept AssertionError:\n    print("not exact")\nprint(round(0.1 + 0.2, 2) == 0.3)\n',
    variants: [
      variant('exact-sums', 'try:\n    assert 0.5 + 0.25 == 0.75\n    print("exact")\nexcept AssertionError:\n    print("not exact")\nprint(round(0.1 + 0.2, 2) == 0.3)\n', 'FLOAT_EXACT_COMPARE'),
    ],
    hints: [
      'Binary floats cannot hold 0.1 or 0.2 exactly, so their sum may not be exactly 0.3.',
      'Check the first try block separately from the last line, which rounds first.',
      'The first check fails, so "not exact" is printed. Rounding to two places makes the last line True.',
    ],
  },
  {
    id: 'c03-predict-test-runner',
    kind: 'predict',
    lessonId: 'c03-testing/pytest-style',
    title: 'Which functions does the runner count as tests?',
    prompt: PREDICT_PROMPT,
    code: 'def test_total():\n    assert sum([1, 2]) == 3\n\n\ndef test_empty():\n    assert sum([]) == 1\n\n\ndef helper():\n    assert False\n\n\nresults = {}\nfor name in ["test_total", "test_empty", "helper"]:\n    if name.startswith("test_"):\n        try:\n            globals()[name]()\n            results[name] = "pass"\n        except AssertionError:\n            results[name] = "fail"\nprint(results)\n',
    variants: [
      variant('helper-counted', 'def test_total():\n    assert sum([1, 2]) == 3\n\n\ndef test_empty():\n    assert sum([]) == 1\n\n\ndef helper():\n    assert False\n\n\nresults = {}\nfor name in ["test_total", "test_empty", "helper"]:\n    if True:\n        try:\n            globals()[name]()\n            results[name] = "pass"\n        except AssertionError:\n            results[name] = "fail"\nprint(results)\n', 'HELPER_RUN_AS_TEST'),
      variant('swallowed', 'def test_total():\n    assert sum([1, 2]) == 3\n\n\ndef test_empty():\n    assert sum([]) == 1\n\n\ndef helper():\n    assert False\n\n\nresults = {}\nfor name in ["test_total", "test_empty", "helper"]:\n    if name.startswith("test_"):\n        try:\n            globals()[name]()\n            results[name] = "pass"\n        except AssertionError:\n            results[name] = "pass"\nprint(results)\n', 'ASSERT_SWALLOWED'),
    ],
    hints: [
      'The loop only calls a name when the if test is true. Read that test.',
      'sum([]) is 0, so the assert in test_empty fails. The helper is never named test_.',
      'Only names that start with test_ get a result, so helper does not appear in the output.',
    ],
  },
];

export const TRACEBACK_ITEMS: TracebackItem[] = [
  {
    id: 'c03-traceback-test-without-function',
    kind: 'traceback',
    lessonId: 'c03-testing/pytest-style',
    title: 'Why does the test stop?',
    prompt: TRACEBACK_PROMPT,
    code: 'def test_batches():\n    assert in_batches([1, 2, 3], 2) == [[1, 2], [3]]\n\n\ntest_batches()\n',
    variants: [
      variant('never-called', 'def test_batches():\n    assert in_batches([1, 2, 3], 2) == [[1, 2], [3]]\n', 'TEST_NEVER_RUN'),
    ],
    hints: [
      'The test calls in_batches, and the code never defines or imports it. Look for that name.',
      'A name that is not defined raises NameError as soon as the line that uses it runs.',
      'test_batches() runs the test, and the first line of the test raises NameError for in_batches.',
    ],
  },
  {
    id: 'c03-traceback-assert-message',
    kind: 'traceback',
    lessonId: 'c03-testing/assert',
    title: 'What does the failed check raise?',
    prompt: TRACEBACK_PROMPT,
    code: 'def parcels_left(total, shipped):\n    return total - shipped\n\n\nleft = parcels_left(10, 12)\nassert left >= 0, f"more shipped than stocked: left {left}"\n',
    variants: [
      variant('raises-value', 'def parcels_left(total, shipped):\n    return total - shipped\n\n\nleft = parcels_left(10, 12)\nif left < 0:\n    raise ValueError(f"more shipped than stocked: left {left}")\n', 'ASSERT_WRONG_EXCEPTION'),
    ],
    hints: [
      'parcels_left returns 10 minus 12, which is negative. The check is left >= 0.',
      'A failed assert raises AssertionError, and the message after the comma becomes its text.',
      'The message is built from left, which is -2, so the text ends with left -2.',
    ],
  },
];

export const CHOICE_ITEMS: ChoiceItem[] = [...PREDICT_ITEMS, ...TRACEBACK_ITEMS];
