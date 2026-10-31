// Chapter 2 choice items: 8 predict-the-output and 5 read-the-traceback. The right answer and
// every option come from running code. A wrong option is the output or error of a variant that a
// learner's mistake would produce, so the option text is never written by hand.
import { MISTAKES, type MistakeTag } from '../mistakes';
import type { ChoiceItem, ChoiceVariant, PredictItem, TracebackItem } from '../types';

function variant(id: string, code: string, tag: MistakeTag): ChoiceVariant {
  return { id, code, mistake: MISTAKES[tag] };
}

const PREDICT_PROMPT = 'Predict the output before you run it. Choose the output the code prints.';
const TRACEBACK_PROMPT = 'The code below stops with an error. Choose the error it raises.';

export const PREDICT_ITEMS: PredictItem[] = [
  {
    id: 'c02-predict-shared-list',
    kind: 'predict',
    lessonId: 'c02-informatics/classes',
    title: 'Whose list is it?',
    prompt: PREDICT_PROMPT,
    code: 'class Dock:\n    queue = []\n\n    def __init__(self, name):\n        self.name = name\n        self.parcels = []\n\n    def receive(self, parcel):\n        self.parcels.append(parcel)\n        Dock.queue.append(parcel)\n\n\nnorth = Dock("North")\nsouth = Dock("South")\nnorth.receive("crate")\nprint(len(north.parcels), len(south.parcels), len(Dock.queue))\n',
    variants: [
      variant(
        'class-parcels',
        'class Dock:\n    queue = []\n    parcels = []\n\n    def __init__(self, name):\n        self.name = name\n\n    def receive(self, parcel):\n        self.parcels.append(parcel)\n        Dock.queue.append(parcel)\n\n\nnorth = Dock("North")\nsouth = Dock("South")\nnorth.receive("crate")\nprint(len(north.parcels), len(south.parcels), len(Dock.queue))\n',
        'SHARED_CLASS_ATTRIBUTE',
      ),
    ],
    hints: [
      'Only north receives a parcel. Ask which names point to a list that every Dock shares.',
      'parcels is set in __init__ with self, so each dock gets its own list. queue is written on the class.',
      'The class attribute queue is one list for all docks, so the parcel lands there once.',
    ],
  },
  {
    id: 'c02-predict-dataclass-equal',
    kind: 'predict',
    lessonId: 'c02-informatics/dataclasses',
    title: 'Are the two parcels equal?',
    prompt: PREDICT_PROMPT,
    code: 'from dataclasses import dataclass\n\n\n@dataclass\nclass Parcel:\n    name: str\n    kg: float\n\n\na = Parcel("Crate", 12.0)\nb = Parcel("Crate", 12.0)\nprint(a == b, a is b)\n',
    variants: [
      variant(
        'plain-class',
        'from dataclasses import dataclass\n\n\nclass Parcel:\n    def __init__(self, name, kg):\n        self.name = name\n        self.kg = kg\n\n\na = Parcel("Crate", 12.0)\nb = Parcel("Crate", 12.0)\nprint(a == b, a is b)\n',
        'EQ_NOT_DEFINED',
      ),
    ],
    hints: [
      'Two names can hold equal values and still be two objects. Look at which one is which.',
      'The decorator writes __eq__, and __eq__ compares the fields. Is the decorator there?',
      'Without @dataclass, == falls back to identity, so two separate objects are never equal.',
    ],
  },
  {
    id: 'c02-predict-super-setup',
    kind: 'predict',
    lessonId: 'c02-informatics/inheritance',
    title: 'Does the parent set kg?',
    prompt: PREDICT_PROMPT,
    code: 'class Parcel:\n    def __init__(self, kg):\n        self.kg = kg\n\n\nclass Pallet(Parcel):\n    def __init__(self, kg, boards):\n        super().__init__(kg)\n        self.boards = boards\n\n\npallet = Pallet(30, 4)\nprint(pallet.kg, pallet.boards)\n',
    variants: [
      variant(
        'no-super',
        'class Parcel:\n    def __init__(self, kg):\n        self.kg = kg\n\n\nclass Pallet(Parcel):\n    def __init__(self, kg, boards):\n        self.boards = boards\n\n\npallet = Pallet(30, 4)\nprint(pallet.kg, pallet.boards)\n',
        'SUPER_NOT_CALLED',
      ),
    ],
    hints: [
      'The subclass has its own __init__. Ask whether the parent __init__ runs at all.',
      'super().__init__(kg) is the line that runs the parent setup. Look for it.',
      'Without that line, self.kg is never set, and reading pallet.kg fails.',
    ],
  },
  {
    id: 'c02-predict-len-method',
    kind: 'predict',
    lessonId: 'c02-informatics/dunder-methods',
    title: 'Does len() work on a crate?',
    prompt: PREDICT_PROMPT,
    code: 'class Crate:\n    def __init__(self, items):\n        self.items = items\n\n    def __len__(self):\n        return len(self.items)\n\n\ncrate = Crate(["a", "b"])\nprint(len(crate), bool(crate))\n',
    variants: [
      variant(
        'no-len',
        'class Crate:\n    def __init__(self, items):\n        self.items = items\n\n\ncrate = Crate(["a", "b"])\nprint(len(crate), bool(crate))\n',
        'DUNDER_MISSING',
      ),
    ],
    hints: [
      'len() looks for a method on the class. Which method name does it use?',
      'The method must be named __len__, with two underscores on each side.',
      'Without __len__, calling len(crate) raises TypeError.',
    ],
  },
  {
    id: 'c02-predict-list-probe',
    kind: 'predict',
    lessonId: 'c02-informatics/big-o',
    title: 'How many comparisons does each lookup make?',
    prompt: PREDICT_PROMPT,
    code: 'class Probe:\n    comparisons = 0\n\n    def __init__(self, value):\n        self.value = value\n\n    def __eq__(self, other):\n        Probe.comparisons += 1\n        return self.value == other.value\n\n    def __hash__(self):\n        return hash(self.value)\n\n\nitems = [Probe(i) for i in range(100)]\nlookup = set(items)\ntarget = Probe(99)\nProbe.comparisons = 0\ntarget in items\nprint(Probe.comparisons)\nProbe.comparisons = 0\ntarget in lookup\nprint(Probe.comparisons)\n',
    variants: [
      variant(
        'set-scans',
        'class Probe:\n    comparisons = 0\n\n    def __init__(self, value):\n        self.value = value\n\n    def __eq__(self, other):\n        Probe.comparisons += 1\n        return self.value == other.value\n\n    def __hash__(self):\n        return hash(self.value)\n\n\nitems = [Probe(i) for i in range(100)]\nlookup = set(items)\ntarget = Probe(99)\nProbe.comparisons = 0\ntarget in items\nprint(Probe.comparisons)\nProbe.comparisons = 0\nany(target == item for item in items)\nprint(Probe.comparisons)\n',
        'BIGO_LIST_LOOKUP',
      ),
    ],
    hints: [
      'The probe counts each call to __eq__. Ask how many calls a list lookup needs for the last item.',
      'A set looks up by the hash first, so it calls __eq__ only for items with a matching hash.',
      'The list lookup compares 100 items, one by one. The set lookup compares one.',
    ],
  },
  {
    id: 'c02-predict-heap-order',
    kind: 'predict',
    lessonId: 'c02-informatics/deque-heapq',
    title: 'What does the heap give first?',
    prompt: PREDICT_PROMPT,
    code: 'import heapq\n\njobs = [4, 2, 9, 1]\nheapq.heapify(jobs)\nprint(jobs[0], heapq.heappop(jobs), heapq.heappop(jobs))\n',
    variants: [
      variant(
        'list-order',
        'import heapq\n\njobs = [4, 2, 9, 1]\nheapq.heapify(jobs)\nprint(jobs[0], heapq.heappop(jobs), jobs[1])\n',
        'HEAP_ORDER_ASSUMPTION',
      ),
    ],
    hints: [
      'The heap is not sorted after heapify. Only the first item is guaranteed to be the smallest.',
      'Each heappop removes the smallest item and rebuilds the heap. Read jobs after each pop.',
      'Ask what the second heappop returns, not what jobs[1] holds after the first pop.',
    ],
  },
  {
    id: 'c02-predict-sort-ties',
    kind: 'predict',
    lessonId: 'c02-informatics/sorting',
    title: 'Which words tie, and where do they go?',
    prompt: PREDICT_PROMPT,
    code: 'words = ["kiwi", "fig", "pear", "apple"]\nprint(sorted(words, key=len))\n',
    variants: [
      variant('reverse-first', 'words = ["kiwi", "fig", "pear", "apple"]\nprint(sorted(words, key=len, reverse=True))\n', 'SORT_DIRECTION'),
      variant('ties-reversed', 'words = ["kiwi", "fig", "pear", "apple"]\nprint(sorted(reversed(words), key=len))\n', 'SORT_TIES_IGNORED'),
    ],
    hints: [
      'The key is the length, so kiwi and pear tie. Ask which one comes first in the input.',
      'sorted() is stable: equal keys keep the order they had in the input.',
      'Only the order of the ties can change the output, so compare kiwi and pear.',
    ],
  },
  {
    id: 'c02-predict-flatten-nested',
    kind: 'predict',
    lessonId: 'c02-informatics/recursion',
    title: 'Is every item flattened?',
    prompt: PREDICT_PROMPT,
    code: 'def flatten(items):\n    flat = []\n    for item in items:\n        if isinstance(item, list):\n            flat.extend(flatten(item))\n        else:\n            flat.append(item)\n    return flat\n\n\nprint(flatten([1, [2, [3]], []]))\n',
    variants: [
      variant(
        'skip-nested',
        'def flatten(items):\n    flat = []\n    for item in items:\n        flat.append(item)\n    return flat\n\n\nprint(flatten([1, [2, [3]], []]))\n',
        'NESTED_IGNORED',
      ),
    ],
    hints: [
      'The function checks each item. Ask what it does when the item is a list.',
      'A list item is handed to flatten again, and the returned items are added with extend.',
      'If the nested lists are appended as they are, the output keeps their brackets.',
    ],
  },
];

export const TRACEBACK_ITEMS: TracebackItem[] = [
  {
    id: 'c02-traceback-unhashable',
    kind: 'traceback',
    lessonId: 'c02-informatics/list-dict-set',
    title: 'Which error stops the set?',
    prompt: TRACEBACK_PROMPT,
    code: 'seen = set()\nfor pallet in [["A", 1], ["B", 2]]:\n    seen.add(pallet)\nprint(len(seen))\n',
    variants: [
      variant('set-append', 'seen = set()\nfor pallet in [["A", 1], ["B", 2]]:\n    seen.append(pallet)\nprint(len(seen))\n', 'SET_ORDER_ASSUMPTION'),
      variant('missing-key', 'orders = {"Dock 1": 3}\nprint(orders["Dock 9"])\n', 'KEYERROR_VS_GET'),
    ],
    hints: [
      'The loop adds one item at a time. Look at what each item is.',
      'A set stores its items in a hash table, so each item must have a hash value.',
      'A list has no hash value, so set.add raises TypeError with the word unhashable.',
    ],
  },
  {
    id: 'c02-traceback-sort-none',
    kind: 'traceback',
    lessonId: 'c02-informatics/sorting',
    title: 'Why is there no first item?',
    prompt: TRACEBACK_PROMPT,
    code: 'parcels = [3, 1, 2]\nordered = parcels.sort()\nprint(ordered[0])\n',
    variants: [
      variant('sorted-result', 'parcels = [3, 1, 2]\nordered = sorted(parcels)\nprint(ordered[0])\n', 'SORT_RETURNS_NONE'),
    ],
    hints: [
      'The error happens on the last line, when ordered is used as a list.',
      'Check what the sort method returns. Does it return the list, or something else?',
      'list.sort() returns None. ordered holds None, and None cannot be indexed.',
    ],
  },
  {
    id: 'c02-traceback-empty-deque',
    kind: 'traceback',
    lessonId: 'c02-informatics/deque-heapq',
    title: 'What happens when the queue is empty?',
    prompt: TRACEBACK_PROMPT,
    code: 'from collections import deque\n\nqueue = deque()\nqueue.append("crate")\nqueue.popleft()\nprint(queue.popleft())\n',
    variants: [
      variant('list-front', 'queue = []\nqueue.append("crate")\nqueue.pop(0)\nprint(queue.pop(0))\n', 'LIST_FRONT_POP'),
    ],
    hints: [
      'The first popleft takes the only item. Ask what the second popleft finds.',
      'Removing from an empty deque is an error, and the message says the deque is empty.',
      'The second popleft finds nothing to remove, so it raises IndexError.',
    ],
  },
  {
    id: 'c02-traceback-missing-argument',
    kind: 'traceback',
    lessonId: 'c02-informatics/classes',
    title: 'Which argument is missing?',
    prompt: TRACEBACK_PROMPT,
    code: 'class Parcel:\n    def __init__(self, name, kg):\n        self.name = name\n        self.kg = kg\n\n\nparcel = Parcel("Crate")\nprint(parcel.name)\n',
    variants: [
      variant('extra-value', 'class Parcel:\n    def __init__(self, name, kg):\n        self.name = name\n        self.kg = kg\n\n\nparcel = Parcel("Crate", 12, 3)\nprint(parcel.name)\n', 'ARGUMENT_COUNT'),
    ],
    hints: [
      'The class call passes some values. Count them against the parameters of __init__.',
      'self is filled in for you. The other parameters, name and kg, need a value each.',
      'Only one value is passed, so kg has no value. Python raises TypeError and names kg.',
    ],
  },
  {
    id: 'c02-traceback-heap-empty',
    kind: 'traceback',
    lessonId: 'c02-informatics/deque-heapq',
    title: 'What is left in the heap?',
    prompt: TRACEBACK_PROMPT,
    code: 'import heapq\n\njobs = []\nheapq.heappush(jobs, 4)\nheapq.heappop(jobs)\nprint(heapq.heappop(jobs))\n',
    variants: [
      variant('read-front', 'jobs = []\njobs.append(4)\njobs.pop(0)\nprint(jobs[0])\n', 'HEAP_ORDER_ASSUMPTION'),
    ],
    hints: [
      'The heap starts empty, and one push and one pop leave it empty again.',
      'heappop removes the smallest item, and an empty heap has no smallest item.',
      'The second heappop finds no item, so it raises IndexError.',
    ],
  },
];

export const CHOICE_ITEMS: ChoiceItem[] = [...PREDICT_ITEMS, ...TRACEBACK_ITEMS];
