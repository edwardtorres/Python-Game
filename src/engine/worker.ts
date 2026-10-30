// Dedicated worker entry. All Python runs here, so runaway code can stall this worker
// without freezing the page. The main thread decides when to stop it (see client.ts).
import { PyRuntime, pythonErrorInfo } from './runtime';
import type { WorkerRequest, WorkerResponse } from './types';

interface WorkerScope {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  location: { href: string };
}

const scope = self as unknown as WorkerScope;

// Self-hosted: the module is served from /pyodide/, not bundled. Building the URL at
// runtime keeps the bundler from resolving it as a source import.
const PYODIDE_MODULE_URL = new URL('/pyodide/pyodide.mjs', self.location.href).href;

const runtime = new PyRuntime({
  indexURL: '/pyodide/',
  loadModule: () => import(/* @vite-ignore */ PYODIDE_MODULE_URL) as Promise<never>,
});

async function handle(request: WorkerRequest): Promise<unknown> {
  switch (request.op) {
    case 'init':
      await runtime.init();
      return { ready: true };
    case 'loadPackages':
      await runtime.loadPackages(request.names);
      return { loaded: request.names };
    case 'setInterrupt': {
      const view = new Int32Array(request.buffer);
      runtime.setInterrupt(view, request.ignore);
      return { sabValue: Atomics.load(view, 0) };
    }
    case 'setDatasets':
      runtime.setDatasets(request.datasetsJson);
      return { ok: true };
    case 'grade':
      return runtime.grade(request.payloadJson, request.datasetsJson);
    case 'runCell':
      return runtime.runCell(request.sessionId, request.code);
    case 'resetSession':
      runtime.resetSession(request.sessionId);
      return { ok: true };
    case 'memory':
      return { wasmMemoryBytes: runtime.wasmMemoryBytes() };
  }
}

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  handle(request).then(
    (data) => scope.postMessage({ id: request.id, ok: true, data }),
    (error: unknown) => scope.postMessage({ id: request.id, ok: false, error: pythonErrorInfo(error) }),
  );
};
