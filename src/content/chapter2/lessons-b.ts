// Chapter 2 lessons 7 to 11. Each example runs in the engine, and its output is recorded in
// generated/chapter2.outputs.json. A section with no quote is labelled as demonstrated by the
// interpreter, and its example is the evidence.
import type { Lesson } from '../types';

export const LESSONS_B: Lesson[] = [
  {
    id: 'c02-informatics/deque-heapq',
    number: 7,
    title: 'Deques and heaps',
    competency: 'deque-heapq',
    jsNotes: [],
    intro: 'A deque takes items from either end without shifting the rest. A heap keeps the smallest item at the front, ready to pop.',
    sections: [
      {
        id: 'deque-ends',
        docClaim: true,
        quotes: ['py-deque-ends'],
        title: 'A deque works at both ends',
        paragraphs: [
          'Use deque for a queue. popleft() removes the first item, and append() adds one at the end.',
          'A list pop(0) also removes the first item, but every other item moves one place to fill the gap.',
        ],
        examples: [
          { id: 'c02-deque-1', code: 'from collections import deque\n\nqueue = deque(["Dock 1", "Dock 2"])\nqueue.append("Dock 3")\nprint(queue.popleft(), len(queue))\nprint(list(queue))\n' },
        ],
        commonMistakes: ['LIST_FRONT_POP'],
      },
      {
        id: 'heap-smallest',
        docClaim: true,
        quotes: ['py-heap-root'],
        title: 'A heap keeps the smallest first',
        paragraphs: [
          'heapq.heapify arranges a list as a heap. heap[0] is the smallest item, and heappop removes it.',
          'The rest of a heap is not in sorted order. Only the first item is guaranteed to be the smallest.',
        ],
        examples: [
          { id: 'c02-heap-1', code: 'import heapq\n\njobs = [5, 1, 4]\nheapq.heapify(jobs)\nprint(jobs[0])\nprint(heapq.heappop(jobs), heapq.heappop(jobs), heapq.heappop(jobs))\n' },
        ],
        commonMistakes: ['HEAP_ORDER_ASSUMPTION'],
      },
    ],
  },
  {
    id: 'c02-informatics/recursion',
    number: 8,
    title: 'Recursion',
    competency: 'recursion',
    jsNotes: [],
    intro: 'A recursive function calls itself on a smaller problem. A base case stops the calls, and the nested data decides how deep they go.',
    sections: [
      {
        id: 'recursion-base',
        docClaim: false,
        quotes: [],
        title: 'A base case stops the calls',
        paragraphs: [
          'Each call works on a smaller problem than the one before it. The base case returns without calling the function again.',
        ],
        examples: [
          { id: 'c02-recursion-1', code: 'def countdown(n):\n    if n == 0:\n        return ["liftoff"]\n    return [n] + countdown(n - 1)\n\n\nprint(countdown(3))\n' },
        ],
        commonMistakes: ['RECURSION_NO_BASE'],
      },
      {
        id: 'recursion-nested',
        docClaim: false,
        quotes: [],
        title: 'Each call handles one level of nesting',
        paragraphs: [
          'A list inside a list is handled by a call that does the same job for the inner list. The inner call returns its items, and the outer call adds them in.',
        ],
        examples: [
          { id: 'c02-recursion-2', code: 'def flatten(items):\n    flat = []\n    for item in items:\n        if isinstance(item, list):\n            flat.extend(flatten(item))\n        else:\n            flat.append(item)\n    return flat\n\n\nprint(flatten([1, [2, [3, 4]], 5]))\n' },
        ],
        commonMistakes: [],
      },
    ],
  },
  {
    id: 'c02-informatics/sorting',
    number: 9,
    title: 'Sorting with key functions',
    competency: 'sort-key',
    jsNotes: [],
    intro: 'sorted() takes a key function that gives each item a value to compare. Reverse the order with reverse=True.',
    sections: [
      {
        id: 'sort-key',
        docClaim: true,
        quotes: ['py-sort-key'],
        title: 'The key decides the order',
        paragraphs: [
          'The key function returns the value to sort by. Use a lambda for a short key, or len for the length of each word.',
        ],
        examples: [
          { id: 'c02-sort-1', code: 'parcels = [("Crate", 12), ("Bag", 3), ("Drum", 12)]\nprint(sorted(parcels, key=lambda parcel: parcel[1]))\nprint(sorted(["bb", "a", "ccc"], key=len))\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'sort-ties',
        docClaim: true,
        quotes: ['py-sort-stable'],
        title: 'Equal keys keep their order',
        paragraphs: [
          'Sorting is stable, so items with equal keys keep the order they had. To order ties, add a second value to the key.',
          'reverse=True reverses the order of the keys, and the ties still keep their input order.',
        ],
        examples: [
          { id: 'c02-sort-2', code: 'words = ["pear", "fig", "apple", "kiwi"]\nprint(sorted(words, key=len, reverse=True))\nprint(sorted(words, key=lambda word: (len(word), word)))\n' },
        ],
        commonMistakes: ['SORT_TIES_IGNORED'],
      },
    ],
  },
  {
    id: 'c02-informatics/type-hints',
    number: 10,
    title: 'Type hints',
    competency: 'type-hints',
    jsNotes: [],
    intro: 'Type hints name the types a function expects and returns. They help readers and tools, and Python still runs the code without checking them.',
    sections: [
      {
        id: 'hints-syntax',
        docClaim: true,
        quotes: ['py-hints-not-enforced'],
        title: 'Hints are notes, not checks',
        paragraphs: [
          'Write a hint after each parameter name, and after the arrow for the return type. The code runs the same with or without the hints.',
        ],
        examples: [
          { id: 'c02-hints-1', code: 'def label(value: int) -> str:\n    return value * 2\n\n\nprint(label(4))\nprint(label("ab"))\n' },
        ],
        commonMistakes: ['HINT_IS_CHECK'],
      },
      {
        id: 'hints-containers',
        docClaim: false,
        quotes: [],
        title: 'Hints name the items in a container',
        paragraphs: [
          'dict[str, int] says the keys are text and the values are whole numbers. Optional[int] says the value is an int or None.',
        ],
        examples: [
          { id: 'c02-hints-2', code: 'from typing import Optional\n\n\ndef find(counts: dict[str, int], key: str) -> Optional[int]:\n    return counts.get(key)\n\n\nprint(find({"rail": 2}, "rail"), find({"rail": 2}, "sea"))\n' },
        ],
        commonMistakes: [],
      },
    ],
  },
  {
    id: 'c02-informatics/tracebacks',
    number: 11,
    title: 'Reading tracebacks and debugging',
    competency: 'tracebacks',
    jsNotes: [],
    intro: 'A traceback lists the calls that led to an error. Start with the last line, which names the error, then find the line in your code.',
    sections: [
      {
        id: 'traceback-read',
        docClaim: true,
        quotes: ['py-errors-last-line'],
        title: 'The last line names the error',
        paragraphs: [
          'The top of a traceback shows the outer calls. The last line gives the error type and the message, so read it first.',
        ],
        examples: [
          { id: 'c02-traceback-1', code: 'try:\n    numbers = [1, 2]\n    print(numbers[5])\nexcept IndexError as error:\n    print(type(error).__name__, error)\n' },
        ],
        commonMistakes: ['READ_TOP_FIRST'],
      },
      {
        id: 'debug-print',
        docClaim: false,
        quotes: [],
        title: 'Print the values before the failing line',
        paragraphs: [
          'Print the value and its type just before the line that fails. The printed value shows what the code really holds.',
        ],
        examples: [
          { id: 'c02-traceback-2', code: 'def average(values):\n    print("values:", values, type(values).__name__)\n    return sum(values) / len(values)\n\n\nprint(average([2, 4]))\n' },
        ],
        commonMistakes: [],
      },
    ],
  },
];
