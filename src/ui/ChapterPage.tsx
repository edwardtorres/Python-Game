import type { ChallengeSpec } from '../challenges/types';
import { CHAPTER1_BOSS, CHAPTER1_CHOICE, CHAPTER1_GRADED, CHAPTER1_LESSONS } from '../content/chapter1/index';
import type { ChallengeProgress, ChoiceProgress } from '../save/schema';

interface ChapterPageProps {
  lessonsRead: string[];
  choice: Record<string, ChoiceProgress | undefined>;
  challenges: Record<string, ChallengeProgress | undefined>;
}

function bossPassed(challenges: Record<string, ChallengeProgress | undefined>): boolean {
  return CHAPTER1_BOSS.every((part) => challenges[part.id]?.status === 'passed');
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

export function ChapterPage({ lessonsRead, choice, challenges }: ChapterPageProps) {
  const itemsDone = CHAPTER1_CHOICE.filter((item) => choice[item.id]?.status === 'passed').length + CHAPTER1_GRADED.filter((spec: ChallengeSpec) => challenges[spec.id]?.status === 'passed').length + (bossPassed(challenges) ? 1 : 0);
  const itemsTotal = CHAPTER1_CHOICE.length + CHAPTER1_GRADED.length + 1;
  const bossCount = CHAPTER1_BOSS.filter((part) => challenges[part.id]?.status === 'passed').length;

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Chapter 1</p>
        <h1 className="text-2xl font-semibold text-slate-900">Foundations refresh</h1>
        <p className="text-sm leading-6 text-slate-800">
          Thirteen short lessons, then practice items and a boss. Each lesson has examples you can edit and run. Your progress is saved in this browser.
        </p>
        <p role="status" className="text-sm text-slate-700">
          Lessons read: {lessonsRead.length} of {CHAPTER1_LESSONS.length}. Items passed: {itemsDone} of {itemsTotal}. Boss parts passed: {bossCount} of {CHAPTER1_BOSS.length}.
        </p>
      </header>

      <section aria-labelledby="chapter-lessons" className="space-y-3">
        <h2 id="chapter-lessons" className="text-lg font-semibold text-slate-900">
          Lessons
        </h2>
        <ul className="space-y-2">
          {CHAPTER1_LESSONS.map((lesson) => (
            <ItemLink
              key={lesson.id}
              href={`#/lesson/${lesson.id}`}
              title={`${lesson.number}. ${lesson.title}`}
              status={lessonsRead.includes(lesson.id) ? 'Read' : 'New'}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby="chapter-practice" className="space-y-3">
        <h2 id="chapter-practice" className="text-lg font-semibold text-slate-900">
          Practice: predict and read tracebacks
        </h2>
        <ul className="space-y-2">
          {CHAPTER1_CHOICE.map((item) => (
            <ItemLink key={item.id} href={`#/choice/${item.id}`} title={item.title} status={statusLabel(choice[item.id]?.status)} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="chapter-tickets" className="space-y-3">
        <h2 id="chapter-tickets" className="text-lg font-semibold text-slate-900">
          Tickets: write, fix, and structure
        </h2>
        <ul className="space-y-2">
          {CHAPTER1_GRADED.map((spec) => (
            <ItemLink key={spec.id} href={`#/ticket/${spec.id}`} title={spec.title} status={statusLabel(challenges[spec.id]?.status)} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="chapter-boss" className="space-y-3">
        <h2 id="chapter-boss" className="text-lg font-semibold text-slate-900">
          Boss
        </h2>
        <ul className="space-y-2">
          <ItemLink href="#/boss" title="The weekly word report (four parts)" status={bossPassed(challenges) ? 'Passed' : `${bossCount} of 4`} />
        </ul>
      </section>

    </article>
  );
}
