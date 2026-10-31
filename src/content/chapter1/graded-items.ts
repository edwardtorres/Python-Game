// Chapter 1 graded items: 4 guided functions, 4 tickets, 3 fix-the-bug tasks, 2 structure
// tasks, and a boss with four graded parts. Write tasks start from a bare `pass` skeleton.
// Only fix-the-bug tasks start from broken code.
//
// Coverage: every stated rule has a wrong variant that breaks exactly that rule, and each
// variant is caught by at least two cases, with at least one variant failing a visible case.
// The content checks (src/content/chapters.test.ts) check this for every item.
import type { ChallengeSpec, Ticket } from '../../challenges/types';
import type { FunctionCase, StructureCheck, WrongVariant } from '../../engine/types';
import { MISTAKES, type MistakeTag } from '../mistakes';

type Variant = [id: string, code: string, tag: MistakeTag, rule: number];

function fn(id: string, label: string, visibility: 'visible' | 'hidden', args: unknown[], kwargs?: Record<string, unknown>): FunctionCase {
  return kwargs === undefined ? { id, label, visibility, args } : { id, label, visibility, args, kwargs };
}

interface FunctionItem {
  id: string;
  title: string;
  lessonId: string;
  competencies: string[];
  ticket: Ticket;
  rules: string[];
  entry: string;
  starter: string;
  reference: string;
  cases: FunctionCase[];
  variants: Variant[];
  hints: [string, string, string];
  // Structure tasks are graded by ast checks instead of cases.
  structure?: StructureCheck[];
}

function toWrong(variants: Variant[]): { wrong: WrongVariant[]; rules: Record<string, number> } {
  const rules: Record<string, number> = {};
  const wrong = variants.map(([id, code, tag, rule]) => {
    rules[id] = rule;
    return { id, code, mistake: MISTAKES[tag] };
  });
  return { wrong, rules };
}

function functionSpec(item: FunctionItem): ChallengeSpec {
  const { wrong, rules } = toWrong(item.variants);
  const base: ChallengeSpec = {
    id: item.id,
    chapterId: 'c01-foundations',
    title: item.title,
    kind: 'function',
    notebook: false,
    ticket: item.ticket,
    rules: item.rules,
    entry: item.entry,
    starter: item.starter,
    competencies: item.competencies,
    datasets: [],
    cases: item.cases,
    rulesForGrader: {},
    reference: item.reference,
    variants: wrong,
    variantRule: rules,
    hints: item.hints,
  };
  return item.structure === undefined ? base : { ...base, kind: 'structure', structureChecks: item.structure };
}

const FUNCTION_ITEMS: FunctionItem[] = [
  // Guided: strings and f-strings.
  {
    id: 'c01-guided-format-label',
    title: 'Guided: format a label',
    lessonId: 'c01-foundations/strings-fstrings',
    competencies: ['strings-fstrings'],
    ticket: { from: 'Priya, Dock Operations', subject: 'Labels for the pallet board', body: 'Each pallet board line reads "name: count items". Trim spaces, tabs, and line breaks around the name.' },
    rules: ['Return the name, then a colon, a space, the count, and the word items.', 'Remove whitespace from both ends of the name: spaces, tabs, and line breaks.'],
    entry: 'format_label',
    starter: 'def format_label(name, count):\n    pass\n',
    reference: 'def format_label(name, count):\n    return f"{name.strip()}: {count} items"\n',
    cases: [
      fn('v-plain', 'A plain name', 'visible', ['Ada', 3]),
      fn('v-padded', 'A name with spaces around it', 'visible', ['  Bo ', 0]),
      fn('h-long', 'A longer name', 'hidden', ['Marta', 12]),
      fn('h-padded-left', 'Spaces only on the left', 'hidden', ['  Li', 1]),
      fn('v-tabs', 'A tab and a line break around the name', 'visible', ['\tAda\n', 3]),
      fn('h-mixed', 'A tab, a space, and a line break', 'hidden', ['Bo\t \n', 0]),
    ],
    variants: [
      ['no-items-word', 'def format_label(name, count):\n    return f"{name.strip()}: {count}"\n', 'FORMAT_SPEC', 0],
      ['no-strip', 'def format_label(name, count):\n    return f"{name}: {count} items"\n', 'STR_IMMUTABLE', 1],
      ['strips-spaces-only', 'def format_label(name, count):\n    return name.strip(" ") + f": {count} items"\n', 'PARTIAL_STRIP', 1],
    ],
    hints: [
      'The result is one f-string. Read the rule for the exact words and punctuation.',
      'Put the name in braces, then the count. Strip the name first; the rule says so.',
      'return f"{name.strip()}: {count} items"',
    ],
  },
  // Guided: dicts.
  {
    id: 'c01-guided-count-by-mode',
    title: 'Guided: count shipments by mode',
    lessonId: 'c01-foundations/dicts',
    competencies: ['dicts'],
    ticket: { from: 'Marcus, Route Planning', subject: 'Shipments per mode', body: 'Each record has a "mode" key. Count how many records each mode has. An empty export gives an empty count.' },
    rules: ['Count each record under its mode.', 'An empty list gives an empty dict, not None.'],
    entry: 'count_by_mode',
    starter: 'def count_by_mode(records):\n    pass\n',
    reference: 'def count_by_mode(records):\n    counts = {}\n    for record in records:\n        mode = record["mode"]\n        counts[mode] = counts.get(mode, 0) + 1\n    return counts\n',
    cases: [
      fn('v-mixed', 'Road, rail, and road again', 'visible', [[{ mode: 'road' }, { mode: 'rail' }, { mode: 'road' }]]),
      fn('v-empty', 'An empty export', 'visible', [[]]),
      fn('h-sea-air', 'Sea and air', 'hidden', [[{ mode: 'sea' }, { mode: 'air' }, { mode: 'sea' }, { mode: 'sea' }]]),
      fn('h-empty-again', 'Another empty export', 'hidden', [[]]),
    ],
    variants: [
      ['counts-once', 'def count_by_mode(records):\n    counts = {}\n    for record in records:\n        counts[record["mode"]] += 1\n    return counts\n', 'KEYERROR_VS_GET', 0],
      ['none-when-empty', 'def count_by_mode(records):\n    if not records:\n        return None\n    counts = {}\n    for record in records:\n        mode = record["mode"]\n        counts[mode] = counts.get(mode, 0) + 1\n    return counts\n', 'TRUTHINESS', 1],
    ],
    hints: [
      'Start with an empty dict, then go through the records one at a time.',
      'For each record, read its mode and add 1 to that mode in the dict. get() with a default avoids a KeyError on the first record.',
      'counts[mode] = counts.get(mode, 0) + 1, inside a for loop over records, then return counts.',
    ],
  },
  // Guided: control flow.
  {
    id: 'c01-guided-classify-weight',
    title: 'Guided: classify a parcel weight',
    lessonId: 'c01-foundations/control-flow',
    competencies: ['control-flow'],
    ticket: { from: 'Sam, Loading Bay', subject: 'Weight bands', body: 'Under 5 kg is light. From 5 to 20 kg, including both ends, is medium. Above 20 kg is heavy.' },
    rules: ['Under 5 kg is "light".', 'From 5 to 20 kg, including 5 and 20, is "medium".', 'Above 20 kg is "heavy".'],
    entry: 'classify_weight',
    starter: 'def classify_weight(kg):\n    pass\n',
    reference: 'def classify_weight(kg):\n    if kg < 5:\n        return "light"\n    if kg <= 20:\n        return "medium"\n    return "heavy"\n',
    cases: [
      fn('v-light', 'Three kilos', 'visible', [3]),
      fn('v-five', 'Exactly five kilos', 'visible', [5]),
      fn('v-twenty', 'Exactly twenty kilos', 'visible', [20]),
      fn('v-heavy', 'Twenty-six kilos', 'visible', [26]),
      fn('h-just-under', 'Four and a half kilos', 'hidden', [4.5]),
      fn('h-just-under-two', 'Four and two tenths of a kilo', 'hidden', [4.2]),
      fn('h-five-float', 'Five as a float', 'hidden', [5.0]),
      fn('h-twenty-float', 'Twenty as a float', 'hidden', [20.0]),
      fn('h-twenty-one', 'Twenty-one kilos', 'hidden', [21]),
      fn('h-twenty-three', 'Twenty-three kilos', 'hidden', [23]),
      fn('h-zero', 'Zero kilos', 'hidden', [0]),
    ],
    variants: [
      ['five-light', 'def classify_weight(kg):\n    if kg <= 5:\n        return "light"\n    if kg <= 20:\n        return "medium"\n    return "heavy"\n', 'OFF_BY_ONE_RANGE', 1],
      ['twenty-heavy', 'def classify_weight(kg):\n    if kg < 5:\n        return "light"\n    if kg < 20:\n        return "medium"\n    return "heavy"\n', 'OFF_BY_ONE_RANGE', 1],
      ['light-to-four', 'def classify_weight(kg):\n    if kg <= 4:\n        return "light"\n    if kg <= 20:\n        return "medium"\n    return "heavy"\n', 'OFF_BY_ONE_RANGE', 0],
      ['heavy-from-twenty-six', 'def classify_weight(kg):\n    if kg < 5:\n        return "light"\n    if kg <= 25:\n        return "medium"\n    return "heavy"\n', 'OFF_BY_ONE_RANGE', 2],
      // (The hidden cases at 21 and 23 kilos catch this variant twice. The visible 26 kilo case does not.)
    ],
    hints: [
      'Three bands, checked in order. Each if returns as soon as it matches.',
      'Check the small limit first with <. Then check the top of the middle band with <=, since 20 is medium.',
      'if kg < 5: return "light"; if kg <= 20: return "medium"; return "heavy"',
    ],
  },
  // Guided: generators.
  {
    id: 'c01-guided-in-batches',
    title: 'Guided: send parcels in batches',
    lessonId: 'c01-foundations/iterators-generators',
    competencies: ['iterators-generators'],
    ticket: { from: 'Hana, Outbound', subject: 'Batches of parcels', body: 'Give the parcel list in batches of a given size. Each batch holds 1 to size items, in order. An empty list gives no batches. A size below 1 is a mistake: raise ValueError.' },
    rules: ['Each batch holds between 1 and size items, and the last batch may be shorter.', 'The items keep their order, both between batches and inside each batch.', 'An empty input gives no batches.', 'A size below 1 raises ValueError, as itertools.batched does.'],
    entry: 'in_batches',
    starter: 'def in_batches(items, size):\n    pass\n',
    reference: 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n',
    cases: [
      fn('v-five-by-two', 'Five parcels in pairs', 'visible', [[1, 2, 3, 4, 5], 2]),
      fn('v-empty', 'No parcels', 'visible', [[], 3]),
      fn('h-letters', 'Three letters in one batch', 'hidden', [['a', 'b', 'c'], 3]),
      fn('h-seven-by-three', 'Seven parcels in threes', 'hidden', [[1, 2, 3, 4, 5, 6, 7], 3]),
      fn('h-empty-size-one', 'No parcels, size one', 'hidden', [[], 1]),
      fn('h-size-zero-items', 'Size zero with parcels', 'hidden', [[1, 2, 3], 0]),
      fn('h-size-zero-empty', 'Size zero with no parcels', 'hidden', [[], 0]),
    ],
    variants: [
      ['reversed-inside', 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    batch = []\n    for item in items:\n        batch.insert(0, item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n', 'INSERT_AT_FRONT', 1],
      ['size-plus-one', 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size + 1:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n', 'OFF_BY_ONE_RANGE', 0],
      ['one-empty-batch', 'def in_batches(items, size):\n    if size < 1:\n        raise ValueError("size must be at least 1")\n    if len(items) == 0:\n        yield [None]\n        return\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n', 'EMPTY_IS_NONE', 2],
      ['no-size-check', 'def in_batches(items, size):\n    batch = []\n    for item in items:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n', 'UNCHECKED_ARGUMENT', 3],
    ],
    hints: [
      'Check size first: a size below 1 raises ValueError. Then collect items into a list, and when the list reaches size, yield it and start a new one.',
      'After the loop, a leftover batch still needs yielding. An empty list must not produce a batch.',
      'Use if batch: before the last yield, and yield batch inside the loop when len(batch) == size.',
    ],
  },
  // Ticket: sets.
  {
    id: 'c01-ticket-unique-routes',
    title: 'Ticket: unique routes',
    lessonId: 'c01-foundations/sets',
    competencies: ['sets'],
    ticket: { from: 'Dev, Network Planning', subject: 'Route list for the board', body: 'The stop list has repeats. Give the board each stop once, in A to Z order.' },
    rules: ['Each stop appears once.', 'The list is in A to Z order.'],
    entry: 'unique_routes',
    starter: 'def unique_routes(stops):\n    pass\n',
    reference: 'def unique_routes(stops):\n    return sorted(set(stops))\n',
    cases: [
      fn('v-dock-repeat', 'A stop listed twice', 'visible', [['Dock 2', 'Dock 1', 'Dock 2']]),
      fn('v-empty', 'No stops', 'visible', [[]]),
      fn('h-yard', 'Yard, Gate, Yard, Bay', 'hidden', [['Yard', 'Gate', 'Yard', 'Bay']]),
      fn('h-letters', 'Letters with repeats', 'hidden', [['b', 'a', 'c', 'a', 'b']]),
    ],
    variants: [
      ['keeps-repeats', 'def unique_routes(stops):\n    return sorted(stops)\n', 'SET_ORDER_ASSUMPTION', 0],
      ['first-seen-order', 'def unique_routes(stops):\n    return list(dict.fromkeys(stops))\n', 'DICT_ORDER_ASSUMPTION', 1],
    ],
    hints: [
      'A set removes repeats. What does the rule say about the order of the result?',
      'The rule asks for A to Z, so the set has to be sorted before it is returned.',
      'return sorted(set(stops))',
    ],
  },
  // Ticket: tuples.
  {
    id: 'c01-ticket-route-pairs',
    title: 'Ticket: route pairs',
    lessonId: 'c01-foundations/tuples',
    competencies: ['tuples'],
    ticket: { from: 'Dev, Network Planning', subject: 'Legs of a trip', body: 'A trip visits stops in order. Give one (from, to) pair for each leg. A trip with one stop has no legs.' },
    rules: ['Each leg is a (from, to) pair, in trip order.', 'There is one pair for each pair of neighbouring stops.', 'A trip with one stop gives an empty list.'],
    entry: 'route_pairs',
    starter: 'def route_pairs(stops):\n    pass\n',
    reference: 'def route_pairs(stops):\n    return [(a, b) for a, b in zip(stops, stops[1:])]\n',
    cases: [
      fn('v-three', 'Three stops', 'visible', [['Dock 1', 'Bay 2', 'Gate']]),
      fn('v-single', 'One stop', 'visible', [['Yard']]),
      fn('h-two', 'Two stops', 'hidden', [['A', 'B']]),
      fn('h-four', 'Four stops', 'hidden', [['A', 'B', 'C', 'D']]),
      fn('h-none', 'No stops', 'hidden', [[]]),
      fn('h-solo', 'Another single stop', 'hidden', [['Solo']]),
    ],
    variants: [
      ['swapped', 'def route_pairs(stops):\n    return [(b, a) for a, b in zip(stops, stops[1:])]\n', 'PAIR_ORDER', 0],
      ['skips-a-stop', 'def route_pairs(stops):\n    return [(a, b) for a, b in zip(stops, stops[2:])]\n', 'OFF_BY_ONE_RANGE', 1],
      ['single-stop-pair', 'def route_pairs(stops):\n    if len(stops) == 1:\n        return [(stops[0], stops[0])]\n    return [(a, b) for a, b in zip(stops, stops[1:])]\n', 'SINGLE_STOP_EDGE', 2],
    ],
    hints: [
      'Pair each stop with the stop after it. zip() can pair two lists that are offset by one.',
      'zip(stops, stops[1:]) pairs each stop with the next one. Use a comprehension to build the tuples.',
      'return [(a, b) for a, b in zip(stops, stops[1:])]',
    ],
  },
  // Ticket: *args and **kwargs.
  {
    id: 'c01-ticket-build-label',
    title: 'Ticket: build a crate label',
    lessonId: 'c01-foundations/functions-params',
    competencies: ['functions-params'],
    ticket: { from: 'Priya, Dock Operations', subject: 'Crate labels', body: 'A label starts with the name. Tags go in brackets, in the order given. Options come last, as key=value, sorted by key.' },
    rules: ['The name comes first.', 'Tags go in square brackets, in the order given, separated by ", ". No tags means no brackets.', 'Options are added as key=value, sorted by key.'],
    entry: 'build_label',
    starter: 'def build_label(name, *tags, **options):\n    pass\n',
    reference: 'def build_label(name, *tags, **options):\n    label = name\n    if tags:\n        label += " [" + ", ".join(tags) + "]"\n    for key in sorted(options):\n        label += f" {key}={options[key]}"\n    return label\n',
    cases: [
      fn('v-crate', 'A crate with tags and options', 'visible', ['Crate', 'fragile', 'eu'], { size: 2, color: 'red' }),
      fn('v-pallet', 'A pallet with no tags', 'visible', ['Pallet']),
      fn('h-three-tags', 'Three tags', 'hidden', ['Box', 'a', 'b', 'c']),
      fn('h-options-out-of-order', 'Options given out of order', 'hidden', ['Tote'], { weight: 5, label: 'x' }),
      fn('h-tags-out-of-order', 'Tags not in alphabetical order', 'hidden', ['Bin', 'zeta', 'alpha']),
    ],
    variants: [
      ['sorted-tags', 'def build_label(name, *tags, **options):\n    label = name\n    if tags:\n        label += " [" + ", ".join(sorted(tags)) + "]"\n    for key in sorted(options):\n        label += f" {key}={options[key]}"\n    return label\n', 'SORTED_CHANGES_ORDER', 1],
      ['options-as-given', 'def build_label(name, *tags, **options):\n    label = name\n    if tags:\n        label += " [" + ", ".join(tags) + "]"\n    for key, value in options.items():\n        label += f" {key}={value}"\n    return label\n', 'DICT_ORDER_ASSUMPTION', 2],
      ['name-lost-without-tags', 'def build_label(name, *tags, **options):\n    label = name\n    if not tags:\n        label = ""\n    else:\n        label += " [" + ", ".join(tags) + "]"\n    for key in sorted(options):\n        label += f" {key}={options[key]}"\n    return label\n', 'TRUTHINESS', 0],
    ],
    hints: [
      'The name is the first parameter. *tags collects the tags as a tuple, and **options collects the keyword options as a dict.',
      'Add the tags in brackets only when there are some. Options use sorted(options) to put keys in order.',
      'label = name; if tags: label += " [" + ", ".join(tags) + "]"; then for each key in sorted(options) add f" {key}={options[key]}".',
    ],
  },
  // Ticket: exceptions.
  {
    id: 'c01-ticket-parse-weight',
    title: 'Ticket: read a weight',
    lessonId: 'c01-foundations/exceptions',
    competencies: ['exceptions'],
    ticket: { from: 'Sam, Loading Bay', subject: 'Scanner weights', body: 'The scanner sends weights as text. Return a float. Return None when the text is not a number, and also for nan and inf, which are not weights. Any other input is a bug, so it must still raise TypeError.' },
    rules: ['Text such as " 4.5 " gives the float 4.5.', 'Text that is not a number gives None.', 'A value that is not text raises TypeError.', 'Text that reads as nan or inf gives None, because it is not a weight.'],
    entry: 'parse_weight',
    starter: 'def parse_weight(text):\n    pass\n',
    reference: 'import math\n\n\ndef parse_weight(text):\n    if not isinstance(text, str):\n        raise TypeError("text must be a string")\n    try:\n        value = float(text.strip())\n    except ValueError:\n        return None\n    if not math.isfinite(value):\n        return None\n    return value\n',
    cases: [
      fn('v-decimal', 'A decimal weight', 'visible', ['4.5']),
      fn('v-letters', 'Letters', 'visible', ['abc']),
      fn('v-number', 'A number, not text', 'visible', [12]),
      fn('h-padded', 'Padded whole number', 'hidden', [' 7 ']),
      fn('h-empty', 'Empty text', 'hidden', ['']),
      fn('h-none', 'No value at all', 'hidden', [null]),
      fn('h-decimal-two', 'Another decimal', 'hidden', ['2.75']),
      fn('h-nan', 'Not-a-number text', 'hidden', ['nan']),
      fn('h-inf', 'Infinity text', 'hidden', ['inf']),
    ],
    variants: [
      ['no-fallback', 'def parse_weight(text):\n    if not isinstance(text, str):\n        raise TypeError("text must be a string")\n    return float(text.strip())\n', 'NO_FALLBACK', 1],
      ['catches-everything', 'def parse_weight(text):\n    try:\n        return float(text)\n    except Exception:\n        return None\n', 'EXCEPTION_TOO_BROAD', 2],
      ['returns-non-finite', 'def parse_weight(text):\n    if not isinstance(text, str):\n        raise TypeError("text must be a string")\n    try:\n        return float(text.strip())\n    except ValueError:\n        return None\n', 'NON_FINITE_FLOAT', 3],
      ['whole-numbers-only', 'def parse_weight(text):\n    if not isinstance(text, str):\n        raise TypeError("text must be a string")\n    try:\n        return float(int(text.strip()))\n    except ValueError:\n        return None\n', 'INT_FROM_TEXT', 0],
    ],
    hints: [
      'float() reads decimal text and raises ValueError when the text is not a number.',
      'Catch ValueError around the float() call, and return None inside that except. Let other errors through.',
      'Check the type first: if not isinstance(text, str): raise TypeError(...). Then try: value = float(text.strip()) except ValueError: return None. Last, return None when math.isfinite(value) is false.',
    ],
  },
  // Ticket: with blocks. Real file I/O in the grader's virtual filesystem.
  {
    id: 'c01-ticket-save-lines',
    title: 'Ticket: save and reload the batch notes',
    lessonId: 'c01-foundations/with-blocks',
    competencies: ['with-blocks'],
    ticket: { from: 'Hana, Outbound', subject: 'Batch notes on disk', body: 'Write each note on its own line to the file at the given path, then read the file back. Use a with block for each open file, so each file is closed before the next step.' },
    rules: ['Each note is written on its own line, and the file ends with a line break after the last note.', 'Reading the file back gives the notes without their line breaks.', 'An empty list of notes gives an empty list back.'],
    entry: 'save_and_reload',
    starter: 'def save_and_reload(path, lines):\n    pass\n',
    reference: 'def save_and_reload(path, lines):\n    with open(path, "w") as handle:\n        for line in lines:\n            handle.write(line + "\\n")\n    with open(path) as handle:\n        return [line.rstrip("\\n") for line in handle]\n',
    cases: [
      fn('v-two-notes', 'Two notes', 'visible', ['notes.txt', ['Dock 1', 'Dock 2']]),
      fn('v-no-notes', 'No notes', 'visible', ['empty.txt', []]),
      fn('h-one-note', 'One note', 'hidden', ['bay.txt', ['Bay 2 is full']]),
      fn('h-blank-note', 'A blank note in the middle', 'hidden', ['gate.txt', ['a', '', 'b']]),
      fn('h-no-notes-again', 'No notes, another file', 'hidden', ['empty2.txt', []]),
    ],
    variants: [
      ['no-line-break', 'def save_and_reload(path, lines):\n    with open(path, "w") as handle:\n        for line in lines:\n            handle.write(line)\n    with open(path) as handle:\n        return [line.rstrip("\\n") for line in handle]\n', 'LINE_ENDINGS', 0],
      ['keeps-line-breaks', 'def save_and_reload(path, lines):\n    with open(path, "w") as handle:\n        for line in lines:\n            handle.write(line + "\\n")\n    with open(path) as handle:\n        return [line for line in handle]\n', 'LINE_ENDINGS', 1],
      ['blank-for-no-notes', 'def save_and_reload(path, lines):\n    with open(path, "w") as handle:\n        for line in lines or [""]:\n            handle.write(line + "\\n")\n    with open(path) as handle:\n        return [line.rstrip("\\n") for line in handle]\n', 'TRUTHINESS', 2],
    ],
    hints: [
      'Open the file with a with block for writing, and write each note followed by a line break.',
      'After that block ends, open the file again with its own with block for reading, and strip the line break from each line.',
      'with open(path, "w") as handle: ... handle.write(line + "\\n")  — then read it back in a second with block.',
    ],
  },
  // Fix-the-bug: lists.
  {
    id: 'c01-fix-with-extra',
    title: 'Fix: add a parcel to the end',
    lessonId: 'c01-foundations/lists',
    competencies: ['lists'],
    ticket: { from: 'Hana, Outbound', subject: 'Parcel appears in the wrong place', body: 'with_extra should keep every parcel and add the new one at the end. The current code overwrites the last parcel, and it fails on an empty list.' },
    rules: ['The result keeps every item and adds extra at the end.', 'An empty list gives a list with only extra.'],
    entry: 'with_extra',
    starter: 'def with_extra(items, extra):\n    items[-1] = extra\n    return items\n',
    reference: 'def with_extra(items, extra):\n    return [*items, extra]\n',
    cases: [
      fn('v-two', 'Two items and one more', 'visible', [[1, 2], 3]),
      fn('v-empty', 'An empty list', 'visible', [[], 'x']),
      fn('h-one', 'One item', 'hidden', [['a'], 'b']),
      fn('h-three', 'Three items', 'hidden', [[5, 6, 7], 8]),
      fn('h-zero', 'An empty list of numbers', 'hidden', [[], 0]),
    ],
    variants: [
      ['drops-last', 'def with_extra(items, extra):\n    return items[:-1] + [extra]\n', 'SLICE_DROPS_LAST', 0],
      ['adds-at-front', 'def with_extra(items, extra):\n    return [extra, *items]\n', 'INSERT_AT_FRONT', 0],
      ['empty-returned', 'def with_extra(items, extra):\n    if not items:\n        return items\n    return [*items, extra]\n', 'TRUTHINESS', 1],
    ],
    hints: [
      'The new parcel must be added, not swapped with the last one.',
      'Build a new list with all the old items, then the new one. Unpacking with * does this in one step.',
      'return [*items, extra]',
    ],
  },
  // Fix-the-bug: loops and range.
  {
    id: 'c01-fix-first-total',
    title: 'Fix: total the first few parcels',
    lessonId: 'c01-foundations/control-flow',
    competencies: ['control-flow'],
    ticket: { from: 'Marcus, Route Planning', subject: 'Totals skip a parcel', body: 'first_total should add the first n weights. The current loop starts at the wrong index, so the first weight is missing.' },
    rules: ['Add up the first n values.', 'When n is 0, the total is 0.'],
    entry: 'first_total',
    starter: 'def first_total(values, n):\n    total = 0\n    for i in range(1, n):\n        total += values[i]\n    return total\n',
    reference: 'def first_total(values, n):\n    total = 0\n    for i in range(n):\n        total += values[i]\n    return total\n',
    cases: [
      fn('v-two-of-three', 'The first two of three', 'visible', [[4, 5, 6], 2]),
      fn('v-none', 'Zero values', 'visible', [[4, 5, 6], 0]),
      fn('h-four', 'All four of four', 'hidden', [[10, 20, 30, 40], 4]),
      fn('h-one', 'The only value', 'hidden', [[1], 1]),
      fn('h-zero-again', 'Zero of two', 'hidden', [[7, 8], 0]),
    ],
    variants: [
      ['one-past-end', 'def first_total(values, n):\n    total = 0\n    for i in range(1, n + 1):\n        total += values[i]\n    return total\n', 'OFF_BY_ONE_RANGE', 0],
      ['none-for-zero', 'def first_total(values, n):\n    if n == 0:\n        return None\n    total = 0\n    for i in range(n):\n        total += values[i]\n    return total\n', 'EMPTY_IS_NONE', 1],
    ],
    hints: [
      'range(1, n) starts at index 1. Which index should the first value come from?',
      'range(n) gives 0, 1, ..., n-1, which are the first n indexes.',
      'for i in range(n): total += values[i]',
    ],
  },
  // Fix-the-bug: mutable default arguments.
  {
    id: 'c01-fix-add-stop',
    title: 'Fix: add a stop to a route',
    lessonId: 'c01-foundations/functions-params',
    competencies: ['functions-params'],
    ticket: { from: 'Dev, Network Planning', subject: 'Stops leak between routes', body: 'add_stop should start a new route when none is given. Right now stops from one route appear in the next.' },
    rules: ['The stop is added to the end of the list it is given.', 'A call without a list starts a new list.'],
    entry: 'add_stop',
    starter: 'def add_stop(stop, stops=[]):\n    stops.append(stop)\n    return stops\n',
    reference: 'def add_stop(stop, stops=None):\n    if stops is None:\n        stops = []\n    stops.append(stop)\n    return stops\n',
    cases: [
      fn('v-existing', 'Add to an existing route', 'visible', ['A', ['X']]),
      fn('v-new-route', 'First stop of a new route', 'visible', ['B']),
      fn('h-second-new-route', 'Another new route', 'hidden', ['C']),
      fn('h-longer', 'A longer existing route', 'hidden', ['D', ['E', 'F']]),
      fn('h-third-new-route', 'A third new route', 'hidden', ['G']),
    ],
    variants: [
      ['tuple-default', 'def add_stop(stop, stops=()):\n    stops.append(stop)\n    return stops\n', 'MUTABLE_DEFAULT', 1],
      ['inserted-first', 'def add_stop(stop, stops=None):\n    if stops is None:\n        stops = []\n    stops.insert(0, stop)\n    return stops\n', 'INSERT_AT_FRONT', 0],
    ],
    hints: [
      'A default value is created once, when the function is defined. Every call that uses it shares it.',
      'Use None as the default, and make a new list inside the function when stops is None.',
      'if stops is None: stops = [] before stops.append(stop).',
    ],
  },
  // Structure: comprehensions.
  {
    id: 'c01-structure-squares',
    title: 'Structure: squares of odd values',
    lessonId: 'c01-foundations/comprehensions',
    competencies: ['comprehensions'],
    ticket: { from: 'Hana, Outbound', subject: 'Odd weights, squared', body: 'Write squares_of_odds(values). Use a comprehension, not a loop.' },
    rules: ['Define squares_of_odds.', 'Build the result with a comprehension, and use no for or while loop in the function.'],
    entry: 'squares_of_odds',
    starter: 'def squares_of_odds(values):\n    pass\n',
    reference: 'def squares_of_odds(values):\n    return [v * v for v in values if v % 2 == 1]\n',
    cases: [],
    structure: [
      { type: 'defines', label: 'define squares_of_odds', name: 'squares_of_odds' },
      { type: 'uses_comprehension_in', label: 'use a comprehension in squares_of_odds', within: 'squares_of_odds' },
      { type: 'no_loops_in', label: 'use no for or while loop in squares_of_odds', within: 'squares_of_odds' },
    ],
    variants: [
      ['loop-with-append', 'def squares_of_odds(values):\n    out = []\n    for v in values:\n        if v % 2 == 1:\n            out.append(v * v)\n    return out\n', 'LOOP_INSTEAD', 1],
      ['wrong-name', 'def squares(values):\n    return [v * v for v in values if v % 2 == 1]\n', 'WRONG_NAME', 0],
    ],
    hints: [
      'The function must have the name the ticket gives, and its body must be one comprehension.',
      'A comprehension has the form [expression for item in values if condition].',
      'return [v * v for v in values if v % 2 == 1]',
    ],
  },
  // Structure: iterators and generators.
  {
    id: 'c01-structure-countdown',
    title: 'Structure: a countdown generator',
    lessonId: 'c01-foundations/iterators-generators',
    competencies: ['iterators-generators'],
    ticket: { from: 'Marcus, Route Planning', subject: 'Countdown for the board', body: 'Write countdown(n). It yields n, n-1, and so on down to 1. Use yield, and do not build a list.' },
    rules: ['Define countdown.', 'Produce the values with yield, and build no list.'],
    entry: 'countdown',
    starter: 'def countdown(n):\n    pass\n',
    reference: 'def countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n',
    cases: [],
    structure: [
      { type: 'defines', label: 'define countdown', name: 'countdown' },
      { type: 'uses_yield_in', label: 'use yield in countdown', within: 'countdown' },
      { type: 'forbids_calls', label: 'do not call list in countdown', name: 'list', within: 'countdown' },
    ],
    variants: [
      ['returns-a-list', 'def countdown(n):\n    return list(range(n, 0, -1))\n', 'BUILDS_LIST_NOT_YIELD', 1],
      ['wrong-name', 'def count_down(n):\n    while n > 0:\n        yield n\n        n -= 1\n', 'WRONG_NAME', 0],
    ],
    hints: [
      'The function must be called countdown, and it must use yield.',
      'A while loop can yield each value and then step n down by one.',
      'while n > 0: yield n; n -= 1',
    ],
  },
];

// The boss: four graded parts on one freight report. Each part is graded on its own.
const BOSS_TICKET: Ticket = { from: 'Edward, Analytics Lead', subject: 'Weekly word report (boss)', body: 'Clean the lines, count the words, rank the top words, and format the report. Each part is graded on its own.' };

const BOSS_PARTS: FunctionItem[] = [
  {
    id: 'c01-boss-clean-lines',
    title: 'Boss part 1: clean the lines',
    lessonId: 'c01-foundations/lists',
    competencies: ['lists', 'control-flow'],
    ticket: BOSS_TICKET,
    rules: ['Remove spaces from both ends of each line.', 'Drop lines that are blank after trimming.', 'Keep the lines in their original order.'],
    entry: 'clean_lines',
    starter: 'def clean_lines(lines):\n    pass\n',
    reference: 'def clean_lines(lines):\n    cleaned = []\n    for line in lines:\n        text = line.strip()\n        if text:\n            cleaned.append(text)\n    return cleaned\n',
    cases: [
      fn('v-padded-and-blank', 'Padding and a blank line', 'visible', [['  Dock 1 ', '', 'Bay 2']]),
      fn('v-empty', 'No lines', 'visible', [[]]),
      fn('h-spaces-only', 'Lines of spaces', 'hidden', [['   ', 'Gate', '  ']]),
      fn('h-unsorted', 'Lines not in order', 'hidden', [['z', ' a ', 'm']]),
    ],
    variants: [
      ['keeps-blanks', 'def clean_lines(lines):\n    return [line.strip() for line in lines]\n', 'TRUTHINESS', 1],
      ['no-trim', 'def clean_lines(lines):\n    return [line for line in lines if line.strip()]\n', 'STR_IMMUTABLE', 0],
      ['sorted-output', 'def clean_lines(lines):\n    cleaned = []\n    for line in lines:\n        text = line.strip()\n        if text:\n            cleaned.append(text)\n    return sorted(cleaned)\n', 'SORTED_CHANGES_ORDER', 2],
    ],
    hints: [
      'Go through the lines one at a time. Trim each line first, then decide whether to keep it.',
      'Keep the trimmed text only when it is not empty, and append it in the order you see it.',
      'cleaned = []; for line in lines: text = line.strip(); if text: cleaned.append(text); return cleaned',
    ],
  },
  {
    id: 'c01-boss-count-words',
    title: 'Boss part 2: count the words',
    lessonId: 'c01-foundations/dicts',
    competencies: ['dicts', 'strings-fstrings'],
    ticket: BOSS_TICKET,
    rules: ['Words are separated by any whitespace.', 'Counting ignores case.', 'Return a dict from each word to its count.'],
    entry: 'count_words',
    starter: 'def count_words(lines):\n    pass\n',
    reference: 'def count_words(lines):\n    counts = {}\n    for line in lines:\n        for word in line.lower().split():\n            counts[word] = counts.get(word, 0) + 1\n    return counts\n',
    cases: [
      fn('v-dock', 'Dock and dock', 'visible', [['Dock dock', 'rail']]),
      fn('v-empty', 'No lines', 'visible', [[]]),
      fn('h-tab', 'A tab and a double space', 'hidden', [['A\tb', 'a  B']]),
      fn('h-caps', 'Capitals in one line', 'hidden', [['Dock DOCK  dock']]),
    ],
    variants: [
      ['case-sensitive', 'def count_words(lines):\n    counts = {}\n    for line in lines:\n        for word in line.split():\n            counts[word] = counts.get(word, 0) + 1\n    return counts\n', 'CASE_SENSITIVE_KEYS', 1],
      ['split-on-space', 'def count_words(lines):\n    counts = {}\n    for line in lines:\n        for word in line.lower().split(" "):\n            counts[word] = counts.get(word, 0) + 1\n    return counts\n', 'SPLIT_ON_SPACE', 0],
      ['pairs-not-dict', 'def count_words(lines):\n    counts = {}\n    for line in lines:\n        for word in line.lower().split():\n            counts[word] = counts.get(word, 0) + 1\n    return sorted(counts.items())\n', 'CONTAINER_SHAPE', 2],
    ],
    hints: [
      'Lower-case each line, then split it into words. Each word goes into a dict with a count.',
      'split() with no argument handles tabs and repeated spaces. Use counts.get(word, 0) + 1 to add one.',
      'for line in lines: for word in line.lower().split(): counts[word] = counts.get(word, 0) + 1',
    ],
  },
  {
    id: 'c01-boss-top-words',
    title: 'Boss part 3: rank the top words',
    lessonId: 'c01-foundations/sets',
    competencies: ['sets', 'functions-params'],
    ticket: BOSS_TICKET,
    rules: ['The highest count comes first.', 'Ties are ordered A to Z.', 'Return at most n (word, count) pairs.'],
    entry: 'top_words',
    starter: 'def top_words(counts, n):\n    pass\n',
    reference: 'def top_words(counts, n):\n    ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))\n    return ranked[:n]\n',
    cases: [
      fn('v-ties', 'Two ties and a leader', 'visible', [{ rail: 2, air: 2, sea: 3 }, 2]),
      fn('v-short', 'Fewer words than n', 'visible', [{ a: 1 }, 3]),
      fn('h-ties-in-order', 'Ties already in order', 'hidden', [{ x: 4, y: 4, z: 1, w: 2 }, 3]),
      fn('h-tie-reversed', 'Ties not in order', 'hidden', [{ m: 2, b: 2 }, 2]),
      fn('h-more', 'Several words', 'hidden', [{ p: 1, q: 1, r: 1 }, 2]),
    ],
    variants: [
      ['ties-in-dict-order', 'def top_words(counts, n):\n    ranked = sorted(counts.items(), key=lambda pair: -pair[1])\n    return ranked[:n]\n', 'DICT_ORDER_ASSUMPTION', 1],
      ['ascending', 'def top_words(counts, n):\n    ranked = sorted(counts.items(), key=lambda pair: (pair[1], pair[0]))\n    return ranked[:n]\n', 'SORTED_CHANGES_ORDER', 0],
      ['one-short', 'def top_words(counts, n):\n    ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))\n    return ranked[: n - 1]\n', 'OFF_BY_ONE_RANGE', 2],
    ],
    hints: [
      'Sort the (word, count) pairs. Python can sort by more than one key with a tuple.',
      'Use -count so the highest count sorts first, and the word second so ties come out A to Z.',
      'ranked = sorted(counts.items(), key=lambda pair: (-pair[1], pair[0])); return ranked[:n]',
    ],
  },
  {
    id: 'c01-boss-report-lines',
    title: 'Boss part 4: format the report',
    lessonId: 'c01-foundations/comprehensions',
    competencies: ['comprehensions', 'strings-fstrings'],
    ticket: BOSS_TICKET,
    rules: ['Each line reads "word: count".', 'Keep the order of the pairs.'],
    entry: 'report_lines',
    starter: 'def report_lines(pairs):\n    pass\n',
    reference: 'def report_lines(pairs):\n    return [f"{word}: {count}" for word, count in pairs]\n',
    cases: [
      fn('v-three', 'Two words and a count', 'visible', [[['sea', 3], ['air', 2]]]),
      fn('v-empty', 'No words', 'visible', [[]]),
      fn('h-single', 'One word', 'hidden', [[['x', 1]]]),
      fn('h-ties', 'Ties in report order', 'hidden', [[['b', 2], ['a', 2], ['c', 1]]]),
    ],
    variants: [
      ['no-colon', 'def report_lines(pairs):\n    return [f"{word} {count}" for word, count in pairs]\n', 'FORMAT_SPEC', 0],
      ['reversed', 'def report_lines(pairs):\n    return [f"{word}: {count}" for word, count in pairs][::-1]\n', 'REVERSED_ORDER', 1],
    ],
    hints: [
      'Each pair becomes one string. Read the rule for the exact separator.',
      'Use an f-string with a colon and a space between the word and the count.',
      'return [f"{word}: {count}" for word, count in pairs]',
    ],
  },
];

export const GRADED_SPECS: ChallengeSpec[] = FUNCTION_ITEMS.map(functionSpec);

export const BOSS_SPECS: ChallengeSpec[] = BOSS_PARTS.map(functionSpec);
