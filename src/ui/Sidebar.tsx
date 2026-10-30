import type { ChallengeSpec } from '../challenges/types';
import type { Chapter } from '../curriculum/types';
import type { ChallengeProgress } from '../save/schema';

interface SidebarProps {
  challenges: readonly ChallengeSpec[];
  chapters: readonly Chapter[];
  selectedId: string;
  progress: Record<string, ChallengeProgress | undefined>;
  onSelect: (id: string) => void;
}

export function Sidebar({ challenges, chapters, selectedId, progress, onSelect }: SidebarProps) {
  return (
    <nav aria-label="Tickets" className="space-y-4">
      {chapters
        .filter((chapter) => challenges.some((challenge) => challenge.chapterId === chapter.id))
        .map((chapter) => (
          <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
            <h2 id={`chapter-${chapter.id}`} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {chapter.number}. {chapter.title}
            </h2>
            <ul className="mt-2 space-y-1">
              {challenges
                .filter((challenge) => challenge.chapterId === chapter.id)
                .map((challenge) => {
                  const status = progress[challenge.id]?.status ?? 'not-started';
                  const selected = challenge.id === selectedId;
                  return (
                    <li key={challenge.id}>
                      <button
                        type="button"
                        aria-current={selected ? 'page' : undefined}
                        onClick={() => onSelect(challenge.id)}
                        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                          selected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span>{challenge.title}</span>
                        <span className={`text-xs ${selected ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {status === 'passed' ? 'Passed' : status === 'attempted' ? 'In progress' : 'New'}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      <p className="text-xs text-slate-500">More chapters arrive in later steps.</p>
    </nav>
  );
}
