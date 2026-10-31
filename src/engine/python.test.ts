import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { PyRuntime } from './runtime';
import type { ApiPayload, GradePayload, MlPayload, StructurePayload, SuitePayload, TestingPayload } from './types';

let runtime: PyRuntime;

beforeAll(async () => {
  runtime = new PyRuntime({
    indexURL: `${path.resolve('public/pyodide')}/`,
    loadModule: async () => (await import('pyodide')) as never,
  });
  await runtime.init();
  await runtime.loadPackages(['pandas', 'matplotlib', 'scikit-learn']);
}, 300_000);

const DATASETS = {};

function functionPayload(learner: string, reference: string, overrides: Partial<GradePayload> = {}): GradePayload {
  return {
    kind: 'function',
    entry: 'answer',
    learner,
    reference,
    scope: 'all',
    rules: {},
    cases: [{ id: 'c1', label: 'call', visibility: 'visible', args: [] }],
    variants: [],
    requires: [],
    ...overrides,
  };
}

describe('determinism and isolation', () => {
  const randomLearner = 'import random\nimport numpy as np\n\ndef answer():\n    return [random.random(), float(np.random.rand())]\n';

  it('gives identical results for identical runs of random code', () => {
    const payload = functionPayload(randomLearner, randomLearner);
    const first = runtime.grade(JSON.stringify(payload), JSON.stringify(DATASETS));
    const second = runtime.grade(JSON.stringify(payload), JSON.stringify(DATASETS));
    expect(first.status).toBe('pass');
    expect(second).toEqual(first);
  });

  it('keeps identical results even after other code has used the RNG', () => {
    const payload = functionPayload(randomLearner, randomLearner);
    const before = runtime.grade(JSON.stringify(payload), JSON.stringify(DATASETS));
    runtime.grade(JSON.stringify(functionPayload('import random\ndef answer():\n    return [random.random() for _ in range(50)]\n', randomLearner)), JSON.stringify(DATASETS));
    const after = runtime.grade(JSON.stringify(payload), JSON.stringify(DATASETS));
    expect(after).toEqual(before);
  });

  it('does not let files or modules from one run reach the next', () => {
    const writer = 'import os\nos.makedirs("/home/pyodide/work", exist_ok=True)\nwith open("/home/pyodide/work/leak.py", "w") as handle:\n    handle.write("VALUE = 7\\n")\n\ndef answer():\n    return 1\n';
    const reader = 'import leak\n\ndef answer():\n    return leak.VALUE\n';
    expect(runtime.grade(JSON.stringify(functionPayload(writer, writer)), JSON.stringify(DATASETS)).status).toBe('pass');
    const result = runtime.grade(JSON.stringify(functionPayload(reader, writer)), JSON.stringify(DATASETS));
    expect(result.status).toBe('error');
    expect(result.error?.type).toBe('ModuleNotFoundError');
  });

  it('reports a learner exception with the line number in the learner code', () => {
    const broken = 'def answer():\n    return 1 / 0\n';
    const result = runtime.grade(JSON.stringify(functionPayload(broken, 'def answer():\n    return 1\n')), JSON.stringify(DATASETS));
    expect(result.cases[0]?.ok).toBe(false);
    expect(result.cases[0]?.message).toContain('ZeroDivisionError');
  });
});

describe('testing grader (mutation)', () => {
  const correct = 'def add_tax(amount):\n    return round(amount * 1.2, 2)\n';
  const mutants = [
    { id: 'no-tax', label: 'Forgets the tax', code: 'def add_tax(amount):\n    return round(amount, 2)\n', mistake: { tag: 'missing-branch', title: 'The tax was forgotten', explanation: 'A test must check that the total includes the tax.' } },
    { id: 'wrong-rate', label: 'Uses a 10% tax', code: 'def add_tax(amount):\n    return round(amount * 1.1, 2)\n', mistake: { tag: 'boundary', title: 'The rate is wrong', explanation: 'Check a concrete number, so a wrong rate is caught.' } },
  ];
  const payload = (tests: string): TestingPayload => ({ kind: 'testing', entry: 'add_tax', learner: tests, reference: correct, mutants, requires: [] });

  it('passes when the tests kill every buggy version and pass the correct one', () => {
    const strong = 'def test_total_includes_tax():\n    assert add_tax(10) == 12.0\n\ndef test_zero():\n    assert add_tax(0) == 0\n';
    const result = runtime.grade(JSON.stringify(payload(strong)), JSON.stringify(DATASETS));
    expect(result.status).toBe('pass');
    expect(result.matched).toEqual([]);
  });

  it('fails and names the missed bug when a buggy version survives', () => {
    const weak = 'def test_zero():\n    assert add_tax(0) == 0\n';
    const result = runtime.grade(JSON.stringify(payload(weak)), JSON.stringify(DATASETS));
    expect(result.status).toBe('fail');
    expect(result.matched.map((m) => m.variantId)).toEqual(['no-tax', 'wrong-rate']);
    expect(result.matched[0]?.tag).toBe('missing-branch');
  });
});

describe('API grader (pagination, retries, Retry-After, backoff)', () => {
  const reference = `import json
import time


def fetch_shipments():
    items = []
    page = 1
    while page is not None:
        attempt = 0
        while True:
            attempt += 1
            response = http_get(f"/api/shipments?page={page}&per_page=10")
            if response["status"] == 200:
                break
            if attempt >= 4:
                raise RuntimeError("gave up")
            if response["status"] == 429 and response["retry_after"] is not None:
                time.sleep(response["retry_after"])
            else:
                time.sleep(2 ** attempt)
        body = json.loads(response["body"])
        items.extend(body["items"])
        page = body["next_page"]
    return items
`;
  const failures = [
    { page: 2, status: 429, retry_after: 3 },
    { page: 3, status: 503 },
  ];
  const payload = (learner: string): ApiPayload => ({
    kind: 'api',
    entry: 'fetch_shipments',
    learner,
    reference,
    failures,
    rules: { max_attempts_per_page: 4 },
    requires: [],
  });

  it('passes a learner that pages, waits for Retry-After, and backs off', () => {
    const result = runtime.grade(JSON.stringify(payload(reference)), JSON.stringify(DATASETS));
    expect(result.status, JSON.stringify(result.cases)).toBe('pass');
  });

  it('fails a learner that does not retry', () => {
    const naive = `import json


def fetch_shipments():
    items = []
    page = 1
    while page is not None:
        body = json.loads(http_get(f"/api/shipments?page={page}&per_page=10")["body"])
        items.extend(body["items"])
        page = body["next_page"]
    return items
`;
    const result = runtime.grade(JSON.stringify(payload(naive)), JSON.stringify(DATASETS));
    expect(result.status).toBe('fail');
    expect(result.cases.find((c) => c.id === 'result')?.message).toContain('JSONDecodeError');
  });

  it('fails a learner that ignores Retry-After', () => {
    const ignores = reference.replace('time.sleep(response["retry_after"])', 'time.sleep(1)');
    const result = runtime.grade(JSON.stringify(payload(ignores)), JSON.stringify(DATASETS));
    expect(result.status).toBe('fail');
    const retry = result.cases.find((c) => c.id === 'retry-0');
    expect(retry?.ok).toBe(false);
    expect(retry?.message).toContain('Retry-After');
  });
});

describe('ML grader (training data only, hidden holdout)', () => {
  const rows = Array.from({ length: 60 }, (_, i) => ({ x: i / 6, y: 3 * (i / 6) + 2 + Math.sin(i) * 0.2 }));
  const csv = (set: typeof rows) => `x,y\n${set.map((r) => `${r.x},${r.y}`).join('\n')}\n`;
  const train = csv(rows.slice(0, 40));
  const holdout = csv(rows.slice(40));
  const learnerTrainer = 'from sklearn.linear_model import LinearRegression\n\ndef train_model(df):\n    model = LinearRegression()\n    model.fit(df[["x"]], df["y"])\n    return model\n';
  const constantTrainer = 'class Constant:\n    def __init__(self, value):\n        self.value = value\n    def predict(self, frame):\n        return [self.value] * len(frame)\n\ndef train_model(df):\n    return Constant(float(df["y"].mean()))\n';
  const payload = (learner: string): MlPayload => ({
    kind: 'ml',
    entry: 'train_model',
    learner,
    train: 'train',
    holdout: 'holdout',
    features: ['x'],
    target: 'y',
    metric: 'mae',
    threshold: 0.5,
    requires: ['scikit-learn'],
  });
  const datasets = { train, holdout };

  it('passes a model that generalises to the hidden holdout', () => {
    const result = runtime.grade(JSON.stringify(payload(learnerTrainer)), JSON.stringify(datasets));
    expect(result.status, JSON.stringify(result.cases)).toBe('pass');
    expect(result.cases[0]?.visibility).toBe('hidden');
  });

  it('fails a model that ignores the features, and does not reveal the holdout data', () => {
    const result = runtime.grade(JSON.stringify(payload(constantTrainer)), JSON.stringify(datasets));
    expect(result.status).toBe('fail');
    expect(result.cases[0]?.message).toMatch(/mae = [\d.]+; needs MAE/);
  });
});

describe('structure checks (ast, never string matching)', () => {
  const checks: StructurePayload['checks'] = [
    { type: 'defines', label: 'defines clean', name: 'clean' },
    { type: 'no_loops_in', label: 'no for or while loops in clean', within: 'clean' },
    { type: 'uses_comprehension_in', label: 'uses a comprehension in clean', within: 'clean' },
  ];
  const payload = (learner: string): StructurePayload => ({ kind: 'structure', learner, checks, requires: [] });

  it('passes a vectorised, comprehension-based solution', () => {
    const result = runtime.grade(JSON.stringify(payload('def clean(values):\n    return [v * 2 for v in values]\n')), '{}');
    expect(result.status).toBe('pass');
  });

  it('fails a loop even when the output is right', () => {
    const looped = 'def clean(values):\n    out = []\n    for v in values:\n        out.append(v * 2)\n    return out\n';
    const result = runtime.grade(JSON.stringify(payload(looped)), '{}');
    expect(result.status).toBe('fail');
    expect(result.cases.find((c) => c.id === 'check-1')?.ok).toBe(false);
  });
});

describe('structure checks: hints, methods, imports, recursion, and classes', () => {
  const check = (learner: string, checks: StructurePayload['checks']) => {
    const payload: StructurePayload = { kind: 'structure', learner, checks, requires: [] };
    return runtime.grade(JSON.stringify(payload), '{}');
  };

  it('annotated_in passes when every parameter and the return value has a hint', () => {
    const result = check('def total(values: list[int]) -> int:\n    return sum(values)\n', [{ type: 'annotated_in', label: 'hints', within: 'total' }]);
    expect(result.status).toBe('pass');
  });

  it('annotated_in names the missing return hint', () => {
    const result = check('def total(values: list[int]):\n    return sum(values)\n', [{ type: 'annotated_in', label: 'hints', within: 'total' }]);
    expect(result.status).toBe('fail');
    expect(result.cases[0]?.message).toContain('return value');
  });

  it('calls_method finds popleft on any receiver, and forbids_method with an argument catches pop(0) only', () => {
    const checks: StructurePayload['checks'] = [
      { type: 'calls_method', label: 'uses popleft', name: 'popleft' },
      { type: 'forbids_method', label: 'no pop(0)', name: 'pop', arg: 0 },
    ];
    expect(check('def serve(queue):\n    return queue.popleft()\n', checks).status).toBe('pass');
    const slow = check('def serve(queue):\n    return queue.pop(0)\n', checks);
    expect(slow.status).toBe('fail');
    expect(slow.cases.map((c) => c.ok)).toEqual([false, false]);
    expect(check('def serve(queue):\n    return queue.pop()\n', [checks[1]!]).status).toBe('pass');
  });

  it('calls_symbol follows imports, so from-imports and aliases count', () => {
    const checks: StructurePayload['checks'] = [{ type: 'calls_symbol', label: 'calls heapq.heappush', name: 'heapq.heappush' }];
    expect(check('from heapq import heappush\n\ndef add(heap, x):\n    heappush(heap, x)\n', checks).status).toBe('pass');
    expect(check('import heapq as hq\n\ndef add(heap, x):\n    hq.heappush(heap, x)\n', checks).status).toBe('pass');
    expect(check('def add(heap, x):\n    heappush(heap, x)\n', checks).status).toBe('fail');
  });

  it('recurses_in passes a function that calls itself and fails one that does not', () => {
    const checks: StructurePayload['checks'] = [{ type: 'recurses_in', label: 'flatten calls itself', within: 'flatten' }];
    const recursive = 'def flatten(items):\n    out = []\n    for item in items:\n        if isinstance(item, list):\n            out.extend(flatten(item))\n        else:\n            out.append(item)\n    return out\n';
    expect(check(recursive, checks).status).toBe('pass');
    expect(check('def flatten(items):\n    return [x for sub in items for x in sub]\n', checks).status).toBe('fail');
  });

  it('defines finds classes, and dotted names reach methods and their bodies', () => {
    const checks: StructurePayload['checks'] = [
      { type: 'defines', label: 'defines Parcel', name: 'Parcel' },
      { type: 'defines', label: 'defines Parcel.total', name: 'Parcel.total' },
      { type: 'no_loops_in', label: 'no loops in Parcel.total', within: 'Parcel.total' },
    ];
    const clean = 'class Parcel:\n    def __init__(self, kg):\n        self.kg = kg\n\n    def total(self):\n        return self.kg\n';
    expect(check(clean, checks).status).toBe('pass');
    const looped = 'class Parcel:\n    def total(self):\n        out = 0\n        for kg in [self.kg]:\n            out += kg\n        return out\n';
    expect(check(looped, checks).cases.map((c) => c.ok)).toEqual([true, true, false]);
    expect(check('def Parcel(kg):\n    return kg\n', checks.slice(0, 2)).cases.map((c) => c.ok)).toEqual([true, false]);
  });
});

describe('testing grader: scope, hidden labels, and the per-test report', () => {
  const correct = 'def add_tax(amount):\n    return round(amount * 1.2, 2)\n';
  const mutants: TestingPayload['mutants'] = [
    { id: 'no-tax', label: 'Forgets the tax', code: 'def add_tax(amount):\n    return round(amount, 2)\n', mistake: { tag: 'missing-branch', title: 'The tax was forgotten', explanation: 'A test must check that the total includes the tax.' } },
    { id: 'wrong-rate', label: 'Uses a 10% tax', code: 'def add_tax(amount):\n    return round(amount * 1.1, 2)\n', visibility: 'hidden', mistake: { tag: 'boundary', title: 'The rate is wrong', explanation: 'Check a concrete number, so a wrong rate is caught.' } },
  ];
  const payload = (learner: string, overrides: Partial<TestingPayload> = {}): TestingPayload => ({ kind: 'testing', entry: 'add_tax', learner, reference: correct, mutants, requires: [], ...overrides });
  const weak = 'def test_zero():\n    assert add_tax(0) == 0\n';

  it('a Run (scope visible) leaves hidden mutants out of the cases', () => {
    const result = runtime.grade(JSON.stringify(payload(weak, { scope: 'visible' })), JSON.stringify(DATASETS));
    expect(result.cases.map((c) => c.id)).toEqual(['correct', 'no-tax']);
    expect(result.matched.map((m) => m.variantId)).toEqual(['no-tax']);
  });

  it('a Submit names a surviving hidden bug without showing its label', () => {
    const result = runtime.grade(JSON.stringify(payload(weak, { scope: 'all' })), JSON.stringify(DATASETS));
    const hidden = result.cases.find((c) => c.visibility === 'hidden');
    expect(hidden?.label).toBe('A hidden bug');
    expect(JSON.stringify(result)).not.toContain('10%');
    expect(result.matched.map((m) => m.variantId)).toEqual(['no-tax', 'wrong-rate']);
  });

  it('the report lists which test functions kill which mutants', () => {
    const strong = 'def test_total_includes_tax():\n    assert add_tax(10) == 12.0\n\ndef test_zero():\n    assert add_tax(0) == 0\n';
    const result = runtime.grade(JSON.stringify(payload(strong, { report: true })), JSON.stringify(DATASETS));
    expect(result.report).toEqual({
      tests: ['test_total_includes_tax', 'test_zero'],
      correct: ['test_total_includes_tax', 'test_zero'],
      kills: { 'no-tax': ['test_total_includes_tax'], 'wrong-rate': ['test_total_includes_tax'] },
    });
    expect(runtime.grade(JSON.stringify(payload(strong)), JSON.stringify(DATASETS)).report).toBeUndefined();
  });
});

describe('suite grader: the learner writes the implementation, owner tests run one case each', () => {
  const tests = 'def test_squares():\n    assert square(3) == 9\n\ndef test_zero():\n    assert square(0) == 0\n\ndef test_negative():\n    assert square(-4) == 16\n';
  const cases: SuitePayload['cases'] = [
    { id: 'test_squares', label: 'Squares a positive number', visibility: 'visible' },
    { id: 'test_zero', label: 'Zero stays zero', visibility: 'visible' },
    { id: 'test_negative', label: 'Squares a negative number', visibility: 'hidden' },
  ];
  const variants = [
    { id: 'plus-one', code: 'def square(x):\n    return x + 1\n', mistake: { tag: 'arithmetic', title: 'Adds instead of squaring', explanation: 'Squaring multiplies a number by itself.' } },
    { id: 'no-negatives', code: 'def square(x):\n    return x * x if x >= 0 else 0\n', mistake: { tag: 'sign', title: 'Drops negative inputs', explanation: 'A negative number squared is positive.' } },
  ];
  const payload = (learner: string, scope: 'visible' | 'all'): SuitePayload => ({ kind: 'suite', learner, tests, scope, cases, variants, requires: [] });

  it('passes a correct implementation on every owner test', () => {
    const result = runtime.grade(JSON.stringify(payload('def square(x):\n    return x * x\n', 'all')), JSON.stringify(DATASETS));
    expect(result.status, JSON.stringify(result.cases)).toBe('pass');
    expect(result.total).toBe(3);
  });

  it('a Run grades visible tests only and names the wrong variant that matches', () => {
    const result = runtime.grade(JSON.stringify(payload('def square(x):\n    return x + 1\n', 'visible')), JSON.stringify(DATASETS));
    expect(result.cases.map((c) => c.id)).toEqual(['test_squares', 'test_zero']);
    expect(result.status).toBe('fail');
    expect(result.matched.map((m) => m.variantId)).toEqual(['plus-one']);
  });

  it('a Submit fails a hidden case without revealing its input or expected value', () => {
    const result = runtime.grade(JSON.stringify(payload('def square(x):\n    return x * x if x >= 0 else 0\n', 'all')), JSON.stringify(DATASETS));
    expect(result.cases[2]?.ok).toBe(false);
    expect(result.cases[2]?.message).toBe('Did not match on a hidden case.');
    expect(result.matched.map((m) => m.variantId)).toEqual(['no-negatives']);
  });

  it('a hidden case that raises names only the exception type', () => {
    const result = runtime.grade(JSON.stringify(payload('def square(x):\n    raise ValueError(f"no {x}")\n', 'all')), JSON.stringify(DATASETS));
    expect(result.cases[2]?.message).toBe('raised ValueError on a hidden case');
  });

  it('reports a learner implementation that does not run', () => {
    const result = runtime.grade(JSON.stringify(payload('def square(x)\n    return x\n', 'all')), JSON.stringify(DATASETS));
    expect(result.status).toBe('error');
    expect(result.error?.type).toBe('SyntaxError');
  });
});

describe('summaries: NaN and None stay apart when variants are matched', () => {
  it('a learner that returns None does not match a variant that returns NaN', () => {
    const reference = 'def answer():\n    return 1.0\n';
    const variant = { id: 'nan-result', code: 'def answer():\n    return float("nan")\n', mistake: { tag: 'nan', title: 'Returns NaN', explanation: 'NaN is not a value the task asks for.' } };
    const result = runtime.grade(JSON.stringify(functionPayload('def answer():\n    return None\n', reference, { variants: [variant] })), JSON.stringify(DATASETS));
    expect(result.status).toBe('fail');
    expect(result.matched).toEqual([]);
  });
});

describe('notebook sessions', () => {
  it('shares one namespace across cells, captures output, and renders rich values', () => {
    runtime.setDatasets(JSON.stringify({ demo: 'a,b\n1,2\n3,4\n' }));
    runtime.resetSession('nb-1');
    const first = runtime.runCell('nb-1', "df = load_dataset('demo')\nx = 5");
    expect(first.error).toBeNull();
    const second = runtime.runCell('nb-1', 'x * 2');
    expect(second.display).toEqual({ kind: 'text', data: '10' });
    const table = runtime.runCell('nb-1', 'df');
    expect(table.display?.kind).toBe('html');
    expect(table.display?.data).toContain('<table');
    const printed = runtime.runCell('nb-1', "print('hello')");
    expect(printed.stdout).toBe('hello\n');
  });

  it('renders a matplotlib figure as an inline image', () => {
    runtime.resetSession('nb-2');
    const plot = runtime.runCell('nb-2', "import matplotlib.pyplot as plt\nplt.plot([1, 2, 3])\nplt.title('demo')");
    expect(plot.error).toBeNull();
    expect(plot.images).toHaveLength(1);
    expect(plot.images[0]?.startsWith('iVBORw0KGgo')).toBe(true);
  });

  it('reports a cell error with its type', () => {
    runtime.resetSession('nb-3');
    const failed = runtime.runCell('nb-3', 'print(1)\n1 / 0');
    expect(failed.error?.type).toBe('ZeroDivisionError');
    expect(failed.stdout).toBe('1\n');
  });

  it('grades only the definitions in a notebook, ignoring top-level exploration', () => {
    const notebook = "print(missing_name)\nimport numpy as np\n\ndef answer():\n    return int(np.arange(4).sum())\n";
    const payload = functionPayload(notebook, 'def answer():\n    return 6\n', { definitions_only: true });
    const result = runtime.grade(JSON.stringify(payload), JSON.stringify(DATASETS));
    expect(result.status, JSON.stringify(result)).toBe('pass');
  });
});

describe('pandas comparison: integer and float widths', () => {
  const CSV = 'g,v\na,1\nb,2\na,3\n';
  const reference = 'import pandas as pd\n\n\ndef make(df):\n    return df.groupby("g", as_index=False).agg(n=("v", "size"))\n';
  const payload = (learner: string, rules: Record<string, unknown> = {}): GradePayload => ({
    kind: 'pandas',
    entry: 'make',
    learner,
    reference,
    scope: 'all',
    rules,
    cases: [{ id: 'c1', label: 'counts per group', visibility: 'visible', dataset: 'd' }],
    variants: [],
    requires: ['pandas'],
  });
  const datasets = { d: CSV };

  it('accepts 32-bit integer counts where the reference has 64-bit counts', () => {
    const learner = 'import pandas as pd\n\n\ndef make(df):\n    out = df.groupby("g", as_index=False).agg(n=("v", "size"))\n    return out.astype({"n": "int32"})\n';
    const result = runtime.grade(JSON.stringify(payload(learner)), JSON.stringify(datasets));
    expect(result.status, JSON.stringify(result.cases)).toBe('pass');
  });

  it('accepts 32-bit floats where the reference has 64-bit floats', () => {
    const meanReference = 'import pandas as pd\n\n\ndef make(df):\n    return df.groupby("g", as_index=False).agg(mean=("v", "mean"))\n';
    const learner = 'import pandas as pd\n\n\ndef make(df):\n    out = df.groupby("g", as_index=False).agg(mean=("v", "mean"))\n    return out.astype({"mean": "float32"})\n';
    const result = runtime.grade(JSON.stringify({ ...payload(learner), reference: meanReference }), JSON.stringify(datasets));
    expect(result.status, JSON.stringify(result.cases)).toBe('pass');
  });

  it('rejects float counts where the reference has integer counts', () => {
    const learner = 'import pandas as pd\n\n\ndef make(df):\n    out = df.groupby("g", as_index=False).agg(n=("v", "size"))\n    return out.astype({"n": "float64"})\n';
    const result = runtime.grade(JSON.stringify(payload(learner)), JSON.stringify(datasets));
    expect(result.status).toBe('fail');
    expect(result.cases[0]?.message).toContain('should hold integer values');
  });

  it('keeps exact dtypes when a task declares dtype: strict', () => {
    const learner = 'import pandas as pd\n\n\ndef make(df):\n    out = df.groupby("g", as_index=False).agg(n=("v", "size"))\n    return out.astype({"n": "int32"})\n';
    const result = runtime.grade(JSON.stringify(payload(learner, { dtype: 'strict' })), JSON.stringify(datasets));
    expect(result.status).toBe('fail');
  });
});
