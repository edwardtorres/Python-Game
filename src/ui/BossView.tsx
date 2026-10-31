import type { EngineStatus, PythonEngine } from '../engine/client';
import type { Chapter } from '../content/types';
import { type ChallengeProgress, emptyProgress } from '../save/schema';
import { ChallengeView } from './ChallengeView';

interface BossViewProps {
  chapter: Chapter;
  challenges: Record<string, ChallengeProgress | undefined>;
  engine: PythonEngine;
  engineStatus: EngineStatus;
  onProgress: (id: string, change: (current: ChallengeProgress) => ChallengeProgress) => void;
  onGlobalNotice: (message: string | null) => void;
}

// The boss runs its four parts in order. Each part is graded on its own. The next part
// opens once the one before it has passed.
export function BossView({ chapter, challenges, engine, engineStatus, onProgress, onGlobalNotice }: BossViewProps) {
  const parts = chapter.boss;
  const current = parts.findIndex((part) => challenges[part.id]?.status !== 'passed');
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Chapter {chapter.number} boss</p>
        <h1 className="text-2xl font-semibold text-slate-900">{chapter.bossTitle}</h1>
        <p className="text-sm leading-6 text-slate-800">{chapter.bossIntro}</p>
      </header>
      {parts.map((part, index) => {
        const status = challenges[part.id]?.status === 'passed' ? 'Passed' : index === current ? 'Current part' : 'Locked until the part before it passes';
        return (
          <section key={part.id} aria-labelledby={`boss-part-${index}`} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
            <h2 id={`boss-part-${index}`} className="text-base font-semibold text-slate-900">
              Part {index + 1} of {parts.length}: {part.title.replace(/^Boss part \d: /, '')}
            </h2>
            <p className="text-xs text-slate-600">{status}</p>
            {index === current && (
              <ChallengeView
                key={part.id}
                spec={part}
                progress={challenges[part.id] ?? emptyProgress()}
                engine={engine}
                engineStatus={engineStatus}
                onProgress={(change) => onProgress(part.id, change)}
                onGlobalNotice={onGlobalNotice}
              />
            )}
          </section>
        );
      })}
    </article>
  );
}
