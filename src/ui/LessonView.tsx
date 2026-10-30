import { useState } from 'react';
import type { EngineStatus, PythonEngine } from '../engine/client';
import type { Example, Lesson, Section } from '../content/chapter1/types';
import { MISTAKES, type MistakeTag } from '../content/chapter1/mistakes';
import { CodeEditor } from './CodeEditor';

interface LessonViewProps {
  lesson: Lesson;
  read: boolean;
  engine: PythonEngine;
  engineStatus: EngineStatus;
  onToggleRead: (read: boolean) => void;
}

// One runnable example. The learner predicts the output, then runs the code. The code is
// editable, and each example keeps its own session, so names from one example do not leak.
function ExampleBlock({ example, engine, engineStatus }: { example: Example; engine: PythonEngine; engineStatus: EngineStatus }) {
  const [code, setCode] = useState(example.code);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      const outcome = await engine.runCell(`lesson-${example.id}`, code, []);
      if (outcome.kind === 'interrupted') {
        setOutput('Stopped.');
      } else if (outcome.result.error !== null) {
        setOutput(`${outcome.result.error.type}: ${outcome.result.error.message}`);
      } else {
        setOutput(outcome.result.stdout === '' ? '(no output)' : outcome.result.stdout.replace(/\n$/, ''));
      }
    } catch {
      setOutput('Python could not run this code.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700">Predict the output, then run it.</p>
      <CodeEditor id={`example-${example.id}`} label="Example code" value={code} onChange={setCode} onRun={() => { void run(); }} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { void run(); }} disabled={running || engineStatus === 'error'} className="min-h-11 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-300">
          Run
        </button>
        {engineStatus === 'starting' && <span className="text-sm text-slate-600">Starting Python…</span>}
      </div>
      {output !== null && (
        <pre aria-live="polite" aria-label="Output" className="overflow-x-auto rounded-md bg-slate-100 p-3 text-sm text-slate-900 whitespace-pre-wrap break-words">
          {output}
        </pre>
      )}
    </div>
  );
}

function SectionBlock({ section, engine, engineStatus }: { section: Section; engine: PythonEngine; engineStatus: EngineStatus }) {
  return (
    <section aria-labelledby={`section-${section.id}`} className="space-y-3">
      <h2 id={`section-${section.id}`} className="text-lg font-semibold text-slate-900">
        {section.title}
      </h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-6 text-slate-800">
          {paragraph}
        </p>
      ))}
      {section.examples.map((example, index) => (
        <div key={example.id} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Example {index + 1}</h3>
          <ExampleBlock example={example} engine={engine} engineStatus={engineStatus} />
        </div>
      ))}
      {section.commonMistakes.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <h3 className="text-sm font-semibold text-amber-900">Common mistakes</h3>
          <ul className="mt-2 space-y-2 text-sm text-amber-950">
            {section.commonMistakes.map((tag) => {
              const mistake = MISTAKES[tag as MistakeTag];
              return (
                <li key={tag}>
                  <span className="font-semibold">{mistake.title}.</span> {mistake.explanation}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export function LessonView({ lesson, read, engine, engineStatus, onToggleRead }: LessonViewProps) {
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Lesson {lesson.number} of 13
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">{lesson.title}</h1>
        <p className="text-sm leading-6 text-slate-800">{lesson.intro}</p>
        <button
          type="button"
          aria-pressed={read}
          onClick={() => onToggleRead(!read)}
          className={`min-h-11 rounded-md px-4 py-2 text-sm font-medium ${read ? 'bg-emerald-700 text-white' : 'border border-slate-300 bg-white text-slate-800'}`}
        >
          {read ? 'Marked as read' : 'Mark as read'}
        </button>
      </header>
      {lesson.sections.map((section) => (
        <SectionBlock key={section.id} section={section} engine={engine} engineStatus={engineStatus} />
      ))}
    </article>
  );
}
