import { EngineError } from './errors';

export const NO_WASM_MESSAGE =
  "This page's security policy blocks WebAssembly, so Python cannot run here. The site needs 'wasm-unsafe-eval' in its Content-Security-Policy. Ask the site owner to allow it, then reload the page.";

// The smallest valid WebAssembly module. Compiling it on the page tests the policy
// before any worker starts, so a blocked engine fails at once with a clear message.
const EMPTY_MODULE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);

export async function assertWebAssemblyAllowed(): Promise<void> {
  if (typeof WebAssembly === 'undefined') throw new EngineError('csp-blocked', NO_WASM_MESSAGE);
  try {
    await WebAssembly.compile(EMPTY_MODULE);
  } catch {
    throw new EngineError('csp-blocked', NO_WASM_MESSAGE);
  }
}
