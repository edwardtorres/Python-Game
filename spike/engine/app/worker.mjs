// Pyodide worker for the engine spike. All Python runs here, so a runaway
// script can stall this worker without freezing the page.
import { loadPyodide } from '/pyodide/pyodide.mjs';

const SHIPMENT_TOTAL = 25;
const shipmentWeight = (index) => ((index * 37) % 100) + 1;
const EXPECTED_WEIGHT_SUM = String(
  Array.from({ length: SHIPMENT_TOTAL }, (_, index) => shipmentWeight(index)).reduce((sum, weight) => sum + weight, 0),
);
const SQUARES_N = 100000n;
const EXPECTED_SUM_OF_SQUARES = String(((SQUARES_N - 1n) * SQUARES_N * (2n * SQUARES_N - 1n)) / 6n);
const EXPECTED_MOCK_LOG = [
  '/api/shipments?page=1&per_page=10',
  '/api/shipments?page=2&per_page=10',
  '/api/shipments?page=3&per_page=10',
  '/api/limited',
  '/api/limited',
];

const FUNCTIONAL_CHECKS = [
  {
    name: 'pure_python',
    code: String.raw`
total = sum(i * i for i in range(100000))
str(total)`,
    expected: EXPECTED_SUM_OF_SQUARES,
  },
  {
    name: 'pandas_groupby',
    code: String.raw`
import pandas as pd
df = pd.DataFrame({"g": ["a", "b", "a"], "v": [1, 2, 3]})
",".join(f"{key}={int(value)}" for key, value in df.groupby("g")["v"].sum().items())`,
    expected: 'a=4,b=2',
  },
  {
    name: 'matplotlib_agg_png',
    code: String.raw`
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
fig, ax = plt.subplots()
ax.bar(["a", "b"], [4, 2])
ax.set_title("t")
buf = io.BytesIO()
fig.savefig(buf, format="png")
plt.close(fig)
png = buf.getvalue()
is_png = png[:8] == b"\x89PNG\r\n\x1a\n"
f"{is_png}|{len(png) > 1000}"`,
    expected: 'True|True',
  },
  {
    name: 'sklearn_linear_fit',
    code: String.raw`
import numpy as np
from sklearn.linear_model import LinearRegression
X = np.arange(10, dtype=float).reshape(-1, 1)
y = 2.0 * X.ravel() + 1.0
model = LinearRegression().fit(X, y)
f"{model.coef_[0]:.6f}|{model.intercept_:.6f}"`,
    expected: '2.000000|1.000000',
  },
  {
    name: 'mock_api_pagination',
    code: String.raw`
import json
statuses = []
items = []
page = 1
while page is not None:
    r = json.loads(mock_get(f"/api/shipments?page={page}&per_page=10"))
    statuses.append(str(r["status"]))
    items.extend(r["body"]["items"])
    page = r["body"]["next_page"]
f"{','.join(statuses)}|{len(items)}|{sum(i['weight_kg'] for i in items)}"`,
    expected: `200,200,200|25|${EXPECTED_WEIGHT_SUM}`,
  },
  {
    name: 'mock_api_retry_after',
    code: String.raw`
import json
first = json.loads(mock_get("/api/limited"))
second = json.loads(mock_get("/api/limited"))
f"{first['status']}|{first['retry_after']}|{second['status']}"`,
    expected: '429|2|200',
  },
];

const RESET_CODE = String.raw`
import json
import shutil
import sys
closed = 0
if "matplotlib.pyplot" in sys.modules:
    import matplotlib.pyplot as plt
    closed = len(plt.get_fignums())
    plt.close("all")
removed = []
for name, module in list(sys.modules.items()):
    origin = getattr(module, "__file__", None) or ""
    if origin.startswith("/home/pyodide/"):
        del sys.modules[name]
        removed.append(name)
sys.path[:] = [p for p in sys.path if not p.startswith("/home/pyodide/work")]
shutil.rmtree("/home/pyodide/work", ignore_errors=True)
json.dumps({"figures_closed": closed, "modules_removed": sorted(removed)})`;

const ISOLATION_RUN_A = String.raw`
import json
import os
import sys
os.makedirs("/home/pyodide/work", exist_ok=True)
with open("/home/pyodide/work/data.txt", "w") as handle:
    handle.write("hello")
with open("/home/pyodide/work/leaky_mod.py", "w") as handle:
    handle.write("VALUE = 7\n")
sys.path.insert(0, "/home/pyodide/work")
import leaky_mod
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
plt.figure()
np.random.seed(1)
draw_a = float(np.random.rand())
x = 42
json.dumps({"module_value": leaky_mod.VALUE, "draw_a": draw_a})`;

const ISOLATION_RUN_B = String.raw`
import json
import os
import sys
import numpy as np
import matplotlib.pyplot as plt
no_reseed = float(np.random.rand())
np.random.seed(1)
seeded = float(np.random.rand())
json.dumps({
    "x_visible": "x" in globals(),
    "file_exists": os.path.exists("/home/pyodide/work/data.txt"),
    "module_cached": "leaky_mod" in sys.modules,
    "figures_open": len(plt.get_fignums()),
    "rng_leaked": no_reseed != seeded,
})`;

const ISOLATION_RUN_C = String.raw`
import json
import os
import sys
import matplotlib.pyplot as plt
json.dumps({
    "x_visible": "x" in globals(),
    "file_exists": os.path.exists("/home/pyodide/work/data.txt"),
    "module_cached": "leaky_mod" in sys.modules,
    "figures_open": len(plt.get_fignums()),
    "sys_path_clean": not any(p.startswith("/home/pyodide/work") for p in sys.path),
})`;

const SEABORN_CODE = String.raw`
import io
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
df = pd.DataFrame({"x": [1, 2, 3], "y": [2, 4, 6]})
sns.scatterplot(data=df, x="x", y="y")
buf = io.BytesIO()
plt.gcf().savefig(buf, format="png")
plt.close("all")
png = buf.getvalue()
is_png = png[:8] == b"\x89PNG\r\n\x1a\n"
f"{sns.__version__}|{is_png}|{len(png) > 1000}"`;

let pyodide = null;
const mockCalls = [];
const mockCounters = new Map();

// Simulated HTTP API. Deterministic JSON, pagination, one 429 with Retry-After,
// and a call log the grader can inspect.
function mockGet(url) {
  const target = new URL(url, 'https://mock.invalid');
  mockCalls.push(`${target.pathname}${target.search}`);
  if (target.pathname === '/api/shipments') {
    const page = Number(target.searchParams.get('page') ?? '1');
    const perPage = Number(target.searchParams.get('per_page') ?? '10');
    const start = (page - 1) * perPage;
    const items = [];
    for (let index = start; index < Math.min(SHIPMENT_TOTAL, start + perPage); index += 1) {
      items.push({ id: index + 1, weight_kg: shipmentWeight(index) });
    }
    const nextPage = start + perPage < SHIPMENT_TOTAL ? page + 1 : null;
    return JSON.stringify({ status: 200, retry_after: null, body: { items, next_page: nextPage } });
  }
  if (target.pathname === '/api/limited') {
    const count = (mockCounters.get('limited') ?? 0) + 1;
    mockCounters.set('limited', count);
    if (count === 1) return JSON.stringify({ status: 429, retry_after: 2, body: null });
    return JSON.stringify({ status: 200, retry_after: null, body: { ok: true } });
  }
  return JSON.stringify({ status: 404, retry_after: null, body: null });
}

// Keeps the first and last lines of a message so a Python traceback and a
// JavaScript loader error are both readable in the results.
function summarize(message) {
  const lines = String(message ?? '').trim().split('\n').filter(Boolean);
  if (lines.length <= 1) return (lines[0] ?? '').slice(0, 300);
  return `${lines[0]} ... ${lines[lines.length - 1]}`.slice(0, 300);
}

function pyodideTransfer(since) {
  const entries = performance
    .getEntriesByType('resource')
    .filter((entry) => entry.startTime >= since && entry.name.includes('/pyodide/'));
  return { bytes: entries.reduce((sum, entry) => sum + entry.encodedBodySize, 0), files: entries.length };
}

function toPlain(value) {
  if (value !== null && typeof value === 'object' && 'toJs' in value) {
    const plain = value.toJs({ dict_converter: Object.fromEntries });
    value.destroy();
    return plain;
  }
  return value;
}

// Every run gets its own globals dict. The mock API is injected into that dict,
// not into the shared builtins module, so no run can see another run's names.
async function runInFreshNamespace(code) {
  const namespace = pyodide.globals.get('dict')();
  try {
    namespace.set('mock_get', mockGet);
    return toPlain(await pyodide.runPythonAsync(code, { globals: namespace }));
  } finally {
    namespace.destroy();
  }
}

const handlers = {
  async init() {
    if (pyodide !== null) return { ms: 0, bytes: 0, files: 0 };
    const started = performance.now();
    pyodide = await loadPyodide({ indexURL: '/pyodide/', stdout: () => {}, stderr: () => {} });
    return { ms: performance.now() - started, ...pyodideTransfer(0) };
  },

  async loadPackages({ names }) {
    const before = Object.keys(pyodide.loadedPackages);
    const started = performance.now();
    await pyodide.loadPackage(names, { messageCallback: () => {} });
    const ms = performance.now() - started;
    const loaded = Object.keys(pyodide.loadedPackages)
      .filter((name) => !before.includes(name))
      .sort();
    return { ms, ...pyodideTransfer(started), loaded };
  },

  memory() {
    return { wasmMemoryBytes: pyodide._module.HEAPU8.buffer.byteLength };
  },

  async seabornCheck() {
    return { value: await runInFreshNamespace(SEABORN_CODE), expected: '0.13.2|True|True' };
  },

  async run({ code }) {
    return { value: await runInFreshNamespace(code) };
  },

  setInterrupt({ buffer }) {
    const view = new Int32Array(buffer);
    pyodide.setInterruptBuffer(view);
    return { sabValue: Atomics.load(view, 0), isShared: buffer instanceof SharedArrayBuffer };
  },

  runLoop() {
    try {
      self.postMessage({ type: 'event', name: 'loopStarted' });
      pyodide.runPython('while True:\n    pass');
      return { interrupted: false, message: '' };
    } catch (error) {
      return { interrupted: true, message: String(error.message).trim().split('\n').pop().slice(0, 120) };
    }
  },

  async functional() {
    mockCalls.length = 0;
    const checks = [];
    for (const check of FUNCTIONAL_CHECKS) {
      const started = performance.now();
      let got = null;
      let error = null;
      try {
        got = await runInFreshNamespace(check.code);
      } catch (caught) {
        error = summarize(caught.message);
      }
      checks.push({ name: check.name, pass: got === check.expected, expected: check.expected, got, error, ms: performance.now() - started });
    }
    checks.push({
      name: 'mock_api_call_log',
      pass: JSON.stringify(mockCalls) === JSON.stringify(EXPECTED_MOCK_LOG),
      expected: EXPECTED_MOCK_LOG,
      got: [...mockCalls],
      error: null,
      ms: 0,
    });
    return checks;
  },

  async isolation() {
    const a = await runInFreshNamespace(ISOLATION_RUN_A);
    const b = JSON.parse(await runInFreshNamespace(ISOLATION_RUN_B));
    const reset = JSON.parse(await runInFreshNamespace(RESET_CODE));
    const c = JSON.parse(await runInFreshNamespace(ISOLATION_RUN_C));
    return {
      runA: JSON.parse(a),
      runBBeforeReset: b,
      reset,
      runCAfterReset: c,
      checks: [
        { name: 'fresh_namespace_hides_variables', pass: b.x_visible === false },
        { name: 'vfs_file_visible_before_reset', pass: b.file_exists === true },
        { name: 'vfs_file_removed_by_reset', pass: c.file_exists === false },
        { name: 'user_module_cached_before_reset', pass: b.module_cached === true },
        { name: 'user_module_uncached_by_reset', pass: c.module_cached === false },
        { name: 'figures_open_before_reset', pass: b.figures_open >= 1 },
        { name: 'figures_closed_by_reset', pass: c.figures_open === 0 },
        { name: 'sys_path_cleaned_by_reset', pass: c.sys_path_clean === true },
        { name: 'numpy_rng_state_persists_across_runs', pass: b.rng_leaked === true },
      ],
    };
  },
};

self.onmessage = async (event) => {
  const { id, op, ...args } = event.data;
  try {
    const data = await handlers[op](args);
    self.postMessage({ id, ok: true, data });
  } catch (error) {
    self.postMessage({ id, ok: false, error: summarize(error?.message ?? error) });
  }
};
