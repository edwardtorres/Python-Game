// Chapter 2 lessons 1 to 6. Each example runs in the engine, and its output is recorded in
// generated/chapter2.outputs.json. A section with no quote is labelled as demonstrated by the
// interpreter, and its example is the evidence.
import type { Lesson } from '../types';

export const LESSONS_A: Lesson[] = [
  {
    id: 'c02-informatics/classes',
    number: 1,
    title: 'Classes and instances',
    competency: 'classes',
    jsNotes: [],
    intro: 'A class groups data with the functions that work on it. Each instance has its own attributes, and a class attribute is shared by every instance.',
    sections: [
      {
        id: 'classes-instances',
        docClaim: true,
        quotes: ['py-class-variables'],
        title: 'Each instance has its own attributes',
        paragraphs: [
          'Define a class with the class keyword. __init__ runs when an instance is made, and self is the instance inside each method.',
          'Attributes set on self belong to one instance. Two instances keep separate values.',
        ],
        examples: [
          { id: 'c02-classes-1', code: 'class Parcel:\n    def __init__(self, name, kg):\n        self.name = name\n        self.kg = kg\n\n    def label(self):\n        return f"{self.name} ({self.kg} kg)"\n\n\na = Parcel("Crate", 12)\nb = Parcel("Pallet", 30)\nprint(a.label(), b.label())\nprint(a.kg + b.kg)\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'classes-shared',
        docClaim: true,
        quotes: ['py-class-variables'],
        title: 'A value on the class is shared',
        paragraphs: [
          'A value written in the class body is one object shared by every instance. A list there is one list for all of them.',
          'A value set on self is different for each instance. Set mutable values in __init__ so each instance has its own.',
        ],
        examples: [
          { id: 'c02-classes-2', code: 'class Dock:\n    shared = []\n\n    def __init__(self, name):\n        self.name = name\n        self.own = []\n\n\none = Dock("A")\ntwo = Dock("B")\none.shared.append("x")\none.own.append("y")\nprint(two.shared, two.own)\n' },
        ],
        commonMistakes: ['SHARED_CLASS_ATTRIBUTE'],
      },
    ],
  },
  {
    id: 'c02-informatics/dataclasses',
    number: 2,
    title: 'Dataclasses',
    competency: 'dataclasses',
    jsNotes: [],
    intro: 'A dataclass writes __init__, __repr__, and __eq__ from the fields you annotate. Use it for a record that only holds values.',
    sections: [
      {
        id: 'dataclass-fields',
        docClaim: true,
        quotes: ['py-dataclass-purpose'],
        title: 'Annotated fields become the class',
        paragraphs: [
          'Put @dataclass above a class and list its fields with type hints. The decorator writes __init__ and __repr__ for you.',
          'Two instances with the same field values compare equal.',
        ],
        examples: [
          { id: 'c02-dataclass-1', code: 'from dataclasses import dataclass\n\n\n@dataclass\nclass Parcel:\n    name: str\n    kg: float\n\n\np = Parcel("Crate", 12.5)\nprint(p)\nprint(p == Parcel("Crate", 12.5))\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'dataclass-defaults',
        docClaim: true,
        quotes: ['py-dataclass-mutable'],
        title: 'A list field needs default_factory',
        paragraphs: [
          'A list default written as [] is rejected when the class is defined. field(default_factory=list) gives each instance its own list.',
        ],
        examples: [
          { id: 'c02-dataclass-2', code: 'from dataclasses import dataclass, field\n\n\n@dataclass\nclass Route:\n    stops: list = field(default_factory=list)\n\n\na = Route()\nb = Route()\na.stops.append("Dock 1")\nprint(a.stops, b.stops)\n' },
          { id: 'c02-dataclass-3', code: 'from dataclasses import dataclass\n\ntry:\n    @dataclass\n    class Bad:\n        stops: list = []\nexcept ValueError as error:\n    print(type(error).__name__)\n' },
        ],
        commonMistakes: ['DATACLASS_MUTABLE_DEFAULT'],
      },
    ],
  },
  {
    id: 'c02-informatics/inheritance',
    number: 3,
    title: 'Inheritance',
    competency: 'inheritance',
    jsNotes: [],
    intro: 'A subclass reuses the methods of its parent. It can override a method, and super() reaches the parent version.',
    sections: [
      {
        id: 'inherit-override',
        docClaim: true,
        quotes: ['py-inheritance'],
        title: 'A subclass can override a method',
        paragraphs: [
          'Name the parent in brackets after the subclass name. A method defined in the subclass is used for its instances.',
          'isinstance() is true for a subclass instance and its parent class.',
        ],
        examples: [
          { id: 'c02-inherit-1', code: 'class Parcel:\n    def label(self):\n        return "parcel"\n\n\nclass Pallet(Parcel):\n    def label(self):\n        return "pallet"\n\n\nclass Crate(Parcel):\n    pass\n\n\nprint(Parcel().label(), Pallet().label(), Crate().label())\nprint(isinstance(Crate(), Parcel))\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'inherit-super',
        docClaim: true,
        quotes: ['py-super'],
        title: 'super() reaches the parent setup',
        paragraphs: [
          'When a subclass defines __init__, call super().__init__() first. The parent sets its own attributes that way.',
        ],
        examples: [
          { id: 'c02-inherit-2', code: 'class Parcel:\n    def __init__(self, kg):\n        self.kg = kg\n\n\nclass Pallet(Parcel):\n    def __init__(self, kg, boards):\n        super().__init__(kg)\n        self.boards = boards\n\n\npallet = Pallet(30, 4)\nprint(pallet.kg, pallet.boards)\n' },
        ],
        commonMistakes: ['SUPER_NOT_CALLED'],
      },
    ],
  },
  {
    id: 'c02-informatics/dunder-methods',
    number: 4,
    title: 'Dunder methods',
    competency: 'dunder-methods',
    jsNotes: [],
    intro: 'Methods named with two underscores on each side let your objects work with len(), print(), ==, and +.',
    sections: [
      {
        id: 'dunder-len-str',
        docClaim: true,
        quotes: ['py-datamodel-len', 'py-datamodel-str'],
        title: 'len() and print() use your methods',
        paragraphs: [
          '__len__ answers len(). __str__ gives the text that print() shows.',
        ],
        examples: [
          { id: 'c02-dunder-1', code: 'class Crate:\n    def __init__(self, items):\n        self.items = items\n\n    def __len__(self):\n        return len(self.items)\n\n    def __str__(self):\n        return f"Crate with {len(self)} items"\n\n\ncrate = Crate(["a", "b", "c"])\nprint(len(crate))\nprint(crate)\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'dunder-eq-add',
        docClaim: true,
        quotes: ['py-datamodel-eq'],
        title: '== and + use your methods',
        paragraphs: [
          'By default, == on your own objects compares identity. Define __eq__ to compare values, and __add__ to make + work.',
        ],
        examples: [
          { id: 'c02-dunder-2', code: 'class Weight:\n    def __init__(self, kg):\n        self.kg = kg\n\n    def __eq__(self, other):\n        return self.kg == other.kg\n\n    def __add__(self, other):\n        return Weight(self.kg + other.kg)\n\n\nprint(Weight(2) == Weight(2), Weight(2) == Weight(3))\nprint((Weight(2) + Weight(5)).kg)\n' },
        ],
        commonMistakes: ['EQ_NOT_DEFINED'],
      },
    ],
  },
  {
    id: 'c02-informatics/big-o',
    number: 5,
    title: 'Big-O and counting steps',
    competency: 'big-o',
    jsNotes: [],
    intro: 'Big-O describes how the number of steps grows as the input grows. Counting steps with a small probe shows the difference.',
    sections: [
      {
        id: 'bigo-steps',
        docClaim: false,
        quotes: [],
        title: 'Counting the steps of a lookup',
        paragraphs: [
          'A probe counts each comparison. Looking for one item in a list compares it with every item before it, so the count grows with the list. A set finds the item by its hash, so the count stays small.',
        ],
        examples: [
          { id: 'c02-bigo-1', code: 'class Probe:\n    comparisons = 0\n\n    def __init__(self, value):\n        self.value = value\n\n    def __eq__(self, other):\n        Probe.comparisons += 1\n        return self.value == other.value\n\n    def __hash__(self):\n        return hash(self.value)\n\n\ndef lookup_cost(n):\n    items = [Probe(i) for i in range(n)]\n    lookup = set(items)\n    target = Probe(n - 1)\n    Probe.comparisons = 0\n    target in items\n    list_cost = Probe.comparisons\n    Probe.comparisons = 0\n    target in lookup\n    return list_cost, Probe.comparisons\n\n\nfor n in (100, 200):\n    print(n, lookup_cost(n))\n' },
        ],
        commonMistakes: ['BIGO_LIST_LOOKUP'],
      },
      {
        id: 'bigo-loops',
        docClaim: false,
        quotes: [],
        title: 'A loop inside a loop multiplies',
        paragraphs: [
          'One loop over n items takes about n steps. A loop over n items inside another loop over n items takes about n times n steps.',
        ],
        examples: [
          { id: 'c02-bigo-2', code: 'def pair_steps(n):\n    steps = 0\n    for i in range(n):\n        for j in range(n):\n            steps += 1\n    return steps\n\n\nprint([pair_steps(n) for n in (10, 20)])\n' },
        ],
        commonMistakes: ['BIGO_NESTED_MISREAD'],
      },
    ],
  },
  {
    id: 'c02-informatics/list-dict-set',
    number: 6,
    title: 'Choosing a list, dict, or set',
    competency: 'list-dict-set',
    jsNotes: [],
    intro: 'Pick the container by the question you ask. A list keeps order, a dict finds values by key, and a set answers membership and removes repeats.',
    sections: [
      {
        id: 'containers-pick',
        docClaim: true,
        quotes: ['py-sets'],
        title: 'Sets answer membership and repeats',
        paragraphs: [
          'A list keeps positions, so you ask for stops[0]. A set answers is this item here, and it keeps one copy of each value.',
        ],
        examples: [
          { id: 'c02-containers-1', code: 'stops = ["Dock 1", "Dock 2", "Dock 1"]\nprint(stops[0], stops.count("Dock 1"))\nseen = set(stops)\nprint(len(seen), "Dock 2" in seen)\n' },
        ],
        commonMistakes: [],
      },
      {
        id: 'containers-hashable',
        docClaim: true,
        quotes: ['py-hashable', 'py-mutable-containers'],
        title: 'Only hashable values go in a set',
        paragraphs: [
          'A set item and a dict key must be hashable. A list is not hashable, so a list cannot be a set item or a key. A tuple of plain values can be.',
        ],
        examples: [
          { id: 'c02-containers-2', code: 'try:\n    seen = {[1, 2]}\nexcept TypeError as error:\n    print(type(error).__name__)\nprint({(1, 2): "pair"}[(1, 2)])\n' },
        ],
        commonMistakes: ['UNHASHABLE_KEY'],
      },
    ],
  },
];
