// Dev-only test hooks. In the production build __TEST_HOOKS__ is false and every hook
// returns its default. scripts/check-production-hooks.mjs fails the build if any hook
// name or the test bridge reaches dist/.

// The field names here are neutral on purpose: the production build must not contain
// the hook names, and an object key would appear in the bundle.
export interface TestHooks {
  ignoreInterruptSignal: boolean;
  wasmLimitOverride: number | null;
}

const OFF: TestHooks = { ignoreInterruptSignal: false, wasmLimitOverride: null };

export function readTestHooks(search: string): TestHooks {
  if (__TEST_HOOKS__) {
    const params = new URLSearchParams(search);
    const threshold = params.get('recycleThresholdBytes');
    return {
      ignoreInterruptSignal: params.get('forceInterruptFailure') === '1',
      wasmLimitOverride: threshold === null ? null : Number(threshold),
    };
  }
  return OFF;
}

export interface TestBridge {
  setCode(challengeId: string, code: string): void;
  setCell(challengeId: string, index: number, code: string): void;
  addCell(challengeId: string): void;
  status(): { engine: string; restarts: Record<string, number>; lastWasmBytes: number; workerStarts: number };
}

export function installTestBridge(bridge: TestBridge): void {
  if (__TEST_HOOKS__) {
    Object.assign(window, { __LARKSPUR_TEST__: bridge });
  }
}
