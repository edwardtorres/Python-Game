// Page side of the engine spike. The orchestrator opens a fresh browser context
// (empty cache) for each sample and calls one scenario, which returns plain JSON.
const STACK = ['numpy', 'pandas', 'matplotlib', 'scipy', 'scikit-learn'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    sleep(ms).then(() => {
      throw new Error('timed out');
    }),
  ]);

function makeWorker(onEvent = () => {}) {
  const worker = new Worker('/app/worker.mjs', { type: 'module' });
  const pending = new Map();
  let sequence = 0;
  let fatal = null;

  worker.onmessage = (event) => {
    if (event.data.type === 'event') {
      onEvent(event.data);
      return;
    }
    const waiter = pending.get(event.data.id);
    if (!waiter) return;
    pending.delete(event.data.id);
    if (event.data.ok) waiter.resolve(event.data.data);
    else waiter.reject(new Error(event.data.error));
  };
  worker.onerror = (event) => {
    fatal = event.message || 'worker error';
    for (const waiter of pending.values()) waiter.reject(new Error(fatal));
    pending.clear();
  };

  return {
    call(op, args = {}) {
      if (fatal) return Promise.reject(new Error(fatal));
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ id, op, ...args });
      });
    },
    terminate() {
      worker.terminate();
      for (const waiter of pending.values()) waiter.reject(new Error('terminated'));
      pending.clear();
    },
  };
}

async function env() {
  return {
    crossOriginIsolated: self.crossOriginIsolated === true,
    sharedArrayBuffer: typeof SharedArrayBuffer === 'function',
    userAgent: navigator.userAgent,
  };
}

async function coldStart() {
  const started = performance.now();
  const w = makeWorker();
  const init = await w.call('init');
  const check = await w.call('run', { code: '1 + 1' });
  const totalMs = performance.now() - started;
  w.terminate();
  return { totalMs, coreInitMs: init.ms, coreBytes: init.bytes, coreFiles: init.files, firstValue: check.value, ...(await env()) };
}

async function packageAlone({ name }) {
  const w = makeWorker();
  await w.call('init');
  const result = await w.call('loadPackages', { names: [name] });
  w.terminate();
  return result;
}

async function stackLoad() {
  const w = makeWorker();
  const init = await w.call('init');
  const stack = await w.call('loadPackages', { names: STACK });
  const memory = await w.call('memory');
  const usedJsHeapBytes = performance.memory ? performance.memory.usedJSHeapSize : null;
  let uaSpecificBytes = null;
  let uaSpecificError = null;
  if (self.crossOriginIsolated && typeof performance.measureUserAgentSpecificMemory === 'function') {
    try {
      uaSpecificBytes = (await performance.measureUserAgentSpecificMemory()).bytes;
    } catch (error) {
      uaSpecificError = error.name;
    }
  }
  w.terminate();
  return {
    coreInitMs: init.ms,
    coreBytes: init.bytes,
    stackMs: stack.ms,
    stackBytes: stack.bytes,
    stackFiles: stack.files,
    loaded: stack.loaded,
    wasmMemoryBytes: memory.wasmMemoryBytes,
    usedJsHeapBytes,
    uaSpecificBytes,
    uaSpecificError,
    ...(await env()),
  };
}

async function functional() {
  const w = makeWorker();
  await w.call('init');
  await w.call('loadPackages', { names: STACK });
  const checks = await w.call('functional');
  const memory = await w.call('memory');
  w.terminate();
  return { checks, wasmMemoryAfterChecksBytes: memory.wasmMemoryBytes, ...(await env()) };
}

// seaborn is not in the Pyodide 314.0.7 lock file, so it is vendored as a pure
// Python wheel and loaded by URL. A URL install does not resolve dependencies,
// so pandas and matplotlib (and numpy with them) are loaded first.
async function seabornProbe() {
  const w = makeWorker();
  await w.call('init');
  const deps = await w.call('loadPackages', { names: ['pandas', 'matplotlib'] });
  const wheel = await w.call('loadPackages', { names: [`${location.origin}/pyodide/seaborn-0.13.2-py3-none-any.whl`] });
  const check = await w.call('seabornCheck');
  w.terminate();
  return {
    ms: deps.ms + wheel.ms,
    bytes: deps.bytes + wheel.bytes,
    files: deps.files + wheel.files,
    loaded: [...deps.loaded, ...wheel.loaded],
    check: check.value,
    expected: check.expected,
    ...(await env()),
  };
}

async function isolation() {
  const w = makeWorker();
  await w.call('init');
  await w.call('loadPackages', { names: ['numpy', 'matplotlib'] });
  const result = await w.call('isolation');
  w.terminate();
  return result;
}

// Same policy as the worker: a minimal empty module, compiled on the page.
async function pageWasmCompile() {
  try {
    await WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
    return 'compiled';
  } catch (error) {
    return `${error.name}: ${String(error.message).slice(0, 200)}`;
  }
}

async function cspProbe() {
  const started = performance.now();
  const w = makeWorker();
  const pageWasm = await pageWasmCompile();
  try {
    const init = await withTimeout(w.call('init'), 60000);
    const check = await withTimeout(w.call('run', { code: '1 + 1' }), 60000);
    return { ok: true, value: check.value, coreInitMs: init.ms, ms: performance.now() - started, pageWasm, ...(await env()) };
  } catch (error) {
    return { ok: false, error: String(error.message ?? error).slice(0, 300), ms: performance.now() - started, pageWasm, ...(await env()) };
  } finally {
    w.terminate();
  }
}

async function interruptSharedBuffer() {
  const w = makeWorker();
  await w.call('init');
  const shared = new SharedArrayBuffer(4);
  const flag = new Int32Array(shared);
  await w.call('setInterrupt', { buffer: shared });
  const samples = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    Atomics.store(flag, 0, 0);
    const loop = w.call('runLoop');
    await sleep(300);
    const interruptAt = performance.now();
    Atomics.store(flag, 0, 2);
    const reply = await loop;
    const replyAt = performance.now();
    const bufferAfter = Atomics.load(flag, 0);
    const next = await w.call('run', { code: '1 + 1' });
    const recoveredAt = performance.now();
    samples.push({
      interrupted: reply.interrupted,
      message: reply.message,
      interruptLatencyMs: replyAt - interruptAt,
      recoveryMs: recoveredAt - replyAt,
      bufferAfter,
      nextValue: next.value,
    });
  }
  w.terminate();
  return { samples, ...(await env()) };
}

async function interruptRestart({ withStack }) {
  const first = makeWorker();
  await first.call('init');
  if (withStack) await first.call('loadPackages', { names: STACK });
  const loop = first.call('runLoop').catch((error) => ({ killed: true, error: error.message }));
  await sleep(300);
  const terminatedAt = performance.now();
  first.terminate();
  await loop;
  const second = makeWorker();
  await second.call('init');
  if (withStack) await second.call('loadPackages', { names: STACK });
  const check = await second.call('run', { code: '1 + 1' });
  const readyAt = performance.now();
  second.terminate();
  return { withStack, restartToFirstResultMs: readyAt - terminatedAt, nextValue: check.value };
}

// Diagnoses the buffer interrupt stage by stage, so a hang can be classified.
// Stages: init, loop started (worker), signal consumed (Pyodide resets the buffer
// to 0 once it raises), and reply received. The first stage that does not
// happen names the failure. A stuck worker is terminated and not reused.
async function interruptDiagnosis({ attempts }) {
  const events = [];
  const worker = makeWorker((event) => events.push({ name: event.name, at: performance.now() }));
  const shared = new SharedArrayBuffer(4);
  const flag = new Int32Array(shared);
  const records = [];
  const waitFor = async (predicate, ms) => {
    const deadline = performance.now() + ms;
    while (performance.now() < deadline) {
      if (predicate()) return true;
      await sleep(25);
    }
    return predicate();
  };
  try {
    const initStarted = performance.now();
    await withTimeout(worker.call('init'), 30000);
    const initMs = performance.now() - initStarted;
    const ack = await withTimeout(worker.call('setInterrupt', { buffer: shared }), 10000);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const eventsBefore = events.length;
      Atomics.store(flag, 0, 0);
      const loop = worker.call('runLoop').then(
        (reply) => ({ replied: true, reply }),
        (error) => ({ replied: false, error: error.message }),
      );
      const started = await waitFor(() => events.slice(eventsBefore).some((e) => e.name === 'loopStarted'), 3000);
      await sleep(300);
      const sabValueBeforeSignal = Atomics.load(flag, 0);
      const signalAt = performance.now();
      Atomics.store(flag, 0, 2);
      const consumed = await waitFor(() => Atomics.load(flag, 0) === 0, 3000);
      const consumedMs = consumed ? performance.now() - signalAt : null;
      const outcome = await Promise.race([loop, sleep(4000).then(() => null)]);
      let classification = 'ok';
      if (!started) classification = 'loop-not-started';
      else if (!consumed) classification = 'signal-not-consumed';
      else if (!outcome) classification = 'reply-lost';
      else if (!outcome.replied || !outcome.reply.interrupted) classification = 'unexpected-reply';
      records.push({
        attempt,
        classification,
        started,
        consumed,
        consumedMs,
        replied: outcome ? outcome.replied : false,
        message: outcome && outcome.replied ? outcome.reply.message : null,
        sabValueBeforeSignal,
      });
      if (classification !== 'ok') break;
    }
    return { initMs, ack, records, ...(await env()) };
  } catch (error) {
    return { error: String(error.message ?? error).slice(0, 300), records, ...(await env()) };
  } finally {
    worker.terminate();
  }
}

window.spike = {
  env,
  coldStart,
  packageAlone,
  stackLoad,
  functional,
  seabornProbe,
  isolation,
  cspProbe,
  interruptSharedBuffer,
  interruptRestart,
  interruptDiagnosis,
};
window.spikeReady = true;
