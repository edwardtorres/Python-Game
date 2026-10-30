// Main-thread controller for the Python engine.
//
// Stopping a run is hybrid. First the controller raises the interrupt buffer, which
// makes Python raise KeyboardInterrupt inside the worker. If the worker does not
// confirm that within interruptGraceMs, the controller terminates the worker and
// starts a new one (a cold start). Start-up and package loads have their own timeouts.
// Only one job runs at a time, and the worker is recycled only while idle.
import type { CellResult, GradePayload, GradeResult, WorkerRequest, WorkerResponse } from './types';
import { EngineError, type EngineErrorKind, InterruptedRestart, PythonRunError, isKeyboardInterrupt } from './errors';
import { DEFAULT_RECYCLE_POLICY, type RecyclePolicy, recycleReason } from './recycle';

export type EngineStatus = 'idle' | 'starting' | 'ready' | 'running' | 'error';
export type InterruptMethod = 'buffer' | 'restart';
export type RestartReason = 'interrupt' | 'memory' | 'heavy-runs' | 'load' | 'package' | 'crash';

export interface WorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: WorkerRequest): void;
  terminate(): void;
}

export interface EngineOptions {
  createWorker: () => WorkerLike;
  precheck: () => Promise<void>;
  loadTimeoutMs?: number;
  packageTimeoutMs?: number;
  interruptGraceMs?: number;
  recyclePolicy?: RecyclePolicy;
  ignoreInterruptSignal?: boolean;
  onStatus?: (status: EngineStatus) => void;
}

export type GradeOutcome = { kind: 'graded'; result: GradeResult } | { kind: 'interrupted'; method: InterruptMethod };
export type CellOutcome = { kind: 'cell'; result: CellResult } | { kind: 'interrupted'; method: InterruptMethod };

export interface EngineStats {
  workerStarts: number;
  restarts: Record<RestartReason, number>;
  lastWasmBytes: number;
}

interface Job {
  interruptRequested: boolean;
  running: boolean;
  graceTimer: ReturnType<typeof setTimeout> | null;
}

type Pending = { resolve: (data: unknown) => void; reject: (error: Error) => void };

type Request = WorkerRequest extends infer R ? (R extends { id: number } ? Omit<R, 'id'> : never) : never;

const DEFAULTS = {
  loadTimeoutMs: 30_000,
  packageTimeoutMs: 60_000,
  interruptGraceMs: 2_000,
};

function emptyRestarts(): Record<RestartReason, number> {
  return { interrupt: 0, memory: 0, 'heavy-runs': 0, load: 0, package: 0, crash: 0 };
}

export class PythonEngine {
  private readonly options: Required<Pick<EngineOptions, 'loadTimeoutMs' | 'packageTimeoutMs' | 'interruptGraceMs'>> & EngineOptions;
  private worker: WorkerLike | null = null;
  private buffer: Int32Array | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private readonly loadedPackages = new Set<string>();
  private heavyRuns = 0;
  private queued = 0;
  private queue: Promise<void> = Promise.resolve();
  private active: Job | null = null;
  private status: EngineStatus = 'idle';
  private startFailed = false;
  private readonly stats: EngineStats = { workerStarts: 0, restarts: emptyRestarts(), lastWasmBytes: 0 };

  constructor(options: EngineOptions) {
    this.options = {
      ...options,
      loadTimeoutMs: options.loadTimeoutMs ?? DEFAULTS.loadTimeoutMs,
      packageTimeoutMs: options.packageTimeoutMs ?? DEFAULTS.packageTimeoutMs,
      interruptGraceMs: options.interruptGraceMs ?? DEFAULTS.interruptGraceMs,
    };
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getStats(): EngineStats {
    return { ...this.stats, restarts: { ...this.stats.restarts } };
  }

  grade(payload: GradePayload, datasets: Record<string, string>): Promise<GradeOutcome> {
    const requires = payload.requires;
    return this.runJob(requires, async (job) => {
      if (job.interruptRequested) return { kind: 'interrupted', method: 'buffer' };
      try {
        const result = await this.call<GradeResult>({
          op: 'grade',
          payloadJson: JSON.stringify(payload),
          datasetsJson: JSON.stringify(datasets),
        });
        return { kind: 'graded', result };
      } catch (error) {
        return this.asInterrupted(job, error, (interrupted) => ({ kind: 'interrupted', method: interrupted }));
      }
    });
  }

  runCell(sessionId: string, code: string, requires: string[]): Promise<CellOutcome> {
    return this.runJob(requires, async (job) => {
      if (job.interruptRequested) return { kind: 'interrupted', method: 'buffer' };
      try {
        const result = await this.call<CellResult>({ op: 'runCell', sessionId, code });
        return { kind: 'cell', result };
      } catch (error) {
        return this.asInterrupted(job, error, (interrupted) => ({ kind: 'interrupted', method: interrupted }));
      }
    });
  }

  setDatasets(datasets: Record<string, string>): Promise<void> {
    return this.runJob([], async () => {
      await this.call({ op: 'setDatasets', datasetsJson: JSON.stringify(datasets) });
    });
  }

  resetSession(sessionId: string): Promise<void> {
    return this.runJob([], async () => {
      if (this.worker === null) return;
      await this.call({ op: 'resetSession', sessionId });
    });
  }

  // Asks the running job to stop. Buffer first; restart after the grace period.
  // A stop during start-up is recorded and honoured before the run begins.
  cancel(): void {
    const job = this.active;
    if (job === null || job.interruptRequested) return;
    job.interruptRequested = true;
    if (!job.running || this.worker === null || this.buffer === null) return;
    Atomics.store(this.buffer, 0, 2);
    job.graceTimer = setTimeout(() => {
      this.stats.restarts.interrupt += 1;
      this.killWorker('interrupt');
    }, this.options.interruptGraceMs);
  }

  dispose(): void {
    this.killWorker('crash');
    this.setStatus('idle');
  }

  private asInterrupted<T>(job: Job, error: unknown, wrap: (method: InterruptMethod) => T): T {
    if (job.interruptRequested && isKeyboardInterrupt(error)) return wrap('buffer');
    if (error instanceof InterruptedRestart) return wrap('restart');
    throw error;
  }

  private runJob<T>(requires: string[], task: (job: Job) => Promise<T>): Promise<T> {
    this.queued += 1;
    const run = this.queue.then(async () => {
      this.queued -= 1;
      this.setStatus('running');
      const job: Job = { interruptRequested: false, running: false, graceTimer: null };
      this.active = job;
      try {
        await this.ensureReady(requires);
        job.running = true;
        try {
          const value = await task(job);
          if (requires.length > 0) this.heavyRuns += 1;
          await this.refreshMemory();
          this.recycleIfIdle();
          return value;
        } finally {
          if (job.graceTimer !== null) clearTimeout(job.graceTimer);
          this.active = null;
        }
      } finally {
        this.setStatus(this.worker !== null ? 'ready' : this.startFailed ? 'error' : 'idle');
      }
    });
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async ensureReady(requires: string[]): Promise<void> {
    if (this.worker === null) await this.startWorker();
    const missing = requires.filter((name) => !this.loadedPackages.has(name));
    if (missing.length === 0) return;
    try {
      await this.call(
        { op: 'loadPackages', names: missing },
        { ms: this.options.packageTimeoutMs, kind: 'package-timeout', message: this.timeoutMessage('package') },
      );
    } catch (error) {
      if (error instanceof EngineError && error.kind === 'package-timeout') this.killWorker('package');
      throw this.toEngineError(error);
    }
    for (const name of missing) this.loadedPackages.add(name);
  }

  private async startWorker(): Promise<void> {
    this.setStatus('starting');
    try {
      await this.options.precheck();
    } catch (error) {
      this.startFailed = true;
      this.setStatus('error');
      throw this.toEngineError(error);
    }
    const worker = this.options.createWorker();
    this.worker = worker;
    this.stats.workerStarts += 1;
    this.buffer = new Int32Array(new SharedArrayBuffer(4));
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.handleMessage(event.data);
    worker.onerror = () => this.killWorker('crash');
    try {
      await this.call(
        { op: 'init' },
        { ms: this.options.loadTimeoutMs, kind: 'load-timeout', message: this.timeoutMessage('load') },
      );
      await this.call({ op: 'setInterrupt', buffer: this.buffer.buffer as SharedArrayBuffer, ignore: this.options.ignoreInterruptSignal === true });
    } catch (error) {
      if (error instanceof EngineError && error.kind === 'load-timeout') this.killWorker('load');
      this.startFailed = true;
      this.setStatus('error');
      throw this.toEngineError(error);
    }
    this.startFailed = false;
    this.loadedPackages.clear();
    this.heavyRuns = 0;
  }

  private call<T>(request: Request, timeout?: { ms: number; kind: EngineErrorKind; message: string }): Promise<T> {
    const worker = this.worker;
    if (worker === null) return Promise.reject(new EngineError('worker-crashed', 'The Python engine is not running.'));
    const id = this.nextId;
    this.nextId += 1;
    return new Promise<T>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const settle = () => {
        if (timer !== null) clearTimeout(timer);
        this.pending.delete(id);
      };
      this.pending.set(id, {
        resolve: (data) => {
          settle();
          resolve(data as T);
        },
        reject: (error) => {
          settle();
          reject(error);
        },
      });
      if (timeout !== undefined) {
        timer = setTimeout(() => {
          const waiter = this.pending.get(id);
          if (waiter !== undefined) waiter.reject(new EngineError(timeout.kind, timeout.message));
        }, timeout.ms);
      }
      worker.postMessage({ id, ...request });
    });
  }

  private handleMessage(response: WorkerResponse): void {
    const waiter = this.pending.get(response.id);
    if (waiter === undefined) return;
    if (response.ok) waiter.resolve(response.data);
    else waiter.reject(new PythonRunError(response.error));
  }

  private killWorker(reason: RestartReason): void {
    const worker = this.worker;
    if (worker === null) return;
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
    this.worker = null;
    this.buffer = null;
    this.loadedPackages.clear();
    this.heavyRuns = 0;
    if (reason !== 'interrupt') this.stats.restarts[reason] += 1;
    const error = reason === 'interrupt' ? new InterruptedRestart() : this.errorForRestart(reason);
    for (const waiter of this.pending.values()) waiter.reject(error);
    this.pending.clear();
  }

  private errorForRestart(reason: RestartReason): EngineError {
    switch (reason) {
      case 'load':
        return new EngineError('load-timeout', this.timeoutMessage('load'));
      case 'package':
        return new EngineError('package-timeout', this.timeoutMessage('package'));
      case 'crash':
        return new EngineError('worker-crashed', 'The Python engine stopped unexpectedly. It will restart on your next run.');
      default:
        return new EngineError('worker-crashed', 'The Python engine was restarted.');
    }
  }

  private async refreshMemory(): Promise<void> {
    if (this.worker === null) return;
    const { wasmMemoryBytes } = await this.call<{ wasmMemoryBytes: number }>({ op: 'memory' });
    this.stats.lastWasmBytes = wasmMemoryBytes;
  }

  private recycleIfIdle(): void {
    const reason = recycleReason(
      {
        wasmBytes: this.stats.lastWasmBytes,
        heavyRuns: this.heavyRuns,
        queued: this.queued,
      },
      this.options.recyclePolicy ?? DEFAULT_RECYCLE_POLICY,
    );
    if (reason !== null) this.killWorker(reason);
  }

  private timeoutMessage(stage: 'load' | 'package'): string {
    const seconds = Math.round((stage === 'load' ? this.options.loadTimeoutMs : this.options.packageTimeoutMs) / 1000);
    if (stage === 'load') {
      return `The Python engine did not start within ${seconds} seconds. Check your connection, then reload the page.`;
    }
    return `Loading the Python packages took longer than ${seconds} seconds. Reload the page and try again.`;
  }

  private toEngineError(error: unknown): EngineError {
    if (error instanceof EngineError) return error;
    if (error instanceof PythonRunError) return new EngineError('python-internal', error.info.message);
    return new EngineError('python-internal', error instanceof Error ? error.message : String(error));
  }

  private setStatus(status: EngineStatus): void {
    this.status = status;
    this.options.onStatus?.(status);
  }
}
