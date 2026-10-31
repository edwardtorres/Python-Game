import { useState } from 'react';
import type { EngineStatus, PythonEngine } from '../engine/client';
import type { ChoiceItem } from '../content/types';
import type { ChoiceOutput } from '../content/output-types';
import { MISTAKES, type MistakeTag } from '../content/mistakes';
import { applyChoice, canRevealSolution, revealHint, revealSolution } from '../app/progress';
import type { ChoiceProgress } from '../save/schema';

interface ChoiceViewProps {
  item: ChoiceItem;
  output: ChoiceOutput;
  progress: ChoiceProgress;
  engine: PythonEngine;
  engineStatus: EngineStatus;
  onProgress: (change: (current: ChoiceProgress) => ChoiceProgress) => void;
}

function mistakeFor(tag: string | null) {
  return tag !== null && tag in MISTAKES ? MISTAKES[tag as MistakeTag] : null;
}

// A predict or traceback item. The options are computed by running code, so the answer,
// each wrong option, and the mistake it stands for all come from the recorded outputs.
export function ChoiceView({ item, output, progress, engine, engineStatus, onProgress }: ChoiceViewProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState<string | null>(null);
  const [runText, setRunText] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const answer = output.options.find((option) => option.id === output.answer);
  const isTraceback = item.kind === 'traceback';
  const kindLabel = isTraceback ? 'Read the traceback' : 'Predict the output';

  const check = () => {
    if (picked === null) return;
    const option = output.options.find((candidate) => candidate.id === picked);
    const correct = picked === output.answer;
    setChecked(picked);
    onProgress((current) => applyChoice(current, { correct, mistake: correct ? null : option?.tag ?? null }));
  };

  const run = async () => {
    setRunning(true);
    try {
      const outcome = await engine.runCell(`choice-${item.id}`, item.code, []);
      if (outcome.kind === 'interrupted') {
        setRunText('Stopped.');
      } else if (outcome.result.error !== null) {
        setRunText(`${outcome.result.error.type}: ${outcome.result.error.message}`);
      } else {
        setRunText(outcome.result.stdout === '' ? '(no output)' : outcome.result.stdout.replace(/\n$/, ''));
      }
    } catch {
      setRunText('Python could not run this code.');
    } finally {
      setRunning(false);
    }
  };

  const checkedOption = output.options.find((option) => option.id === checked);
  const checkedMistake = checkedOption === undefined || checked === output.answer ? null : mistakeFor(checkedOption.tag);
  const showAnswer = progress.solutionRevealed;

  return (
    <article className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{kindLabel}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{item.title}</h1>
      </header>

      <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 text-sm text-slate-100" aria-label="Code">
        <code>{item.code}</code>
      </pre>

      <fieldset className="space-y-2">
        <legend className="text-base font-medium text-slate-900">{item.prompt}</legend>
        {output.options.map((option) => (
          <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2">
            <input
              type="radio"
              name={`choice-${item.id}`}
              value={option.id}
              checked={picked === option.id}
              onChange={() => setPicked(option.id)}
              className="h-4 w-4"
            />
            <code className="whitespace-pre-wrap break-words text-sm">{option.text}</code>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={check} disabled={picked === null} className="min-h-11 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-300">
          Check my answer
        </button>
        <button type="button" onClick={() => { void run(); }} disabled={running || engineStatus === 'error'} className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 disabled:text-slate-400">
          Run to check
        </button>
      </div>

      <div role="status" aria-live="polite" className="space-y-2 text-sm text-slate-800">
        {checked !== null && checked === output.answer && <p className="rounded-md bg-emerald-50 p-3 text-emerald-900">Correct.</p>}
        {checked !== null && checked !== output.answer && checkedMistake !== null && (
          <div className="rounded-md bg-amber-50 p-3 text-amber-900">
            <p>
              <span className="font-semibold">Likely mistake ({checkedMistake.tag}): </span>
              {checkedMistake.title}.
            </p>
            <p className="mt-1">{checkedMistake.explanation}</p>
            <p className="mt-1">Try again. Pick another option, or use a hint.</p>
          </div>
        )}
        {showAnswer && answer !== undefined && (
          <p className="rounded-md bg-slate-100 p-3">
            The answer is <code className="font-semibold">{answer.text}</code>. Credit for this item is reduced.
          </p>
        )}
        {runText !== null && (
          <p className="rounded-md bg-slate-100 p-3">
            Running the code gives: <code className="whitespace-pre-wrap break-words">{runText}</code>
          </p>
        )}
      </div>

      <section aria-labelledby="choice-hints" className="space-y-2">
        <h2 id="choice-hints" className="text-base font-semibold text-slate-900">
          Hints
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-800">
          {item.hints.slice(0, progress.hintTier).map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
        {progress.hintTier < 3 && (
          <button type="button" onClick={() => onProgress((current) => revealHint(current))} className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800">
            Show a hint ({progress.hintTier} of 3)
          </button>
        )}
        {canRevealSolution(progress) && !showAnswer && (
          <button type="button" onClick={() => onProgress((current) => revealSolution(current))} className="min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800">
            Show the answer (reduced credit)
          </button>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Attempts: {progress.attempts}. {progress.status === 'passed' ? 'Passed.' : 'Not passed yet.'}
      </p>
    </article>
  );
}
