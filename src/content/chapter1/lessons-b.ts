// Chapter 1 lessons 8 to 13. Each example runs in the engine, and its output is recorded
// in generated/chapter1.outputs.json. Every claim in a section is shown by its examples.
import type { Lesson } from './types';

export const LESSONS_B: Lesson[] = [
  {
    id: 'c01-foundations/functions-params',
    number: 8,
    title: 'Functions: defaults, *args, and **kwargs',
    competency: 'functions-params',
    jsNotes: [
      { id: 'js-default', text: 'In JavaScript, a default parameter is evaluated when the function is called, not when it is defined. In Python, a default is evaluated once, when the function is defined, so a list default is shared between calls.', quotes: ['js-default', 'py-default-once'] },
      { id: 'js-scope', text: 'In JavaScript, let creates a variable with block scope, the scope created by a pair of curly braces. In Python, a name assigned inside a function is local to that function, as the first example in the scope section shows.', quotes: ['js-block-scope'] },
    ],
    intro: 'A function takes parameters, may have defaults, and can collect extra positional or keyword arguments.',
    sections: [
      {
        id: 'functions-params',
        docClaim: true,
        quotes: ['py-args', 'py-kwargs'],
        title: 'Defaults, *args, and **kwargs',
        paragraphs: [
          'A parameter with a default can be left out when the function is called. *args collects extra positional arguments into a tuple, and **kwargs collects extra keyword arguments into a dict.',
        ],
        examples: [
          { id: 'functions-1', code: 'def label(name, *tags, sep="|", **options):\n    return sep.join([name, str(len(tags)), str(sorted(options))])\n\nprint(label("A"))\nprint(label("A", "x", "y", color="red", size=2))\n' },
        ],
        commonMistakes: ['MISSING_ARGUMENT'],
      },
      {
        id: 'functions-scope',
        docClaim: true,
        quotes: ['py-default-once'],
        title: 'Names inside a function, and defaults that are lists',
        paragraphs: [
          'Assigning to a name inside a function makes it local, so the outer name keeps its value.',
          'A default is evaluated once, when the function is defined. A list default is shared by every call that does not pass its own list.',
        ],
        examples: [
          { id: 'functions-2', code: 'count = 0\ndef bump():\n    count = 1\n    return count\n\nprint(bump(), count)\n' },
          { id: 'functions-3', code: 'def add_stop(stop, stops=[]):\n    stops.append(stop)\n    return stops\n\nprint(add_stop("A"))\nprint(add_stop("B"))\n' },
        ],
        commonMistakes: ['SCOPE_SHADOWING', 'MUTABLE_DEFAULT'],
      },
    ],
  },
  {
    id: 'c01-foundations/comprehensions',
    number: 9,
    title: 'Comprehensions',
    competency: 'comprehensions',
    jsNotes: [],
    intro: 'A comprehension builds a list, set, or dict from a loop in one expression.',
    sections: [
      {
        id: 'comprehensions-build',
        docClaim: true,
        quotes: ['py-comprehension'],
        title: 'List, set, and dict comprehensions',
        paragraphs: [
          'A list comprehension has the form [expression for item in items if condition]. Set and dict comprehensions use {} instead of [].',
        ],
        examples: [
          { id: 'comprehensions-1', code: 'weights = [4, 12, 7, 20]\nprint([w * 2 for w in weights if w > 5])\nprint({w % 3 for w in weights})\nprint({w: w // 5 for w in weights})\n' },
        ],
        commonMistakes: ['COMPREHENSION_SIDE_EFFECT'],
      },
    ],
  },
  {
    id: 'c01-foundations/exceptions',
    number: 10,
    title: 'Exceptions',
    competency: 'exceptions',
    jsNotes: [],
    intro: 'An exception stops normal flow when something goes wrong. try and except let the code respond to a specific error.',
    sections: [
      {
        id: 'exceptions-catch',
        docClaim: false,
        quotes: [],
        title: 'Catching a specific error',
        paragraphs: [
          'Put code that may fail in a try block. The except block runs only for the error type it names.',
        ],
        examples: [
          { id: 'exceptions-1', code: 'def to_int(text):\n    try:\n        return int(text)\n    except ValueError:\n        return None\n\nprint(to_int("12"), to_int("x"))\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'exceptions-broad',
        docClaim: true,
        quotes: ['py-except-wildcard'],
        title: 'Why a broad except is risky',
        paragraphs: [
          'except Exception catches almost every ordinary error. A bug in the code can be hidden that way, because the wrong error is caught too.',
        ],
        examples: [
          { id: 'exceptions-2', code: 'def weight_or_zero(value):\n    try:\n        return float(value) * 2\n    except Exception:\n        return 0.0\n\nprint(weight_or_zero("3"), weight_or_zero(None))\n' },
        ],
        commonMistakes: ['EXCEPTION_TOO_BROAD'],
      },
    ],
  },
  {
    id: 'c01-foundations/with-blocks',
    number: 11,
    title: 'with blocks',
    competency: 'with-blocks',
    jsNotes: [],
    intro: 'A with block opens a resource and closes it when the block ends, even when an error happens.',
    sections: [
      {
        id: 'with-close',
        docClaim: true,
        quotes: ['py-with'],
        title: 'Using a resource inside the block',
        paragraphs: [
          'Use the file or buffer inside the with block. After the block ends, the resource is closed, so using it again raises an error.',
        ],
        examples: [
          { id: 'with-1', code: 'import io\n\nbuffer = io.StringIO("line one\\nline two")\nwith buffer as handle:\n    first = handle.readline()\n    print(repr(first))\nprint(buffer.closed)\ntry:\n    buffer.read()\nexcept ValueError as error:\n    print("ValueError:", error)\n' },
        ],
        commonMistakes: ['WITH_CLOSE_ORDER'],
      },
    ],
  },
  {
    id: 'c01-foundations/modules',
    number: 12,
    title: 'Modules and imports',
    competency: 'modules',
    jsNotes: [],
    intro: 'A module is a file of code you import. The standard library comes with Python; other modules must be installed.',
    sections: [
      {
        id: 'modules-import',
        docClaim: true,
        quotes: ['py-import-from'],
        title: 'import, and from ... import',
        paragraphs: [
          'import math gives you the module, and you use its names with a dot. from statistics import mean brings one name into your code.',
        ],
        examples: [{ id: 'modules-1', code: 'import math\nfrom statistics import mean\n\nprint(math.floor(2.7), mean([1, 2, 3]))\nprint(math.pi > 3)\n' }],
        commonMistakes: [],
      },
      {
        id: 'modules-top-level',
        docClaim: true,
        quotes: ['py-module-run'],
        title: 'Top-level code runs on import',
        paragraphs: [
          'Code at the top level of a module runs when the module is first imported. Put the work inside functions, so importing the module does not start the work.',
        ],
        examples: [{ id: 'modules-2', code: 'import json\n\nprint(json.dumps({"parcels": 2}))\n' }],
        commonMistakes: ['MODULE_SIDE_EFFECT'],
      },
    ],
  },
  {
    id: 'c01-foundations/iterators-generators',
    number: 13,
    title: 'Iterators and generators',
    competency: 'iterators-generators',
    jsNotes: [],
    intro: 'An iterator gives its values one at a time. A generator function makes one with yield.',
    sections: [
      {
        id: 'iterators-next',
        docClaim: true,
        quotes: ['py-next', 'py-next-raise'],
        title: 'iter() and next()',
        paragraphs: [
          'iter() gives an iterator for a collection. next() gives the next value, and raises StopIteration when no values are left.',
        ],
        examples: [{ id: 'iterators-1', code: 'it = iter([10, 20])\nprint(next(it), next(it))\nprint(list(it))\n' }],
        commonMistakes: [],
      },
      {
        id: 'generators-yield',
        docClaim: true,
        quotes: ['py-generator', 'py-stopiteration'],
        title: 'yield, and a generator is used once',
        paragraphs: [
          'A function with yield returns a generator. Each yield gives one value and pauses. Once the generator has given all its values, a second loop over it gets nothing.',
        ],
        examples: [
          { id: 'generators-1', code: 'def countdown(n):\n    while n > 0:\n        yield n\n        n -= 1\n\ng = countdown(2)\nprint(list(g))\nprint(list(g))\nprint(list(countdown(2)))\n' },
        ],
        commonMistakes: ['GENERATOR_EXHAUSTED'],
      },
    ],
  },
];
