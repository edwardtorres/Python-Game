// Chapter 1 lessons 1 to 7. Each example runs in the engine, and its output is recorded
// in generated/chapter1.outputs.json. Every claim in a section is shown by its examples.
import type { Lesson } from './types';

export const LESSONS_A: Lesson[] = [
  {
    id: 'c01-foundations/types',
    number: 1,
    title: 'Types and conversions',
    competency: 'types',
    jsNotes: [
      { id: 'js-truthiness', text: 'In JavaScript, every value is truthy except the falsy values that the MDN glossary lists. An empty array is not on that list, so an empty array is truthy there. In Python, an empty list is false.', quotes: ['js-truthy', 'js-falsy-list', 'py-truthiness'] },
      { id: 'js-division', text: 'JavaScript has one number type, a 64-bit floating-point value, so 6 / 2 and 7 / 2 are both plain numbers. Python 3 has int and float, and / always gives a float.', quotes: ['js-number', 'py-division'] },
    ],
    intro: 'Every value has a type. Conversions turn one type into another, and division has its own rule.',
    sections: [
      {
        id: 'types-conversions',
        docClaim: false,
        quotes: [],
        title: 'Numbers, text, and conversions',
        paragraphs: [
          'int() reads a whole number from text, float() reads a decimal number, and str() turns a value into text.',
          'Adding a number to text needs a conversion first. The example joins a number and text by converting the number.',
        ],
        examples: [
          { id: 'types-1', code: 'print(int("42") + 1, float("2.5") * 2, str(7) + "!")\nprint(type(3), type(3.0), type("3"))\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'types-division',
        docClaim: true,
        quotes: ['py-division'],
        title: 'Division gives a float',
        paragraphs: [
          '/ always gives a float, even when the answer is whole. // gives the floor, and it is an int when both numbers are ints.',
          'Use // when a whole-number answer is the goal, such as splitting 7 parcels into groups of 2.',
        ],
        examples: [{ id: 'types-2', code: 'print(7 / 2, 6 / 2, 7 // 2, 6 // 2)\nprint(type(6 / 2), type(6 // 2))\n' }],
        commonMistakes: ['INT_DIVISION'],
      },
    ],
  },
  {
    id: 'c01-foundations/strings-fstrings',
    number: 2,
    title: 'Strings and f-strings',
    competency: 'strings-fstrings',
    jsNotes: [],
    intro: 'Strings hold text. An f-string puts values into text, and a format spec controls how a number looks.',
    sections: [
      {
        id: 'strings-fstrings',
        docClaim: false,
        quotes: [],
        title: 'f-strings and format specs',
        paragraphs: [
          'Put an f before the quotes, then write a name or expression in braces. Add :.2f after a number to show two decimal places.',
        ],
        examples: [
          { id: 'strings-1', code: 'name = "Ada"\ncount = 3\nprice = 3.14159\nprint(f"{name} has {count} parcels")\nprint(f"{price:.2f} per kg")\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'strings-immutable',
        docClaim: true,
        quotes: ['py-immutable-str'],
        title: 'Strings do not change in place',
        paragraphs: [
          'Methods such as upper() and strip() return a new string. The original string is not changed, so store the result or return it.',
        ],
        examples: [{ id: 'strings-2', code: 's = "  freight  "\nt = s.strip().upper()\nprint(repr(s))\nprint(repr(t))\n' }],
        commonMistakes: ['STR_IMMUTABLE'],
      },
    ],
  },
  {
    id: 'c01-foundations/lists',
    number: 3,
    title: 'Lists',
    competency: 'lists',
    jsNotes: [
      { id: 'js-copy', text: 'In JavaScript, slice() returns a shallow copy of an array, which plays the role that list.copy() plays in Python.', quotes: ['js-slice-copy', 'py-list-copy'] },
    ],
    intro: 'A list is an ordered, changeable collection. Two names can refer to one list, so copies need care.',
    sections: [
      {
        id: 'lists-basics',
        docClaim: false,
        quotes: [],
        title: 'Indexing, slicing, and append',
        paragraphs: [
          'Positions start at 0. A negative index counts from the end, and a slice a:b takes items from a up to but not including b.',
          'append() adds one item at the end of the list.',
        ],
        examples: [{ id: 'lists-1', code: 'stops = ["Dock 1", "Dock 2", "Dock 3"]\nprint(stops[0], stops[-1], stops[1:])\nstops.append("Dock 4")\nprint(len(stops))\n' }],
        commonMistakes: [],
      },
      {
        id: 'lists-copy',
        docClaim: true,
        quotes: ['py-list-copy'],
        title: 'Two names, one list',
        paragraphs: [
          'Assigning a list to a new name copies the reference, so both names change together. list.copy() or a slice makes a new list.',
        ],
        examples: [{ id: 'lists-2', code: 'a = [1, 2]\nb = a\nb.append(3)\nprint(a)\nc = a.copy()\nc.append(4)\nprint(a, c)\n' }],
        commonMistakes: ['ALIASING_COPY'],
      },
    ],
  },
  {
    id: 'c01-foundations/dicts',
    number: 4,
    title: 'Dictionaries',
    competency: 'dicts',
    jsNotes: [
      { id: 'js-key-order', text: 'In JavaScript, Object.keys() returns keys in the same order as a for...in loop. Python dicts keep insertion order, as the first example in the counting section shows.', quotes: ['js-keys-order', 'py-dict-insertion'] },
    ],
    intro: 'A dict maps keys to values. Reading a missing key needs a plan: either handle the error or give a default.',
    sections: [
      {
        id: 'dicts-lookup',
        docClaim: true,
        quotes: ['py-get'],
        title: 'Reading a key, and reading a missing key',
        paragraphs: [
          'd[key] returns the value, and raises KeyError when the key is missing. d.get(key, default) returns the default instead.',
        ],
        examples: [
          { id: 'dicts-1', code: 'stock = {"pallets": 3}\nprint(stock.get("crates", 0))\nprint(stock["pallets"])\ntry:\n    print(stock["crates"])\nexcept KeyError as error:\n    print("KeyError:", error)\n' },
        ],
        commonMistakes: ['KEYERROR_VS_GET'],
      },
      {
        id: 'dicts-counting',
        docClaim: true,
        quotes: ['py-dict-insertion', 'py-dict-37'],
        title: 'Counting with a dict',
        paragraphs: [
          'A dict remembers the order its keys were added. Counting into a dict with get() is a common pattern.',
          'The order shown is the order of the first time each key was added. It is not sorted.',
        ],
        examples: [
          { id: 'dicts-2', code: 'counts = {}\nfor mode in ["road", "rail", "road", "sea"]:\n    counts[mode] = counts.get(mode, 0) + 1\nprint(counts)\nprint(list(counts))\n' },
        ],
        commonMistakes: ['DICT_ORDER_ASSUMPTION'],
      },
    ],
  },
  {
    id: 'c01-foundations/sets',
    number: 5,
    title: 'Sets',
    competency: 'sets',
    jsNotes: [],
    intro: 'A set holds each value once. Use it to remove duplicates, and sort the result when the order matters.',
    sections: [
      {
        id: 'sets-unique',
        docClaim: true,
        quotes: ['py-sets'],
        title: 'Removing duplicates',
        paragraphs: [
          'set(items) keeps one copy of each value. The printed order of a set is not something to rely on, so sort it when you need an order.',
        ],
        examples: [{ id: 'sets-1', code: 'routes = ["A", "B", "A", "C"]\nprint(len(routes), len(set(routes)))\nprint(sorted(set(routes)))\n' }],
        commonMistakes: ['SET_ORDER_ASSUMPTION'],
      },
    ],
  },
  {
    id: 'c01-foundations/tuples',
    number: 6,
    title: 'Tuples',
    competency: 'tuples',
    jsNotes: [],
    intro: 'A tuple is an ordered collection that cannot change. A one-item tuple needs a comma.',
    sections: [
      {
        id: 'tuples-basics',
        docClaim: true,
        quotes: ['py-tuple-one'],
        title: 'Fixed pairs and one-item tuples',
        paragraphs: [
          'A tuple keeps its items in order and cannot be changed after it is made. It is a good fit for a fixed pair such as a dock and a count.',
          'A comma makes a tuple. Parentheses alone do not.',
        ],
        examples: [{ id: 'tuples-1', code: 'pair = ("Dock 4", 12)\nprint(pair[0], pair[1])\nprint(type((5)), type((5,)))\n' }],
        commonMistakes: ['SINGLE_ELEMENT_TUPLE'],
      },
    ],
  },
  {
    id: 'c01-foundations/control-flow',
    number: 7,
    title: 'Control flow',
    competency: 'control-flow',
    jsNotes: [
      { id: 'js-identity', text: 'For objects, == in JavaScript returns true only when both operands reference the same object. The is test in Python has the same meaning for objects.', quotes: ['js-identity', 'py-identity'] },
    ],
    intro: 'if, elif, and else choose a branch. for loops repeat over items, and range() makes numbers to loop over.',
    sections: [
      {
        id: 'control-if',
        docClaim: true,
        quotes: ['py-identity'],
        title: 'Branches, and checking for None',
        paragraphs: [
          'The first branch whose test is true runs, and the rest are skipped. Test for None with is, and compare values with ==.',
        ],
        examples: [
          { id: 'control-1', code: 'for kg in [3, 12, 25]:\n    if kg < 5:\n        label = "light"\n    elif kg <= 20:\n        label = "medium"\n    else:\n        label = "heavy"\n    print(kg, label)\n\nnote = None\nprint(note is None, note == "")\n' },
        ],
        commonMistakes: ['IS_VS_EQUALS'],
      },
      {
        id: 'control-range',
        docClaim: true,
        quotes: ['py-range-end'],
        title: 'Loops and range()',
        paragraphs: [
          'range(a, b) gives a, a+1, and so on up to b-1. range(n) starts at 0 and stops before n.',
        ],
        examples: [{ id: 'control-2', code: 'print(list(range(3)))\nprint(list(range(1, 4)))\nfor i in range(1, 4):\n    print("parcel", i)\n' }],
        commonMistakes: ['OFF_BY_ONE_RANGE'],
      },
    ],
  },
];
