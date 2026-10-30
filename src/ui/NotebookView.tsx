import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { PythonEngine } from '../engine/client';
import type { CellResult } from '../engine/types';
import { CodeEditor } from './CodeEditor';
import { sanitizeTableHtml } from './sanitize';

interface NotebookViewProps {
  challengeId: string;
  cells: string[];
  setupCount: number;
  requires: string[];
  sessionId: string;
  visibleDatasets: Record<string, string>;
  engine: PythonEngine;
  onCellsChange: (cells: string[]) => void;
  onNotice: (message: string | null) => void;
}

type CellOutput = { kind: 'result'; result: CellResult } | { kind: 'message'; text: string };

export function NotebookView({ challengeId, cells, setupCount, requires, sessionId, visibleDatasets, engine, onCellsChange, onNotice }: NotebookViewProps) {
  const [outputs, setOutputs] = useState<Record<number, CellOutput>>({});
  const [busyCell, setBusyCell] = useState<number | null>(null);
  const startsSeen = useRef(engine.getStats().workerStarts);
  const datasetsJson = JSON.stringify(visibleDatasets);

  useEffect(() => {
    engine.setDatasets(JSON.parse(datasetsJson) as Record<string, string>).catch(() => {
      onNotice('The data for this notebook could not be loaded. Reload the page to try again.');
    });
  }, [engine, datasetsJson, onNotice]);

  const setCell = (index: number, code: string) => {
    onCellsChange(cells.map((cell, position) => (position === index ? code : cell)));
  };

  const runCell = async (index: number): Promise<void> => {
    setBusyCell(index);
    onNotice(null);
    try {
      const outcome = await engine.runCell(sessionId, cells[index] ?? '', requires);
      if (outcome.kind === 'interrupted') {
        setOutputs((current) => ({ ...current, [index]: { kind: 'message', text: 'Stopped.' } }));
      } else {
        setOutputs((current) => ({ ...current, [index]: { kind: 'result', result: outcome.result } }));
      }
      if (engine.getStats().workerStarts !== startsSeen.current) {
        startsSeen.current = engine.getStats().workerStarts;
        onNotice('The engine restarted, so notebook variables were cleared. Run the setup cell again.');
      }
    } catch (error) {
      setOutputs((current) => ({ ...current, [index]: { kind: 'message', text: error instanceof Error ? error.message : String(error) } }));
    } finally {
      setBusyCell(null);
    }
  };

  const runAll = async (): Promise<void> => {
    for (let index = 0; index < cells.length; index += 1) {
      await runCell(index);
    }
  };

  return (
    <div className="space-y-4" data-testid="notebook">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100" onClick={() => onCellsChange([...cells, ''])}>
          Add cell
        </button>
        <button type="button" className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100" onClick={() => void runAll()} disabled={busyCell !== null}>
          Run all cells
        </button>
        {busyCell !== null && (
          <button type="button" className="min-h-11 rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-100" onClick={() => engine.cancel()}>
            Stop
          </button>
        )}
      </div>
      <ol className="space-y-4">
        {cells.map((code, index) => {
          const output = outputs[index];
          const isSetup = index < setupCount;
          return (
            <li key={`${challengeId}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">
                  In [{index + 1}]{isSetup ? ' (setup)' : ''}
                </span>
                <div className="flex gap-2">
                  <button type="button" className="min-h-11 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50" onClick={() => void runCell(index)} disabled={busyCell !== null}>
                    Run cell {index + 1}
                  </button>
                  {!isSetup && (
                    <button type="button" className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100" onClick={() => onCellsChange(cells.filter((_, position) => position !== index))}>
                      Delete cell {index + 1}
                    </button>
                  )}
                </div>
              </div>
              <CodeEditor
                id={`${challengeId}-cell-${index}`}
                value={code}
                label={`Notebook cell ${index + 1}`}
                onChange={(next) => setCell(index, next)}
                onRun={() => void runCell(index)}
              />
              {output !== undefined && <CellOutputView output={output} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Wide output scrolls sideways, so the region must be reachable from the keyboard.
function ScrollRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded bg-white p-2">
      {children}
    </div>
  );
}

function CellOutputView({ output }: { output: CellOutput }) {
  if (output.kind === 'message') {
    return <p className="mt-2 text-sm text-slate-700">{output.text}</p>;
  }
  const { result } = output;
  return (
    <div className="mt-2 space-y-2 text-sm" aria-label="Cell output">
      {result.stdout !== '' && <ScrollRegion label="Printed output"><pre className="whitespace-pre-wrap font-mono">{result.stdout}</pre></ScrollRegion>}
      {result.display !== null && result.display.kind === 'html' && (
        <ScrollRegion label="Table"><div dangerouslySetInnerHTML={{ __html: sanitizeTableHtml(result.display.data) }} /></ScrollRegion>
      )}
      {result.display !== null && result.display.kind === 'text' && (
        <ScrollRegion label="Value"><pre className="whitespace-pre-wrap font-mono">{result.display.data}</pre></ScrollRegion>
      )}
      {result.images.map((image, index) => (
        <img key={index} alt={`Chart output ${index + 1}`} className="max-w-full rounded bg-white" src={`data:image/png;base64,${image}`} />
      ))}
      {result.error !== null && (
        <p role="alert" className="rounded bg-rose-50 p-2 font-mono text-rose-900">
          {result.error.type}
          {result.error.line !== null ? ` (line ${result.error.line})` : ''}: {result.error.message}
        </p>
      )}
    </div>
  );
}
