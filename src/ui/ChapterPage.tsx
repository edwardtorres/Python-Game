import type { Chapter } from '../content/types';
import type { ChallengeProgress, ChapterProgress } from '../save/schema';
import { bossHref } from './routes';

interface ChapterPageProps {
  chapter: Chapter;
  progress: ChapterProgress;
  challenges: Record<string, ChallengeProgress | undefined>;
}

function bossPassed(chapter: Chapter, challenges: Record<string, ChallengeProgress | undefined>): boolean {
  return chapter.boss.every((part) => challenges[part.id]?.status === 'passed');
}

function statusLabel(status: 'passed' | 'attempted' | 'not-started' | undefined): string {
  if (status === 'passed') return 'Passed';
  if (status === 'attempted') return 'In progress';
  return 'New';
}

function ItemLink({ href, title, status }: { href: string; title: string; status: string }) {
  return (
    <li>
      <a href={href} className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-100">
        <span>{title}</span>
        <span className="text-xs text-slate-500">{status}</span>
      </a>
    </li>
  );
}

export function ChapterPage({ chapter, progress, challenges }: ChapterPageProps) {
  const bossDone = bossPassed(chapter, challenges);
  const itemsDone = chapter.choice.filter((item) => progress.choice[item.id]?.status === 'passed').length + chapter.graded.filter((spec) => challenges[spec.id]?.status === 'passed').length + (bossDone ? 1 : 0);
  const itemsTotal = chapter.choice.length + chapter.graded.length + 1;
  const bossCount = chapter.boss.filter((part) => challenges[part.id]?.status === 'passed').length;

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Chapter {chapter.number}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{chapter.title}</h1>
        <p className="text-sm leading-6 text-slate-800">{chapter.intro}</p>
        <p role="status" className="text-sm text-slate-700">
          Lessons read: {progress.lessonsRead.length} of {chapter.lessons.length}. Items passed: {itemsDone} of {itemsTotal}. Boss parts passed: {bossCount} of {chapter.boss.length}.
        </p>
      </header>

      <section aria-labelledby="chapter-lessons" className="space-y-3">
        <h2 id="chapter-lessons" className="text-lg font-semibold text-slate-900">
          Lessons
        </h2>
        <ul className="space-y-2">
          {chapter.lessons.map((lesson) => (
            <ItemLink
              key={lesson.id}
              href={`#/lesson/${lesson.id}`}
              title={`${lesson.number}. ${lesson.title}`}
              status={progress.lessonsRead.includes(lesson.id) ? 'Read' : 'New'}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby="chapter-practice" className="space-y-3">
        <h2 id="chapter-practice" className="text-lg font-semibold text-slate-900">
          Practice: predict and read tracebacks
        </h2>
        <ul className="space-y-2">
          {chapter.choice.map((item) => (
            <ItemLink key={item.id} href={`#/choice/${item.id}`} title={item.title} status={statusLabel(progress.choice[item.id]?.status)} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="chapter-tickets" className="space-y-3">
        <h2 id="chapter-tickets" className="text-lg font-semibold text-slate-900">
          Tickets: write, fix, and structure
        </h2>
        <ul className="space-y-2">
          {chapter.graded.map((spec) => (
            <ItemLink key={spec.id} href={`#/ticket/${spec.id}`} title={spec.title} status={statusLabel(challenges[spec.id]?.status)} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="chapter-boss" className="space-y-3">
        <h2 id="chapter-boss" className="text-lg font-semibold text-slate-900">
          Boss
        </h2>
        <ul className="space-y-2">
          <ItemLink href={bossHref(chapter.id)} title={`${chapter.bossTitle} (${chapter.boss.length} parts)`} status={bossDone ? 'Passed' : `${bossCount} of ${chapter.boss.length}`} />
        </ul>
      </section>

    </article>
  );
}
