import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PythonEngine, type EngineOptions, type EngineStatus, type WorkerLike } from './client';
import { DEFAULT_RECYCLE_POLICY, recycleReason } from './recycle';
import { EngineError } from './errors';
import type { GradePayload, WorkerRequest, WorkerResponse } from './types';

interface Behaviour {
  init?: 'ok' | 'never';
  packages?: 'ok' | 'never';
  grade?: 'finish' | 'hang' | 'interruptible';
  interruptDelayMs?: number;
  memoryBytes?: number;
}

// A stand-in for the Python worker. Its "interruptible" grade behaves like Python:
// it polls the shared buffer and answers with KeyboardInterrupt once the buffer is 2.
class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;
  private buffer: Int32Array | null = null;
  private ignoreInterrupt = false;
  private poll: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly behaviour: Behaviour) {}

  postMessage(request: WorkerRequest): void {
    if (this.terminated) return;
    const reply = (data: unknown) => setTimeout(() => this.emit({ id: request.id, ok: true, data }), 0);
    switch (request.op) {
      case 'init':
        if (this.behaviour.init !== 'never') reply({ ready: true });
        return;
      case 'setInterrupt':
        this.buffer = new Int32Array(request.buffer);
        this.ignoreInterrupt = request.ignore;
        reply({ sabValue: 0 });
        return;
      case 'loadPackages':
        if (this.behaviour.packages !== 'never') reply({ loaded: request.names });
        return;
      case 'memory':
        reply({ wasmMemoryBytes: this.behaviour.memoryBytes ?? 1000 });
        return;
      case 'grade':
        this.grade(request.id);
        return;
      default:
        reply({ ok: true });
    }
  }

  private grade(id: number): void {
    const mode = this.behaviour.grade ?? 'finish';
    if (mode === 'finish') {
      setTimeout(() => this.emit({ id, ok: true, data: { status: 'pass', error: null, cases: [], passed: 0, total: 0, matched: [] } }), 5);
      return;
    }
    if (mode === 'hang') return;
    this.poll = setInterval(() => {
      if (!this.ignoreInterrupt && this.buffer !== null && Atomics.load(this.buffer, 0) === 2) {
        if (this.poll !== null) clearInterval(this.poll);
        this.poll = null;
        setTimeout(() => this.emit({ id, ok: false, error: { type: 'KeyboardInterrupt', message: 'KeyboardInterrupt', line: null } }), this.behaviour.interruptDelayMs ?? 0);
      }
    }, 10);
  }

  private emit(message: WorkerResponse | { id: number; ok: boolean; data?: unknown; error?: unknown }): void {
    if (!this.terminated) this.onmessage?.({ data: message } as MessageEvent<WorkerResponse>);
  }

  terminate(): void {
    this.terminated = true;
    if (this.poll !== null) clearInterval(this.poll);
  }
}

const PAYLOAD: GradePayload = {
  kind: 'function',
  entry: 'answer',
  learner: 'def answer():\n    return 1\n',
  reference: 'def answer():\n    return 1\n',
  scope: 'all',
  rules: {},
  cases: [],
  variants: [],
  requires: [],
};

function makeEngine(behaviours: Behaviour[], options: Partial<EngineOptions> = {}) {
  const workers: FakeWorker[] = [];
  const statuses: EngineStatus[] = [];
  const engine = new PythonEngine({
    createWorker: () => {
      const behaviour = behaviours[workers.length] ?? behaviours[behaviours.length - 1] ?? {};
      const worker = new FakeWorker(behaviour);
      workers.push(worker);
      return worker;
    },
    precheck: () => Promise.resolve(),
    loadTimeoutMs: 1000,
    packageTimeoutMs: 1000,
    interruptGraceMs: 2000,
    onStatus: (status) => statuses.push(status),
    ...options,
  });
  return { engine, workers, statuses };
}

function settle<T>(promise: Promise<T>): Promise<{ value?: T; error?: unknown; done: boolean }> {
  const holder: { value?: T; error?: unknown; done: boolean } = { done: false };
  promise.then(
    (value) => Object.assign(holder, { value, done: true }),
    (error: unknown) => Object.assign(holder, { error, done: true }),
  );
  return Promise.resolve(holder);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('start-up', () => {
  it('fails with a clear load timeout when the engine never starts, and stops the worker', async () => {
    const { engine, workers } = makeEngine([{ init: 'never' }]);
    const result = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(1100);
    expect(result.done).toBe(true);
    expect(result.error).toMatchObject({ kind: 'load-timeout' });
    expect((result.error as Error).message).toContain('did not start within 1 seconds');
    expect(workers[0]?.terminated).toBe(true);
  });

  it('fails with a package timeout when a package never loads', async () => {
    const { engine, workers } = makeEngine([{ packages: 'never' }]);
    const result = await settle(engine.grade({ ...PAYLOAD, requires: ['pandas'] }, {}));
    await vi.advanceTimersByTimeAsync(1100);
    expect(result.error).toMatchObject({ kind: 'package-timeout' });
    expect(workers[0]?.terminated).toBe(true);
  });

  it('blocks start-up with a CSP error before any worker is created', async () => {
    const { engine, workers } = makeEngine([{}], {
      precheck: () => Promise.reject(new EngineError('csp-blocked', "This page's security policy blocks WebAssembly.")),
    });
    const result = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(10);
    expect(result.error).toMatchObject({ kind: 'csp-blocked' });
    expect(workers).toHaveLength(0);
    expect(engine.getStatus()).toBe('error');
  });

  it('reports a crash of the worker as a worker-crashed error', async () => {
    const { engine, workers } = makeEngine([{ grade: 'hang' }]);
    const result = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(50);
    workers[0]?.onerror?.({} as ErrorEvent);
    await vi.advanceTimersByTimeAsync(10);
    expect(result.error).toMatchObject({ kind: 'worker-crashed' });
  });
});

describe('stopping a run: buffer first, restart after the grace period', () => {
  it('uses the buffer when the worker confirms within the grace period', async () => {
    const { engine, workers } = makeEngine([{ grade: 'interruptible', interruptDelayMs: 0 }]);
    const result = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(100);
    engine.cancel();
    await vi.advanceTimersByTimeAsync(200);
    expect(result.value).toEqual({ kind: 'interrupted', method: 'buffer' });
    expect(engine.getStats().restarts.interrupt).toBe(0);
    expect(workers).toHaveLength(1);
    expect(workers[0]?.terminated).toBe(false);
  });

  it('restarts the worker when the buffer is ignored (forced failure path)', async () => {
    const { engine, workers } = makeEngine([{ grade: 'interruptible' }, { grade: 'finish' }], { ignoreInterruptSignal: true });
    const result = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(100);
    engine.cancel();
    await vi.advanceTimersByTimeAsync(1900);
    expect(result.done).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(result.value).toEqual({ kind: 'interrupted', method: 'restart' });
    expect(engine.getStats().restarts.interrupt).toBe(1);
    expect(workers[0]?.terminated).toBe(true);

    const next = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(300);
    expect(next.value).toMatchObject({ kind: 'graded' });
    expect(workers).toHaveLength(2);
  });

  it('honours a stop requested while the engine is still starting', async () => {
    const { engine, workers } = makeEngine([{ grade: 'interruptible' }]);
    const result = settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(1);
    engine.cancel();
    await vi.advanceTimersByTimeAsync(300);
    expect((await result).value).toEqual({ kind: 'interrupted', method: 'buffer' });
    expect(workers[0]?.terminated).toBe(false);
  });

  it('treats a confirmation at 1.5 s as a buffer stop (inside the 2 s grace)', async () => {
    const { engine } = makeEngine([{ grade: 'interruptible', interruptDelayMs: 1500 }]);
    const result = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(100);
    engine.cancel();
    await vi.advanceTimersByTimeAsync(1700);
    expect(result.value).toEqual({ kind: 'interrupted', method: 'buffer' });
  });

  it('treats a confirmation at 2.6 s as too late, so the worker restarts', async () => {
    const { engine } = makeEngine([{ grade: 'interruptible', interruptDelayMs: 2600 }, { grade: 'finish' }]);
    const result = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(100);
    engine.cancel();
    await vi.advanceTimersByTimeAsync(2300);
    expect(result.value).toEqual({ kind: 'interrupted', method: 'restart' });
  });
});

describe('worker recycling (only while idle)', () => {
  it('restarts the worker after a run when WebAssembly memory is over the threshold', async () => {
    const big = 300 * 1024 * 1024;
    const { engine, workers } = makeEngine([{ grade: 'finish', memoryBytes: big }, { grade: 'finish', memoryBytes: 1000 }]);
    await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(50);
    expect(engine.getStats().restarts.memory).toBe(1);
    const next = await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(300);
    expect(next.value).toMatchObject({ kind: 'graded' });
    expect(workers).toHaveLength(2);
  });

  it('restarts after the heavy-run limit, counting only runs that load packages', async () => {
    const { engine } = makeEngine([{ grade: 'finish' }, { grade: 'finish' }], { recyclePolicy: { maxWasmBytes: DEFAULT_RECYCLE_POLICY.maxWasmBytes, maxHeavyRuns: 2 } });
    const heavy = { ...PAYLOAD, requires: ['pandas'] };
    for (let index = 0; index < 2; index += 1) {
      await settle(engine.grade(heavy, {}));
      await vi.advanceTimersByTimeAsync(300);
    }
    expect(engine.getStats().restarts['heavy-runs']).toBe(1);
  });

  it('does not count light function runs toward the heavy-run limit', async () => {
    const { engine } = makeEngine([{ grade: 'finish' }], { recyclePolicy: { maxWasmBytes: DEFAULT_RECYCLE_POLICY.maxWasmBytes, maxHeavyRuns: 1 } });
    for (let index = 0; index < 3; index += 1) {
      await settle(engine.grade(PAYLOAD, {}));
      await vi.advanceTimersByTimeAsync(300);
    }
    expect(engine.getStats().restarts['heavy-runs']).toBe(0);
  });

  it('reports status changes through the status callback', async () => {
    const { engine, statuses } = makeEngine([{ grade: 'finish' }]);
    await settle(engine.grade(PAYLOAD, {}));
    await vi.advanceTimersByTimeAsync(300);
    expect(statuses).toContain('starting');
    expect(statuses).toContain('running');
    expect(engine.getStatus()).toBe('ready');
  });
});

describe('recycleReason (pure policy)', () => {
  const policy = { maxWasmBytes: 100, maxHeavyRuns: 5 };

  it('returns nothing while work is queued', () => {
    expect(recycleReason({ wasmBytes: 500, heavyRuns: 9, queued: 1 }, policy)).toBeNull();
  });

  it('returns memory when WebAssembly memory is over the threshold', () => {
    expect(recycleReason({ wasmBytes: 101, heavyRuns: 0, queued: 0 }, policy)).toBe('memory');
  });

  it('returns heavy-runs when the heavy-run limit is reached', () => {
    expect(recycleReason({ wasmBytes: 10, heavyRuns: 5, queued: 0 }, policy)).toBe('heavy-runs');
  });

  it('returns nothing when both values are under their limits', () => {
    expect(recycleReason({ wasmBytes: 100, heavyRuns: 4, queued: 0 }, policy)).toBeNull();
  });
});
