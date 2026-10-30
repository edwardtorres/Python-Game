import type { ChallengeSpec } from '../types';

// A function task (Foundations). The reference is written out in full so the grader can
// compare results on every case. Each stated rule has a wrong variant that breaks only it.
const REFERENCE = `from decimal import Decimal, ROUND_HALF_UP, localcontext


def _round2(number):
    with localcontext() as context:
        context.prec = 80
        return float(number.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def clean_weights(values):
    cleaned = []
    for raw in values:
        if raw is None:
            continue
        if isinstance(raw, bool):
            continue
        if isinstance(raw, str):
            text = raw.strip()
            if text == "":
                continue
            try:
                number = Decimal(text)
            except Exception:
                continue
        elif isinstance(raw, (int, float)):
            number = Decimal(str(raw))
        else:
            continue
        if not number.is_finite():
            continue
        if number < 0:
            continue
        cleaned.append(_round2(number))
    return cleaned
`;

const STARTER = `def clean_weights(values):
    """Return the usable weights from a list of raw scale readings.

    Rules:
    1. Return a new list of floats in the original order.
    2. Drop None and blank text.
    3. Drop anything that is not a finite number: text such as 'abc', 'nan', or 'inf',
       and the booleans True and False.
    4. Drop negative weights. Keep zero.
    5. Keep duplicates.
    6. Round each weight to 2 decimals, and round halves up: '2.345' becomes 2.35.
    """
    pass
`;

const VARIANTS = [
  {
    id: 'round-builtin',
    code: REFERENCE.replace('return float(number.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))', 'return round(float(number), 2)'),
    mistake: {
      tag: 'rounding',
      title: 'round() rounds halves to even on binary floats',
      explanation: "round(2.345, 2) gives 2.34, because 2.345 is stored as a binary float just below the halfway point. The rule asks for halves to round up, which needs Decimal with ROUND_HALF_UP.",
    },
  },
  {
    id: 'keeps-negatives',
    code: REFERENCE.replace('        if number < 0:\n            continue\n', ''),
    mistake: {
      tag: 'missed-rule',
      title: 'Negative weights slipped through',
      explanation: 'Rule 4 drops negative weights. A check on the sign is missing, so a reading like -3 goes into the output.',
    },
  },
  {
    id: 'drops-zero',
    code: REFERENCE.replace('        if number < 0:\n            continue\n', '        if number <= 0:\n            continue\n'),
    mistake: {
      tag: 'boundary',
      title: 'The boundary case was dropped',
      explanation: 'Rule 4 says zero is a valid reading. The comparison should be "less than 0", not "less than or equal to 0".',
    },
  },
  {
    id: 'sorts-output',
    code: `${REFERENCE}\n\nclean_weights_unsorted = clean_weights\n\n\ndef clean_weights(values):\n    return sorted(clean_weights_unsorted(values))\n`,
    mistake: {
      tag: 'ordering',
      title: 'The output was sorted',
      explanation: 'Rule 1 keeps the original order. sorted() changes it, and the dashboard expects the readings in the order they arrived.',
    },
  },
  {
    id: 'drops-duplicates',
    code: `${REFERENCE}\n\nclean_weights_all = clean_weights\n\n\ndef clean_weights(values):\n    return list(dict.fromkeys(clean_weights_all(values)))\n`,
    mistake: {
      tag: 'duplicates',
      title: 'Duplicates were removed',
      explanation: 'Rule 5 keeps duplicate readings, because each one is a separate scale event. dict.fromkeys() quietly removes repeats.',
    },
  },
  {
    id: 'bools-as-numbers',
    code: REFERENCE.replace('        if isinstance(raw, bool):\n            continue\n', '        if isinstance(raw, bool):\n            cleaned.append(1.0 if raw else 0.0)\n            continue\n'),
    mistake: {
      tag: 'type-coercion',
      title: 'Booleans were treated as numbers',
      explanation: 'Rule 3 drops booleans. In Python, True is a subclass of int, so isinstance(True, int) is True. Check for bool before int, as the reference does.',
    },
  },
  {
    id: 'none-as-zero',
    code: REFERENCE.replace('        if raw is None:\n            continue\n', '        if raw is None:\n            cleaned.append(0.0)\n            continue\n'),
    mistake: {
      tag: 'missing-data',
      title: 'Missing readings became zero',
      explanation: 'Rule 2 drops missing readings. Turning None into 0.0 invents a weight the scale never reported, which pulls averages down.',
    },
  },
];

export const cleanWeights: ChallengeSpec = {
  id: 'clean-weights',
  chapterId: 'c01-foundations',
  title: 'Clean the dock scale readings',
  kind: 'function',
  notebook: false,
  ticket: {
    from: 'Maren Osei, Dock Operations',
    subject: 'Dock scale readings are messy',
    body: 'The dock scales export weights as text. Some readings are blank, some are negative, and some are just wrong. The dashboard breaks on them. Could you write clean_weights(values) so it only sees usable weights? I have pasted the rules below.',
  },
  rules: [
    'Return a new list of floats in the original order.',
    'Drop None and blank text.',
    "Drop anything that is not a finite number: text such as 'abc', 'nan', or 'inf', and the booleans True and False.",
    'Drop negative weights. Keep zero.',
    'Keep duplicates.',
    "Round each weight to 2 decimals, and round halves up: '2.345' becomes 2.35.",
  ],
  entry: 'clean_weights',
  starter: STARTER,
  competencies: ['types', 'functions-params', 'control-flow', 'exceptions', 'lists'],
  datasets: [],
  cases: [
    { id: 'v-mixed', label: 'A typical mixed export', visibility: 'visible', args: [[' 12.5 ', null, '', 'abc', -3, 0, 2.345, true]] },
    { id: 'v-empty', label: 'An empty export', visibility: 'visible', args: [[]] },
    { id: 'v-text-numbers', label: 'Numbers stored as text', visibility: 'visible', args: [[5, '5', '2.345', '2.355']] },
    { id: 'h-empty-markers', label: 'Only missing markers', visibility: 'hidden', args: [[null, '', '   ', 'abc', true, false]] },
    { id: 'h-non-finite', label: 'Non-finite text', visibility: 'hidden', args: [['nan', 'inf', 'Infinity', '-inf']] },
    { id: 'h-boundaries', label: 'Zero and sign boundaries', visibility: 'hidden', args: [[0, '0', '-0.5', -0.001, '0.004']] },
    { id: 'h-halves', label: 'Halves round up', visibility: 'hidden', args: [[2.345, 2.355, 2.994, 2.995]] },
    { id: 'h-duplicates-order', label: 'Duplicates keep their order', visibility: 'hidden', args: [[10, 'x', 3, 10, 2.5]] },
    { id: 'h-large', label: 'A very large reading', visibility: 'hidden', args: [[1e30, '2.345e3']] },
  ],
  rulesForGrader: { tolerance: 1e-9 },
  reference: REFERENCE,
  variants: VARIANTS,
  variantRule: {
    'round-builtin': 5,
    'keeps-negatives': 3,
    'drops-zero': 3,
    'sorts-output': 0,
    'drops-duplicates': 4,
    'bools-as-numbers': 2,
    'none-as-zero': 1,
  },
  hints: [
    'Think about each reading on its own. For each one, ask: does it pass every rule, and if so, what goes into the output?',
    'Go through the readings in order. Skip any reading that fails a rule, convert the rest to a Decimal, round it half-up, and append it to a new list.',
    'Start like this:\n\n    cleaned = []\n    for raw in values:\n        if raw is None:\n            continue\n        # ...check the other rules, then append the rounded value',
  ],
};
