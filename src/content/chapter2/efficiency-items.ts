// Chapter 2 efficiency items: three tickets where the answer is right but a slow method fails the
// time rule. Each has a correctness case, timed cases on a visible and a hidden input, and wrong
// variants that break one rule each. A timed case uses the same inputs for the reference and for
// the learner, built by make_args(size), and fails when the learner is more than 50 times slower.
import type { ChallengeSpec } from '../../challenges/types';
import { type GradedItem, fn, functionSpec, timed } from '../graded';

// Each setup defines make_args(size), which returns the arguments of the entry for that size.
const TICKET_SETUP = `import random


def make_args(size):
    rng = random.Random(20251030)
    return [[f"T{rng.randrange(size // 2)}" for _ in range(size)]]
`;

const JOB_SETUP = `import random


def make_args(size):
    rng = random.Random(20251030)
    return [[rng.randrange(1, 100) for _ in range(size)]]
`;

const STOCK_SETUP = `import random


def make_args(size):
    rng = random.Random(20251030)
    catalog = [f"S{index}" for index in range(size)]
    orders = [f"S{rng.randrange(size * 2)}" for _ in range(size)]
    return [catalog, orders]
`;

const EFFICIENCY: GradedItem[] = [
  {
    id: 'c02-eff-repeated-tickets',
    title: 'Efficiency: repeated tickets',
    lessonId: 'c02-informatics/list-dict-set',
    competencies: ['list-dict-set'],
    ticket: { from: 'Priya, Support', subject: 'Repeated tickets', body: 'tickets is the list of ticket IDs, one per customer message, in the order they arrived. It can have thousands of entries. Return each ID that appears more than once, once each, in the order of its second appearance. Keep each ID as it is written. Write repeated_tickets(tickets).' },
    rules: ['Return a list of the repeated IDs, each once.', 'Order them by where their second appearance is.', 'The time grows with the number of tickets, not with the square of it.'],
    entry: 'repeated_tickets',
    starter: 'def repeated_tickets(tickets):\n    pass\n',
    reference: 'def repeated_tickets(tickets):\n    seen = set()\n    reported = set()\n    repeated = []\n    for ticket in tickets:\n        if ticket in seen and ticket not in reported:\n            repeated.append(ticket)\n            reported.add(ticket)\n        seen.add(ticket)\n    return repeated\n',
    timing: { setup: TICKET_SETUP },
    cases: [
      fn('v-pair', 'Two IDs repeat, in the order of their second appearance', 'visible', [['T1', 'T2', 'T1', 'T3', 'T2']], [0, 1]),
      fn('v-none', 'No repeats', 'visible', [['A', 'B']], [0]),
      fn('h-triple', 'One ID three times', 'hidden', [['Z', 'Z', 'Z']], [0]),
      fn('h-order', 'The order follows the second appearance, not the first', 'hidden', [['B', 'A', 'A', 'B']], [1]),
      fn('h-empty', 'No tickets', 'hidden', [[]], [0]),
      timed('t-visible', 'A long list of tickets, timed', 'visible', 2000, [0, 1, 2]),
      timed('t-hidden', 'A much longer list of tickets, timed', 'hidden', 8000, [0, 1, 2]),
    ],
    variants: [
      ['slow-scan', 'def repeated_tickets(tickets):\n    repeated = []\n    for index, ticket in enumerate(tickets):\n        if ticket in tickets[:index] and ticket not in repeated:\n            repeated.append(ticket)\n    return repeated\n', 'BIGO_NESTED_MISREAD', 2],
      ['repeats-everything', 'def repeated_tickets(tickets):\n    seen = set()\n    repeated = []\n    for ticket in tickets:\n        if ticket in seen:\n            repeated.append(ticket)\n        seen.add(ticket)\n    return repeated\n', 'DUPLICATES_KEPT', 0],
      ['first-appearance-order', 'def repeated_tickets(tickets):\n    counts = {}\n    for ticket in tickets:\n        counts[ticket] = counts.get(ticket, 0) + 1\n    return [ticket for ticket in counts if counts[ticket] > 1]\n', 'FIRST_SEEN_ORDER', 1],
    ],
    hints: [
      'Track two things as you go: the IDs seen so far, and the IDs already reported.',
      'A set answers "have I seen this?" without scanning the list. Check it before you add the ID.',
      'if ticket in seen and ticket not in reported:\n    repeated.append(ticket)\n    reported.add(ticket)',
    ],
  },
  {
    id: 'c02-eff-job-queue',
    title: 'Efficiency: work through a job queue',
    lessonId: 'c02-informatics/deque-heapq',
    competencies: ['deque-heapq'],
    ticket: { from: 'Tomas, Print Room', subject: 'Job queue', body: 'jobs is the list of job weights, in the order the jobs arrived. It can have hundreds of thousands of entries. Work through them first in, first out. Return the running total after each job, in the same order. The total after a job includes that job. Write running_totals(jobs). jobs is a list of whole-number job weights, in the order they arrived.' },
    rules: ['Return one running total per job, in the order the jobs were worked.', 'Each total includes its own job.', 'Taking the next job from the front takes about the same time however many jobs are waiting.'],
    entry: 'running_totals',
    starter: 'def running_totals(jobs):\n    pass\n',
    reference: 'from collections import deque\n\n\ndef running_totals(jobs):\n    queue = deque(jobs)\n    total = 0\n    totals = []\n    while queue:\n        total += queue.popleft()\n        totals.append(total)\n    return totals\n',
    timing: { setup: JOB_SETUP },
    cases: [
      fn('v-small', 'Three jobs', 'visible', [[3, 1, 2]], [0, 1]),
      fn('v-empty', 'No jobs', 'visible', [[]], [0]),
      fn('h-single', 'One job', 'hidden', [[7]], [0, 1]),
      fn('h-zero', 'A zero-weight job', 'hidden', [[0, 0, 5]], [0, 1]),
      timed('t-visible', 'A long queue, timed', 'visible', 400000, [0, 1, 2]),
      timed('t-hidden', 'A longer queue, timed', 'hidden', 400000, [0, 1, 2]),
    ],
    variants: [
      ['list-front-pop', 'def running_totals(jobs):\n    queue = list(jobs)\n    total = 0\n    totals = []\n    while queue:\n        total += queue.pop(0)\n        totals.append(total)\n    return totals\n', 'LIST_FRONT_POP', 2],
      ['total-before-add', 'from collections import deque\n\n\ndef running_totals(jobs):\n    queue = deque(jobs)\n    total = 0\n    totals = []\n    while queue:\n        totals.append(total)\n        total += queue.popleft()\n    return totals\n', 'TOTAL_BEFORE_ADD', 1],
      ['one-total', 'from collections import deque\n\n\ndef running_totals(jobs):\n    queue = deque(jobs)\n    total = 0\n    while queue:\n        total += queue.popleft()\n    return [total]\n', 'WRONG_RETURN_SHAPE', 0],
    ],
    hints: [
      'Think about which end of a list is slow to remove from, and why.',
      'collections.deque removes from its left end without moving the items that stay.',
      'queue = deque(jobs)\nwhile queue:\n    total += queue.popleft()',
    ],
  },
  {
    id: 'c02-eff-stock-check',
    title: 'Efficiency: check order lines against the catalog',
    lessonId: 'c02-informatics/list-dict-set',
    competencies: ['list-dict-set'],
    ticket: { from: 'Omar, Warehouse', subject: 'Stock check', body: "catalog is the list of SKUs we stock, and orders is the list of SKUs on today's order lines. The catalog has thousands of SKUs. For each order line, return True if we stock that SKU and False if we do not. Return the answers in the same order as orders. Write stock_check(catalog, orders)." },
    rules: ['Return one True or False per order line, in the same order.', 'A line is True only when its SKU is in the catalog.', 'The check for each line takes about the same time however large the catalog is.'],
    entry: 'stock_check',
    starter: 'def stock_check(catalog, orders):\n    pass\n',
    reference: 'def stock_check(catalog, orders):\n    stocked = set(catalog)\n    return [sku in stocked for sku in orders]\n',
    timing: { setup: STOCK_SETUP },
    cases: [
      fn('v-mixed', 'Some SKUs stocked, some not', 'visible', [['A1', 'B2'], ['B2', 'C3', 'A1']], [0, 1]),
      fn('v-empty-catalog', 'An empty catalog', 'visible', [[], ['A1']], [1]),
      fn('h-no-orders', 'No order lines', 'hidden', [['A1'], []], [0]),
      fn('h-repeat', 'The same SKU on two lines', 'hidden', [['S'], ['S', 'S']], [0, 1]),
      timed('t-visible', 'A catalog of 2000 SKUs, timed', 'visible', 2000, [0, 1, 2]),
      timed('t-hidden', 'A catalog of 8000 SKUs, timed', 'hidden', 8000, [0, 1, 2]),
    ],
    variants: [
      ['list-lookup', 'def stock_check(catalog, orders):\n    return [sku in catalog for sku in orders]\n', 'BIGO_LIST_LOOKUP', 2],
      ['inverted', 'def stock_check(catalog, orders):\n    stocked = set(catalog)\n    return [sku not in stocked for sku in orders]\n', 'INVERTED_MEMBERSHIP', 1],
      ['first-line-only', 'def stock_check(catalog, orders):\n    stocked = set(catalog)\n    return [sku in stocked for sku in orders[:1]]\n', 'WRONG_RETURN_SHAPE', 0],
    ],
    hints: [
      'A line is True when its SKU is in the catalog. Check the rule for each line.',
      'A set answers "is this SKU stocked?" in the same time however many SKUs there are.',
      'stocked = set(catalog)\nreturn [sku in stocked for sku in orders]',
    ],
  },
];

export const EFFICIENCY_SPECS: ChallengeSpec[] = EFFICIENCY.map((item) => functionSpec('c02-informatics', item));
