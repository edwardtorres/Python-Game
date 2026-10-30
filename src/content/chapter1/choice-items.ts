// Chapter 1 choice items: 10 predict-the-output and 5 read-the-traceback. The right answer
// and every option come from running code. A wrong option is the output or error of a
// variant that a learner's mistake would produce, so the option text is never written by hand.
import { MISTAKES, type MistakeTag } from './mistakes';
import type { ChoiceItem, ChoiceVariant, PredictItem, TracebackItem } from './types';

function variant(id: string, code: string, tag: MistakeTag): ChoiceVariant {
  return { id, code, mistake: MISTAKES[tag] };
}

const PREDICT_PROMPT = 'Predict the output before you run it. Choose the output the code prints.';
const TRACEBACK_PROMPT = 'The code below stops with an error. Choose the error it raises.';

export const PREDICT_ITEMS: PredictItem[] = [
  {
    id: 'c01-predict-division',
    kind: 'predict',
    lessonId: 'c01-foundations/types',
    title: 'What does / give?',
    prompt: PREDICT_PROMPT,
    code: 'print(7 / 2)\n',
    variants: [
      variant('floor', 'print(7 // 2)\n', 'INT_DIVISION'),
      variant('remainder', 'print(7 % 2)\n', 'OPERATOR_MIXUP'),
    ],
    hints: [
      'Look at the operator in the middle: it is a single slash.',
      'In Python 3, a single slash always divides exactly, and the answer is a float.',
      'Two slashes, //, would give the whole-number part. Nothing else is printed.',
    ],
  },
  {
    id: 'c01-predict-immutable-string',
    kind: 'predict',
    lessonId: 'c01-foundations/strings-fstrings',
    title: 'Does upper() change the string?',
    prompt: PREDICT_PROMPT,
    code: 's = "freight"\ns.upper()\nprint(s)\n',
    variants: [variant('upper-printed', 's = "freight"\nprint(s.upper())\n', 'STR_IMMUTABLE')],
    hints: [
      'The line s.upper() is on its own. What happens to its result?',
      'upper() returns a new string. It does not change the one stored in s.',
      'The only thing printed is s, so it still holds the lowercase text.',
    ],
  },
  {
    id: 'c01-predict-list-alias',
    kind: 'predict',
    lessonId: 'c01-foundations/lists',
    title: 'Does b change a?',
    prompt: PREDICT_PROMPT,
    code: 'a = [1, 2]\nb = a\nb.append(3)\nprint(a)\n',
    variants: [variant('copy', 'a = [1, 2]\nb = a.copy()\nb.append(3)\nprint(a)\n', 'ALIASING_COPY')],
    hints: [
      'Follow the name b. Where does it point after b = a?',
      'b = a gives b the same list that a names. There is one list, not two.',
      'The list gets 3 appended through b, so printing a shows that change.',
    ],
  },
  {
    id: 'c01-predict-dict-order',
    kind: 'predict',
    lessonId: 'c01-foundations/dicts',
    title: 'What order do keys come out in?',
    prompt: PREDICT_PROMPT,
    code: 'd = {"sea": 1, "air": 2}\nprint(list(d))\n',
    variants: [
      variant('sorted', 'd = {"sea": 1, "air": 2}\nprint(sorted(d))\n', 'DICT_ORDER_ASSUMPTION'),
      variant('values', 'd = {"sea": 1, "air": 2}\nprint(list(d.values()))\n', 'DICT_ORDER_ASSUMPTION'),
    ],
    hints: [
      'list(d) gives the keys. Which keys, and in what order?',
      'A dict keeps the order its keys were added. It does not sort them.',
      '"sea" was added first, so the keys come out with "sea" in front.',
    ],
  },
  {
    id: 'c01-predict-set-size',
    kind: 'predict',
    lessonId: 'c01-foundations/sets',
    title: 'How many items does the set keep?',
    prompt: PREDICT_PROMPT,
    code: 'print(len(set([3, 1, 3, 2])))\n',
    variants: [variant('list-size', 'print(len([3, 1, 3, 2]))\n', 'SET_ORDER_ASSUMPTION')],
    hints: [
      'The argument to len() is a set, built from a list with a repeated 3.',
      'A set keeps each value once, so the repeated 3 is dropped.',
      'Count the distinct values: 3, 1, and 2.',
    ],
  },
  {
    id: 'c01-predict-one-tuple',
    kind: 'predict',
    lessonId: 'c01-foundations/tuples',
    title: 'What type is (5)?',
    prompt: PREDICT_PROMPT,
    code: 'item = (5)\nprint(type(item).__name__)\n',
    variants: [variant('comma', 'item = (5,)\nprint(type(item).__name__)\n', 'SINGLE_ELEMENT_TUPLE')],
    hints: [
      'Parentheses are on the right of item. Do they make a tuple here?',
      'A tuple with one item needs a comma after the item. Parentheses alone do not.',
      'Without the comma, (5) is the number 5, so the type name is int.',
    ],
  },
  {
    id: 'c01-predict-range-end',
    kind: 'predict',
    lessonId: 'c01-foundations/control-flow',
    title: 'Does range(1, 4) include 4?',
    prompt: PREDICT_PROMPT,
    code: 'print(list(range(1, 4)))\n',
    variants: [
      variant('short', 'print(list(range(1, 3)))\n', 'OFF_BY_ONE_RANGE'),
      variant('from-zero', 'print(list(range(4)))\n', 'OFF_BY_ONE_RANGE'),
    ],
    hints: [
      'range(a, b) starts at a. Does it stop before b, or at b?',
      'range stops before its end value, so 4 is not included.',
      'Starting at 1 and stopping before 4 gives the numbers 1, 2, and 3.',
    ],
  },
  {
    id: 'c01-predict-default-list',
    kind: 'predict',
    lessonId: 'c01-foundations/functions-params',
    title: 'Does the second call see the first?',
    prompt: PREDICT_PROMPT,
    code: 'def add(item, bag=None):\n    bag = [] if bag is None else bag\n    bag.append(item)\n    return bag\n\nprint(add("a"))\nprint(add("b"))\n',
    variants: [
      variant(
        'shared-default',
        'def add(item, bag=[]):\n    bag.append(item)\n    return bag\n\nprint(add("a"))\nprint(add("b"))\n',
        'MUTABLE_DEFAULT',
      ),
    ],
    hints: [
      'The default is None, and a new list is made when bag is None. Does each call get its own list?',
      'Each call without a bag gets a new empty list, because None is replaced inside the function.',
      'So both calls print a list with one item each.',
    ],
  },
  {
    id: 'c01-predict-generator-once',
    kind: 'predict',
    lessonId: 'c01-foundations/iterators-generators',
    title: 'What does the second list() print?',
    prompt: PREDICT_PROMPT,
    code: 'g = (x * 2 for x in [1, 2])\nprint(list(g))\nprint(list(g))\n',
    variants: [
      variant('list-again', 'g = [x * 2 for x in [1, 2]]\nprint(list(g))\nprint(list(g))\n', 'GENERATOR_EXHAUSTED'),
    ],
    hints: [
      'The parentheses make a generator expression, not a list. What does a generator do after it is used once?',
      'A generator gives its values once. The first list() takes them all.',
      'The second list() starts from nothing, so it prints an empty list.',
    ],
  },
  {
    id: 'c01-predict-truthiness',
    kind: 'predict',
    lessonId: 'c01-foundations/types',
    title: 'Which values are true?',
    prompt: PREDICT_PROMPT,
    code: 'for value in [0, "", [1]]:\n    print(bool(value))\n',
    variants: [
      variant('not-none', 'for value in [0, "", [1]]:\n    print(value is not None)\n', 'TRUTHINESS'),
    ],
    hints: [
      'bool() turns each value into True or False. Which of the three values are empty or zero?',
      '0 and "" are empty or zero, so they are false. A list with one item is not empty.',
      'The three lines print False, False, and True, in that order.',
    ],
  },
];

export const TRACEBACK_ITEMS: TracebackItem[] = [
  {
    id: 'c01-traceback-missing-key',
    kind: 'traceback',
    lessonId: 'c01-foundations/dicts',
    title: 'A missing key',
    prompt: TRACEBACK_PROMPT,
    code: 'stock = {"pallets": 3}\nprint(stock["crates"])\n',
    variants: [
      variant('list-index', 'stock = ["pallets"]\nprint(stock["crates"])\n', 'KEYERROR_VS_GET'),
      variant('get-plus', 'stock = {"pallets": 3}\nprint(stock.get("crates") + 1)\n', 'KEYERROR_VS_GET'),
    ],
    hints: [
      'Read the line that fails. Which name is looked up with brackets?',
      'Brackets on a dict raise an error when the key is not there.',
      'The error is a KeyError, and its text is the key that was missing.',
    ],
  },
  {
    id: 'c01-traceback-missing-argument',
    kind: 'traceback',
    lessonId: 'c01-foundations/functions-params',
    title: 'A call with too few arguments',
    prompt: TRACEBACK_PROMPT,
    code: 'def ship(parcel, weight):\n    return f"{parcel}:{weight}"\n\nprint(ship("P1"))\n',
    variants: [
      variant('too-many', 'def ship(parcel, weight):\n    return f"{parcel}:{weight}"\n\nprint(ship("P1", "2", "3"))\n', 'MISSING_ARGUMENT'),
      variant('bad-keyword', 'def ship(parcel, weight):\n    return f"{parcel}:{weight}"\n\nprint(ship(parcel="P1", weight=2, box=1))\n', 'MISSING_ARGUMENT'),
    ],
    hints: [
      'Count the arguments in the call and compare them with the def line.',
      'The function needs two values, and the call gives only one.',
      'Python names the parameter it did not get: weight.',
    ],
  },
  {
    id: 'c01-traceback-broad-except',
    kind: 'traceback',
    lessonId: 'c01-foundations/exceptions',
    title: 'Text that is not a number',
    prompt: TRACEBACK_PROMPT,
    code: 'def to_number(text):\n    return int(text)\n\nprint(to_number("twelve"))\n',
    variants: [
      variant('none-input', 'def to_number(text):\n    return int(text)\n\nprint(to_number(None))\n', 'EXCEPTION_TOO_BROAD'),
      variant('decimal-text', 'def to_number(text):\n    return int(text)\n\nprint(to_number("12.5"))\n', 'INT_FROM_TEXT'),
    ],
    hints: [
      'The call passes the text "twelve". int() reads whole numbers only.',
      'int() cannot turn letters into a number, so it raises a ValueError.',
      'The message quotes the text that could not be read.',
    ],
  },
  {
    id: 'c01-traceback-import',
    kind: 'traceback',
    lessonId: 'c01-foundations/modules',
    title: 'A module that is not there',
    prompt: TRACEBACK_PROMPT,
    code: 'import freight_tools\nprint("ready")\n',
    variants: [
      variant('misspelled', 'import freight_tool\nprint("ready")\n', 'IMPORT_NOT_FOUND'),
      variant('from-missing-name', 'from json import loads_freight\nprint("ready")\n', 'IMPORT_NOT_FOUND'),
    ],
    hints: [
      'The first line is an import. The name after import must match a module that exists.',
      'When Python cannot find the module, the error type is ModuleNotFoundError.',
      'The message names the module it looked for, exactly as written.',
    ],
  },
  {
    id: 'c01-traceback-name-type',
    kind: 'traceback',
    lessonId: 'c01-foundations/types',
    title: 'Adding text to a number',
    prompt: TRACEBACK_PROMPT,
    code: 'parcels = 3\nprint("Parcels: " + parcels)\n',
    variants: [
      variant('minus-instead', 'parcels = 3\nprint("Parcels: " - parcels)\n', 'TEXT_PLUS_NUMBER'),
      variant('float-text', 'parcels = 3.0\nprint(parcels + "x")\n', 'TEXT_PLUS_NUMBER'),
    ],
    hints: [
      'Look at the + on the print line. What are its two sides?',
      'The left side is text and the right side is an int. Python will not join them with +.',
      'The error is a TypeError, and it names both types.',
    ],
  },
];

export const CHOICE_ITEMS: ChoiceItem[] = [...PREDICT_ITEMS, ...TRACEBACK_ITEMS];
