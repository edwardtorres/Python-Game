// Worker recycling policy. The worker is replaced only while idle, never mid-run. A
// Pyodide worker's WebAssembly memory roughly doubles under real work and does not
// shrink, so the engine restarts the worker when memory passes a threshold, or after a
// number of data-heavy runs. A restart costs a cold start plus package reloads.

export interface RecyclePolicy {
  maxWasmBytes: number;
  maxHeavyRuns: number;
}

export const DEFAULT_RECYCLE_POLICY: RecyclePolicy = {
  maxWasmBytes: 256 * 1024 * 1024,
  maxHeavyRuns: 40,
};

export interface RecycleState {
  wasmBytes: number;
  heavyRuns: number;
  queued: number;
}

export type RecycleReason = 'memory' | 'heavy-runs';

// Returns why the worker should be recycled now, or null. Work waiting in the queue
// always wins, so a restart never delays a learner's run.
export function recycleReason(state: RecycleState, policy: RecyclePolicy): RecycleReason | null {
  if (state.queued > 0) return null;
  if (state.wasmBytes > policy.maxWasmBytes) return 'memory';
  if (state.heavyRuns >= policy.maxHeavyRuns) return 'heavy-runs';
  return null;
}
