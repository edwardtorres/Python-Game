// Pyodide runtime wrapper. The browser worker and the Node tests both use this class,
// so the tests exercise the same code the game runs.
import runtimeSource from './python/runtime.py?raw';
import mockApiSource from './python/mock_api.py?raw';
import graderSource from './python/grader.py?raw';
import notebookSource from './python/notebook.py?raw';
import type { CellResult, GradeResult, PythonErrorInfo } from './types';

export const PYTHON_MODULES: Record<string, string> = {
  runtime: runtimeSource,
  mock_api: mockApiSource,
  grader: graderSource,
  notebook: notebookSource,
};

const BOOT = [
  'import os, sys',
  "os.environ.setdefault('MPLBACKEND', 'Agg')",
  "sys.path.insert(0, '/opt/larkspur')",
  'import numpy',
  'import runtime, mock_api, grader, notebook',
].join('\n');

// The part of the Pyodide API the engine uses, typed here so the strict lint rules
// hold. Pyodide's own declarations leave some of these members unresolved.
export interface PyProxyLike {
  toJs(options?: object): unknown;
  destroy(): void;
}

interface GraderModule extends PyProxyLike {
  grade_json(payloadJson: string, datasetsJson: string): string;
}

interface NotebookModule extends PyProxyLike {
  run_cell(sessionId: string, code: string): PyProxyLike;
  set_datasets(datasetsJson: string): void;
  reset_session(sessionId: string): void;
}

export interface PyodideLite {
  FS: {
    mkdirTree(path: string): void;
    writeFile(path: string, data: string): void;
  };
  loadPackage(names: string[], options?: object): Promise<void>;
  runPython(code: string): unknown;
  setInterruptBuffer(buffer: Int32Array): void;
  pyimport(name: string): unknown;
  _module: { HEAPU8: Uint8Array };
}

export interface PyodideModule {
  loadPyodide(options: { indexURL: string; stdout?: (line: string) => void; stderr?: (line: string) => void }): Promise<PyodideLite>;
}

export interface RuntimeConfig {
  indexURL: string;
  loadModule: () => Promise<PyodideModule>;
}

export class PyRuntime {
  private py: PyodideLite | null = null;

  constructor(private readonly config: RuntimeConfig) {}

  async init(): Promise<void> {
    if (this.py !== null) return;
    const mod = await this.config.loadModule();
    const py = await mod.loadPyodide({ indexURL: this.config.indexURL, stdout: () => undefined, stderr: () => undefined });
    // NumPy is loaded for every session: graded runs seed its global RNG.
    await py.loadPackage(['numpy'], { messageCallback: () => undefined, errorCallback: () => undefined });
    py.FS.mkdirTree('/opt/larkspur');
    for (const [name, source] of Object.entries(PYTHON_MODULES)) {
      py.FS.writeFile(`/opt/larkspur/${name}.py`, source);
    }
    py.runPython(BOOT);
    this.py = py;
  }

  private python(): PyodideLite {
    if (this.py === null) throw new Error('PyRuntime.init() has not run');
    return this.py;
  }

  async loadPackages(names: string[]): Promise<void> {
    if (names.length === 0) return;
    await this.python().loadPackage(names, { messageCallback: () => undefined, errorCallback: () => undefined });
  }

  grade(payloadJson: string, datasetsJson: string): GradeResult {
    const py = this.python();
    const grader = py.pyimport('grader') as GraderModule;
    try {
      return JSON.parse(grader.grade_json(payloadJson, datasetsJson)) as GradeResult;
    } finally {
      grader.destroy();
    }
  }

  runCell(sessionId: string, code: string): CellResult {
    const py = this.python();
    const notebook = py.pyimport('notebook') as NotebookModule;
    const proxy = notebook.run_cell(sessionId, code);
    try {
      // Python None arrives as undefined through toJs, so normalise to null here.
      const raw = proxy.toJs({ dict_converter: Object.fromEntries }) as Partial<CellResult>;
      return {
        stdout: raw.stdout ?? '',
        display: raw.display ?? null,
        images: raw.images ?? [],
        error: raw.error ?? null,
      };
    } finally {
      proxy.destroy();
      notebook.destroy();
    }
  }

  setDatasets(datasetsJson: string): void {
    const notebook = this.python().pyimport('notebook') as NotebookModule;
    try {
      notebook.set_datasets(datasetsJson);
    } finally {
      notebook.destroy();
    }
  }

  resetSession(sessionId: string): void {
    const notebook = this.python().pyimport('notebook') as NotebookModule;
    try {
      notebook.reset_session(sessionId);
    } finally {
      notebook.destroy();
    }
  }

  setInterrupt(buffer: Int32Array, ignore: boolean): void {
    if (ignore) return;
    this.python().setInterruptBuffer(buffer);
  }

  wasmMemoryBytes(): number {
    return this.python()._module.HEAPU8.buffer.byteLength;
  }
}

export function pythonErrorInfo(error: unknown): PythonErrorInfo {
  const type = (error as { type?: unknown }).type;
  const message = error instanceof Error ? error.message : String(error);
  const lines = message.trim().split('\n').filter(Boolean);
  return {
    type: typeof type === 'string' ? type : 'Error',
    message: (lines[lines.length - 1] ?? message).slice(0, 400),
    line: null,
  };
}
