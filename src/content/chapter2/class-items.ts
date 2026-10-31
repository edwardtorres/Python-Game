// Chapter 2 class items: three tickets that each need a class. Each is graded by behaviour (the
// cases on the entry's output) and by ast checks of the learner's code, in the same run. A wrong
// variant breaks one rule, and a structure check names the rule it belongs to.
import type { ChallengeSpec } from '../../challenges/types';
import { type GradedItem, fn, functionSpec } from '../graded';

const CLASS_ITEMS: GradedItem[] = [
  {
    id: 'c02-class-parcel-order',
    title: 'Class: order parcels with a dataclass',
    lessonId: 'c02-informatics/dataclasses',
    competencies: ['classes', 'dataclasses'],
    ticket: { from: 'Dana, Loading', subject: 'Lightest first', body: 'rows is a list of (kg, name) pairs. Write a dataclass named Parcel with two fields, kg first and then name, and sort the parcels so that the lightest comes first. Parcels with the same weight are ordered A to Z by name. Return the names in that order. Write lightest_names(rows).' },
    rules: ['Return the names only, as a list.', 'The lightest parcel comes first.', 'Parcels with the same weight are ordered A to Z by name.', 'Parcel is a dataclass whose fields are kg, then name, so the weight decides the order.'],
    entry: 'lightest_names',
    starter: 'def lightest_names(rows):\n    pass\n',
    reference: 'from dataclasses import dataclass\n\n\n@dataclass(order=True)\nclass Parcel:\n    kg: float\n    name: str\n\n\ndef lightest_names(rows):\n    parcels = [Parcel(kg, name) for kg, name in rows]\n    return [parcel.name for parcel in sorted(parcels)]\n',
    cases: [
      fn('v-mixed', 'Three parcels, two of the same weight', 'visible', [[[12, 'Drum'], [3, 'Bag'], [12, 'Crate']]], [0, 1, 2]),
      fn('v-one', 'One parcel', 'visible', [[[3, 'Bag']]], [0]),
      fn('h-ties', 'Ties in name order, A to Z', 'hidden', [[[5, 'Zed'], [5, 'Amy'], [2, 'Max']]], [0, 1, 2, 3]),
      fn('h-fields', 'The weight decides the order, not the name', 'hidden', [[[9, 'Aaa'], [1, 'Zzz']]], [0, 1, 3]),
      fn('h-empty', 'No parcels', 'hidden', [[]], [0]),
    ],
    variants: [
      ['no-ordering', 'from dataclasses import dataclass\n\n\n@dataclass\nclass Parcel:\n    kg: float\n    name: str\n\n\ndef lightest_names(rows):\n    parcels = [Parcel(kg, name) for kg, name in rows]\n    return [parcel.name for parcel in sorted(parcels)]\n', 'DUNDER_MISSING', 1],
      ['fields-swapped', 'from dataclasses import dataclass\n\n\n@dataclass(order=True)\nclass Parcel:\n    name: str\n    kg: float\n\n\ndef lightest_names(rows):\n    parcels = [Parcel(name, kg) for kg, name in rows]\n    return [parcel.name for parcel in sorted(parcels)]\n', 'FIELD_ORDER_SORT', 3],
      ['objects-returned', 'from dataclasses import dataclass\n\n\n@dataclass(order=True)\nclass Parcel:\n    kg: float\n    name: str\n\n\ndef lightest_names(rows):\n    parcels = [Parcel(kg, name) for kg, name in rows]\n    return sorted(parcels)\n', 'WRONG_RETURN_SHAPE', 0],
      ['weight-only-key', 'from dataclasses import dataclass\n\n\n@dataclass(order=True)\nclass Parcel:\n    kg: float\n    name: str\n\n\ndef lightest_names(rows):\n    parcels = [Parcel(kg, name) for kg, name in rows]\n    return [parcel.name for parcel in sorted(parcels, key=lambda parcel: parcel.kg)]\n', 'SORT_TIES_IGNORED', 2],
    ],
    checks: [
      { type: 'decorated_with', label: 'decorate Parcel with @dataclass', name: 'dataclass', within: 'Parcel', rules: [3] },
      { type: 'defines', label: 'define Parcel', name: 'Parcel', rules: [3] },
    ],
    hints: [
      'A dataclass gives its fields in the order they are written. Read the fourth rule first.',
      'Sorting a list of dataclasses compares the first field, then the next, using order=True.',
      '@dataclass(order=True)\nclass Parcel:\n    kg: float\n    name: str',
    ],
  },
  {
    id: 'c02-class-pallet-inherit',
    title: 'Class: a pallet is a parcel with a count',
    lessonId: 'c02-informatics/inheritance',
    competencies: ['classes', 'inheritance'],
    ticket: { from: 'Lena, Pallets', subject: 'Pallet totals', body: 'rows is a list of (kg, name, count) triples. Parcel is a plain class that stores kg and name. Write Pallet as a subclass of Parcel that adds count, with a total_weight method that returns kg times count. Return a (name, total) pair for each row, in the order the rows were given. Write pallet_totals(rows).' },
    rules: ['Return (name, total) pairs, in the order the rows were given.', 'Pallet inherits from Parcel, and its __init__ sets kg and name through Parcel.', 'The total is kg times count, not kg plus count.'],
    entry: 'pallet_totals',
    starter: 'def pallet_totals(rows):\n    pass\n',
    reference: 'class Parcel:\n    def __init__(self, kg, name):\n        self.kg = kg\n        self.name = name\n\n\nclass Pallet(Parcel):\n    def __init__(self, kg, name, count):\n        super().__init__(kg, name)\n        self.count = count\n\n    def total_weight(self):\n        return self.kg * self.count\n\n\ndef pallet_totals(rows):\n    totals = []\n    for kg, name, count in rows:\n        pallet = Pallet(kg, name, count)\n        totals.append((pallet.name, pallet.total_weight()))\n    return totals\n',
    cases: [
      fn('v-two', 'Two pallets', 'visible', [[[2.5, 'Drum', 3], [1.0, 'Bag', 4]]], [0, 1, 2]),
      fn('v-one', 'One pallet', 'visible', [[[2.0, 'Crate', 1]]], [0, 1, 2]),
      fn('h-zero-count', 'A pallet with no boxes', 'hidden', [[[2.0, 'Empty', 0]]], [1, 2]),
      fn('h-order', 'The order of the rows is kept', 'hidden', [[[1.0, 'Zed', 2], [1.0, 'Amy', 2]]], [0, 1, 2]),
      fn('h-empty', 'No rows', 'hidden', [[]], [0]),
    ],
    variants: [
      ['no-super', 'class Parcel:\n    def __init__(self, kg, name):\n        self.kg = kg\n        self.name = name\n\n\nclass Pallet(Parcel):\n    def __init__(self, kg, name, count):\n        self.kg = kg\n        self.count = count\n\n    def total_weight(self):\n        return self.kg * self.count\n\n\ndef pallet_totals(rows):\n    totals = []\n    for kg, name, count in rows:\n        pallet = Pallet(kg, name, count)\n        totals.append((pallet.name, pallet.total_weight()))\n    return totals\n', 'SUPER_NOT_CALLED', 1],
      ['adds-not-multiplies', 'class Parcel:\n    def __init__(self, kg, name):\n        self.kg = kg\n        self.name = name\n\n\nclass Pallet(Parcel):\n    def __init__(self, kg, name, count):\n        super().__init__(kg, name)\n        self.count = count\n\n    def total_weight(self):\n        return self.kg + self.count\n\n\ndef pallet_totals(rows):\n    totals = []\n    for kg, name, count in rows:\n        pallet = Pallet(kg, name, count)\n        totals.append((pallet.name, pallet.total_weight()))\n    return totals\n', 'OPERATOR_MIXUP', 2],
      ['reversed-rows', 'class Parcel:\n    def __init__(self, kg, name):\n        self.kg = kg\n        self.name = name\n\n\nclass Pallet(Parcel):\n    def __init__(self, kg, name, count):\n        super().__init__(kg, name)\n        self.count = count\n\n    def total_weight(self):\n        return self.kg * self.count\n\n\ndef pallet_totals(rows):\n    totals = []\n    for kg, name, count in reversed(rows):\n        pallet = Pallet(kg, name, count)\n        totals.append((pallet.name, pallet.total_weight()))\n    return totals\n', 'REVERSED_ORDER', 0],
    ],
    checks: [
      { type: 'subclass_of', label: 'make Pallet a subclass of Parcel', name: 'Parcel', within: 'Pallet', rules: [1] },
      { type: 'calls_method', label: 'call super().__init__ in Pallet', name: '__init__', within: 'Pallet', rules: [1] },
      { type: 'defines', label: 'define total_weight in Pallet', name: 'total_weight', within: 'Pallet', rules: [2] },
    ],
    hints: [
      'A subclass gets the parent\'s attributes only when its __init__ calls the parent\'s __init__.',
      'super().__init__(kg, name) runs Parcel.__init__ on the pallet you are building.',
      'def total_weight(self):\n    return self.kg * self.count',
    ],
  },
  {
    id: 'c02-class-version-dunders',
    title: 'Class: versions with __repr__ and __lt__',
    lessonId: 'c02-informatics/dunder-methods',
    competencies: ['classes', 'dunder-methods'],
    ticket: { from: 'Sam, Releases', subject: 'Version order', body: 'pairs is a list of (major, minor) numbers for each release. Write a class Version with major and minor, a __repr__ that shows Version(major, minor), and a __lt__ that puts the lower version first, so 9.0 comes before 10.0. Return the sorted versions as text, lowest first. Write sorted_versions(pairs). pairs is a list of (major, minor) pairs of whole numbers.' },
    rules: ['Return one text entry per version, lowest first.', 'Versions compare as numbers: 9.0 comes before 10.0.', 'Each entry is written as Version(major, minor).'],
    entry: 'sorted_versions',
    starter: 'def sorted_versions(pairs):\n    pass\n',
    reference: 'class Version:\n    def __init__(self, major, minor):\n        self.major = major\n        self.minor = minor\n\n    def __repr__(self):\n        return f"Version({self.major}, {self.minor})"\n\n    def __lt__(self, other):\n        return (self.major, self.minor) < (other.major, other.minor)\n\n\ndef sorted_versions(pairs):\n    versions = [Version(major, minor) for major, minor in pairs]\n    return [repr(version) for version in sorted(versions)]\n',
    cases: [
      fn('v-small', 'Two versions', 'visible', [[[2, 0], [1, 9]]], [0, 1, 2]),
      fn('v-two-digit', 'Ten comes after nine', 'visible', [[[10, 1], [9, 0]]], [0, 1, 2]),
      fn('h-same-major', 'Same major, minors compared as numbers', 'hidden', [[[3, 10], [3, 2]]], [0, 1, 2]),
      fn('h-empty', 'No versions', 'hidden', [[]], [0]),
    ],
    variants: [
      ['text-compare', 'class Version:\n    def __init__(self, major, minor):\n        self.major = major\n        self.minor = minor\n\n    def __repr__(self):\n        return f"Version({self.major}, {self.minor})"\n\n    def __lt__(self, other):\n        return f"{self.major}.{self.minor}" < f"{other.major}.{other.minor}"\n\n\ndef sorted_versions(pairs):\n    versions = [Version(major, minor) for major, minor in pairs]\n    return [repr(version) for version in sorted(versions)]\n', 'VERSION_AS_TEXT', 1],
      ['no-lt', 'class Version:\n    def __init__(self, major, minor):\n        self.major = major\n        self.minor = minor\n\n    def __repr__(self):\n        return f"Version({self.major}, {self.minor})"\n\n\ndef sorted_versions(pairs):\n    versions = [Version(major, minor) for major, minor in pairs]\n    return [repr(version) for version in sorted(versions)]\n', 'DUNDER_MISSING', 1],
      ['plain-repr', 'class Version:\n    def __init__(self, major, minor):\n        self.major = major\n        self.minor = minor\n\n    def __repr__(self):\n        return f"Version({self.major}.{self.minor})"\n\n    def __lt__(self, other):\n        return (self.major, self.minor) < (other.major, other.minor)\n\n\ndef sorted_versions(pairs):\n    versions = [Version(major, minor) for major, minor in pairs]\n    return [repr(version) for version in sorted(versions)]\n', 'REPR_FORMAT', 2],
      ['objects-returned', 'class Version:\n    def __init__(self, major, minor):\n        self.major = major\n        self.minor = minor\n\n    def __repr__(self):\n        return f"Version({self.major}, {self.minor})"\n\n    def __lt__(self, other):\n        return (self.major, self.minor) < (other.major, other.minor)\n\n\ndef sorted_versions(pairs):\n    versions = [Version(major, minor) for major, minor in pairs]\n    return sorted(versions)\n', 'WRONG_RETURN_SHAPE', 0],
    ],
    checks: [
      { type: 'defines', label: 'define __lt__ in Version', name: '__lt__', within: 'Version', rules: [1] },
      { type: 'defines', label: 'define __repr__ in Version', name: '__repr__', within: 'Version', rules: [2] },
    ],
    hints: [
      'Python calls __lt__ when it sorts. Define it on the pair of numbers, not on the text.',
      'Compare (self.major, self.minor) with (other.major, other.minor). Tuples compare number by number.',
      'def __repr__(self):\n    return f"Version({self.major}, {self.minor})"',
    ],
  },
];

export const CLASS_SPECS: ChallengeSpec[] = CLASS_ITEMS.map((item) => functionSpec('c02-informatics', item));
