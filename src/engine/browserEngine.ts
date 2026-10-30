import { type EngineStatus, PythonEngine } from './client';
import { DEFAULT_RECYCLE_POLICY, type RecyclePolicy } from './recycle';
import { assertWebAssemblyAllowed } from './webassembly';

export interface BrowserEngineHooks {
  ignoreInterruptSignal: boolean;
  wasmLimitOverride: number | null;
}

export function createBrowserEngine(onStatus: (status: EngineStatus) => void, hooks: BrowserEngineHooks): PythonEngine {
  const recyclePolicy: RecyclePolicy =
    hooks.wasmLimitOverride === null ? DEFAULT_RECYCLE_POLICY : { ...DEFAULT_RECYCLE_POLICY, maxWasmBytes: hooks.wasmLimitOverride };
  return new PythonEngine({
    createWorker: () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }),
    precheck: assertWebAssemblyAllowed,
    onStatus,
    ignoreInterruptSignal: hooks.ignoreInterruptSignal,
    recyclePolicy,
  });
}
