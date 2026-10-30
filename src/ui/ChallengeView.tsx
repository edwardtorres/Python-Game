import { useEffect, useMemo, useState } from 'react';
import type { PythonEngine, EngineStatus } from '../engine/client';
import { EngineError, isKeyboardInterrupt } from '../engine/errors';
import type { GradeResult } from '../engine/types';
import { buildGradeRequest } from '../challenges/payload';
import type { ChallengeSpec } from '../challenges/types';
import { applyRun, applySubmission, canRevealSolution, creditFor, revealHint, revealSolution, SOLUTION_UNLOCK_ATTEMPTS } from '../app/progress';
import type { ChallengeProgress } from '../save/schema';
import { CodeEditor } from './CodeEditor';
import { Feedback } from './Feedback';
import { NotebookView } from './NotebookView';

// Notebook cells often plot, so the notebook loads pandas and matplotlib together.
const NOTEBOOK_PACKAGES = ['pandas', 'matplotlib'];

interface ChallengeViewProps {
  spec: ChallengeSpec;
  progress: ChallengeProgress;
  engine: PythonEngine;
  engineStatus: EngineStatus;
  onProgress: (change: (current: ChallengeProgress) => ChallengeProgress) => void;
  onGlobalNotice: (message: string | null) => void;
}

export function ChallengeView({ spec, progress, engine, engineStatus, onProgress, onGlobalNotice }: ChallengeViewProps) {
  const [result, setResult] = useState<GradeResult | null>(null);
  const [mode, setMode] = useState<'run' | 'submit' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setupCount = spec.setupCell === undefined ? 0 : 1;
  const visibleDatasets = useMemo(() => visibleDatasetsOf(spec), [spec]);

  // First visit: fill in the starter (or the notebook cells). Later edits are the learner's.
  useEffect(() => {
    if (spec.notebook && progress.cells.length === 0) {
      onProgress((current) => ({ ...current, cells: [spec.setupCell ?? '', spec.starter] }));
    } else if (!spec.notebook && progress.lastCode === '') {
      onProgress((current) => ({ ...current, lastCode: spec.starter }));
    }
    // Runs once per challenge; the learner's later edits must not be overwritten.
  }, [spec.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const learnerCode = (): string => {
    if (!spec.notebook) return progress.lastCode;
    return progress.cells
      .slice(setupCount)
      .map((cell, index) => `# --- cell ${index + 1} ---\n${cell}`)
      .join('\n');
  };

  const grade = async (next: 'run' | 'submit'): Promise<void> => {
    const code = learnerCode();
    const restartsBefore = engine.getStats().restarts.memory;
    setBusy(true);
    setNotice(null);
    setMode(next);
    try {
      const { payload, datasets } = buildGradeRequest(spec, code, next);
      const outcome = await engine.grade(payload, datasets);
      if (outcome.kind === 'interrupted') {
        setResult(null);
        setNotice(outcome.method === 'buffer' ? 'Stopped.' : 'Stopped. The engine restarted because it did not confirm the stop in time.');
        return;
      }
      setResult(outcome.result);
      const now = new Date().toISOString();
      const storedCode = spec.notebook ? progress.lastCode : code;
      onProgress((current) => (next === 'submit' ? applySubmission(current, outcome.result, now, storedCode) : applyRun(current, storedCode)));
      if (engine.getStats().restarts.memory !== restartsBefore) {
        onGlobalNotice('The engine restarted to free memory. Your next run starts a fresh Python session.');
      }
    } catch (error) {
      setResult(null);
      setNotice(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  const stop = () => {
    engine.cancel();
  };

  const credit = creditFor(progress);
  const hintTexts = spec.hints.slice(0, progress.hintTier);

  return (
    <article className="space-y-6" aria-labelledby="challenge-title">
      <header className="space-y-2">
        <p className="text-sm font-medium text-indigo-700">{spec.ticket.from}</p>
        <h1 id="challenge-title" className="text-2xl font-semibold">
          {spec.title}
        </h1>
        <p className="text-sm text-slate-600">
          Status: {progress.status === 'passed' ? 'Passed' : progress.status === 'attempted' ? 'In progress' : 'Not started'}
          {credit === 'reduced' ? ' (reduced credit: solution viewed)' : ''}
          {progress.attempts > 0 ? ` · ${progress.attempts} failed submission${progress.attempts === 1 ? '' : 's'}` : ''}
        </p>
      </header>

      <section aria-labelledby="ticket-heading" className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 id="ticket-heading" className="text-base font-semibold">
          {spec.ticket.subject}
        </h2>
        <p className="mt-2 text-sm text-slate-800">{spec.ticket.body}</p>
        <h3 className="mt-4 text-sm font-semibold">Rules</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-800">
          {spec.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="work-heading" className="space-y-3">
        <h2 id="work-heading" className="text-lg font-semibold">
          {spec.notebook ? 'Notebook' : 'Your code'}
        </h2>
        {spec.notebook ? (
          progress.cells.length > 0 && (
            <NotebookView
              challengeId={spec.id}
              cells={progress.cells}
              setupCount={setupCount}
              requires={NOTEBOOK_PACKAGES}
              sessionId={`notebook-${spec.id}`}
              visibleDatasets={visibleDatasets}
              engine={engine}
              onCellsChange={(cells) => onProgress((current) => ({ ...current, cells }))}
              onNotice={setNotice}
            />
          )
        ) : (
          <CodeEditor
            id={spec.id}
            value={progress.lastCode}
            label={`Code for ${spec.title}`}
            onChange={(code) => onProgress((current) => ({ ...current, lastCode: code }))}
            onRun={() => void grade('run')}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-100 disabled:opacity-50"
            onClick={() => void grade('run')}
            disabled={busy}
          >
            Run visible checks
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            onClick={() => void grade('submit')}
            disabled={busy}
          >
            Submit
          </button>
          {busy && (
            <button type="button" className="min-h-11 rounded-md border border-rose-300 bg-rose-50 px-4 py-2 font-medium text-rose-900 hover:bg-rose-100" onClick={stop}>
              Stop
            </button>
          )}
          <span className="text-sm text-slate-600" aria-live="polite">
            {busy ? `${mode === 'submit' ? 'Submitting' : 'Running'}…` : engineStatus === 'starting' ? 'Starting Python…' : ''}
          </span>
        </div>
      </section>

      <Feedback result={result} notice={notice} mode={mode} />

      <section aria-labelledby="help-heading" className="space-y-3">
        <h2 id="help-heading" className="text-lg font-semibold">
          Help
        </h2>
        {hintTexts.map((hint, index) => (
          <pre key={index} className="whitespace-pre-wrap rounded-md bg-white p-3 font-sans text-sm text-slate-800">
            Hint {index + 1}: {hint}
          </pre>
        ))}
        <button
          type="button"
          className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          onClick={() => onProgress(revealHint)}
          disabled={progress.hintTier >= 3}
        >
          Show a hint ({progress.hintTier} of 3)
        </button>
        {canRevealSolution(progress) ? (
          progress.solutionRevealed ? (
            <div className="space-y-2">
              <p className="text-sm text-amber-900">Solution shown. Viewing it gives reduced credit and does not count toward mastery.</p>
              <pre tabIndex={0} aria-label="Solution code" className="overflow-x-auto whitespace-pre rounded-md bg-white p-3 font-mono text-sm">{spec.reference}</pre>
            </div>
          ) : (
            <button type="button" className="min-h-11 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100" onClick={() => onProgress(revealSolution)}>
              Show the solution (reduced credit)
            </button>
          )
        ) : (
          <p className="text-sm text-slate-600">
            The solution unlocks after {SOLUTION_UNLOCK_ATTEMPTS} failed submissions ({progress.attempts} so far).
          </p>
        )}
      </section>
    </article>
  );
}

function visibleDatasetsOf(spec: ChallengeSpec): Record<string, string> {
  return buildGradeRequest(spec, '', 'run').datasets;
}

function describeError(error: unknown): string {
  if (error instanceof EngineError) return error.message;
  if (isKeyboardInterrupt(error)) return 'Stopped.';
  return error instanceof Error ? error.message : 'Something went wrong. Reload the page and try again.';
}
