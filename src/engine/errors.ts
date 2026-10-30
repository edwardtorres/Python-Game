// Engine error types. Every failure the learner can see has one of these kinds, so the
// UI can show a specific, actionable message.
import type { PythonErrorInfo } from './types';

export type EngineErrorKind =
  | 'csp-blocked'
  | 'load-timeout'
  | 'package-timeout'
  | 'worker-crashed'
  | 'python-internal';

export class EngineError extends Error {
  constructor(
    readonly kind: EngineErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

// A Python exception that came back from the worker. KeyboardInterrupt is how a
// buffer interrupt shows up, so the client checks for it by type.
export class PythonRunError extends Error {
  constructor(readonly info: PythonErrorInfo) {
    super(info.message);
    this.name = 'PythonRunError';
  }
}

// Thrown to the waiting job when the worker was stopped because the buffer interrupt
// was not confirmed in time.
export class InterruptedRestart extends Error {
  constructor() {
    super('The run was stopped by restarting the Python engine.');
    this.name = 'InterruptedRestart';
  }
}

export function isKeyboardInterrupt(error: unknown): boolean {
  return error instanceof PythonRunError && error.info.type === 'KeyboardInterrupt';
}
