import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserEngine } from '../engine/browserEngine';
import type { EngineStatus } from '../engine/client';
import { CHALLENGES, getChallenge } from '../challenges/registry';
import { CURRICULUM } from '../curriculum/data';
import { CHAPTERS, chapterOf, findChapter, findChoice, findLesson, findTicket } from '../content/chapters';
import { browserStorage, createSaveStore } from '../save/store';
import { type ChallengeProgress, type ChapterProgress, type ChoiceProgress, type SaveV2, emptyChapter, emptyChoice, emptyProgress } from '../save/schema';
import { installTestBridge, readTestHooks } from '../dev/testHooks';
import { BossView } from '../ui/BossView';
import { ChallengeView } from '../ui/ChallengeView';
import { ChapterPage } from '../ui/ChapterPage';
import { ChoiceView } from '../ui/ChoiceView';
import { LessonView } from '../ui/LessonView';
import { Sidebar } from '../ui/Sidebar';
import { type Route, chapterHref, useRoute } from '../ui/routes';

const STATUS_LABEL: Record<EngineStatus, string> = {
  idle: 'Python not started',
  starting: 'Starting Python…',
  ready: 'Python ready',
  running: 'Running…',
  error: 'Python unavailable',
};

export function App() {
  const hooks = useMemo(() => readTestHooks(window.location.search), []);
  const store = useMemo(() => createSaveStore(browserStorage()), []);
  const initial = useMemo(() => store.load(new Date().toISOString()), [store]);
  const [save, setSave] = useState<SaveV2>(initial.save);
  const [globalNotice, setGlobalNotice] = useState<string | null>(initial.notice);
  const [selectedId, setSelectedId] = useState(CHALLENGES[0]?.id ?? '');
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('idle');
  const engine = useMemo(() => createBrowserEngine(setEngineStatus, hooks), [hooks]);
  const route = useRoute();

  const onProgress = useCallback((id: string, change: (current: ChallengeProgress) => ChallengeProgress) => {
    setSave((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      challenges: { ...current.challenges, [id]: change(current.challenges[id] ?? emptyProgress()) },
    }));
  }, []);

  const onChapterProgress = useCallback((chapterId: string, change: (current: ChapterProgress) => ChapterProgress) => {
    setSave((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      chapters: { ...current.chapters, [chapterId]: change(current.chapters[chapterId] ?? emptyChapter()) },
    }));
  }, []);

  const onChoiceProgress = useCallback(
    (chapterId: string, itemId: string, change: (current: ChoiceProgress) => ChoiceProgress) => {
      onChapterProgress(chapterId, (chapter) => ({
        ...chapter,
        choice: { ...chapter.choice, [itemId]: change(chapter.choice[itemId] ?? emptyChoice()) },
      }));
    },
    [onChapterProgress],
  );

  useEffect(() => {
    if (!initial.persistent) return undefined;
    const timer = window.setTimeout(() => {
      store.write(save);
    }, 250);
    return () => {
      window.clearTimeout(timer);
    };
  }, [save, store, initial.persistent]);

  useEffect(() => {
    installTestBridge({
      setCode: (id, code) => onProgress(id, (current) => ({ ...current, lastCode: code })),
      setCell: (id, index, code) =>
        onProgress(id, (current) => ({ ...current, cells: current.cells.map((cell, position) => (position === index ? code : cell)) })),
      addCell: (id) => onProgress(id, (current) => ({ ...current, cells: [...current.cells, ''] })),
      status: () => {
        const stats = engine.getStats();
        return { engine: engineStatus, restarts: stats.restarts, lastWasmBytes: stats.lastWasmBytes, workerStarts: stats.workerStarts };
      },
    });
  }, [engine, engineStatus, onProgress]);

  const progressById = save.challenges;

  function renderRoute(current: Route): ReactNode {
    if (current.kind === 'chapter') {
      const chapter = findChapter(current.id);
      if (chapter === undefined) return <p>There is no chapter with that name. Go back to the tickets.</p>;
      return <ChapterPage chapter={chapter} progress={save.chapters[chapter.id] ?? emptyChapter()} challenges={progressById} />;
    }
    if (current.kind === 'lesson') {
      const found = findLesson(current.id);
      if (found === undefined) return <p>There is no lesson with that name. Go back to the chapter.</p>;
      const { chapter, item: lesson } = found;
      const chapterProgress = save.chapters[chapter.id] ?? emptyChapter();
      return (
        <LessonView
          lesson={lesson}
          read={chapterProgress.lessonsRead.includes(lesson.id)}
          engine={engine}
          engineStatus={engineStatus}
          onToggleRead={(nowRead) =>
            onChapterProgress(chapter.id, (state) => ({
              ...state,
              lessonsRead: nowRead ? [...state.lessonsRead.filter((id) => id !== lesson.id), lesson.id] : state.lessonsRead.filter((id) => id !== lesson.id),
            }))
          }
        />
      );
    }
    if (current.kind === 'choice') {
      const found = findChoice(current.id);
      if (found === undefined) return <p>There is no practice item with that name.</p>;
      const { chapter, item } = found;
      const output = chapter.outputs.choice[item.id];
      if (output === undefined) return <p>There is no recorded output for that practice item.</p>;
      return (
        <ChoiceView
          key={item.id}
          item={item}
          output={output}
          progress={save.chapters[chapter.id]?.choice[item.id] ?? emptyChoice()}
          engine={engine}
          engineStatus={engineStatus}
          onProgress={(change) => onChoiceProgress(chapter.id, item.id, change)}
        />
      );
    }
    if (current.kind === 'ticket') {
      const found = findTicket(current.id);
      if (found === undefined) return <p>There is no ticket with that name.</p>;
      const spec = found.item;
      return (
        <ChallengeView
          key={spec.id}
          spec={spec}
          progress={progressById[spec.id] ?? emptyProgress()}
          engine={engine}
          engineStatus={engineStatus}
          onProgress={(change) => onProgress(spec.id, change)}
          onGlobalNotice={setGlobalNotice}
        />
      );
    }
    if (current.kind === 'boss') {
      const chapter = findChapter(current.id);
      if (chapter === undefined) return <p>There is no boss with that name.</p>;
      return <BossView chapter={chapter} challenges={progressById} engine={engine} engineStatus={engineStatus} onProgress={onProgress} onGlobalNotice={setGlobalNotice} />;
    }
    return null;
  }

  const spec = getChallenge(selectedId);
  const onTickets = route.kind === 'tickets';
  const activeChapterId = route.kind === 'tickets' ? undefined : route.kind === 'chapter' || route.kind === 'boss' ? route.id : chapterOf(route.id)?.id;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Larkspur Freight Analytics</p>
            <p className="text-sm text-slate-700">Analytics Intern</p>
          </div>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-2 text-sm">
            <a href="#/" aria-current={onTickets ? 'page' : undefined} className="flex min-h-11 items-center rounded-md px-3 text-slate-800 hover:bg-slate-100">
              Tickets
            </a>
            {CHAPTERS.map((chapter) => (
              <a
                key={chapter.id}
                href={chapterHref(chapter.id)}
                aria-current={chapter.id === activeChapterId ? 'page' : undefined}
                className="flex min-h-11 items-center rounded-md px-3 text-slate-800 hover:bg-slate-100"
              >
                Chapter {chapter.number}
              </a>
            ))}
          </nav>
          <p role="status" aria-live="polite" className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {STATUS_LABEL[engineStatus]}
          </p>
        </div>
      </header>

      {globalNotice !== null && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <p role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            {globalNotice}
          </p>
        </div>
      )}

      {onTickets ? (
        <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[17rem_minmax(0,1fr)]">
          <Sidebar challenges={CHALLENGES} chapters={CURRICULUM.chapters} selectedId={selectedId} progress={progressById} onSelect={setSelectedId} />
          <main id="main" className="min-w-0">
            {spec !== undefined ? (
              <ChallengeView
                key={spec.id}
                spec={spec}
                progress={progressById[spec.id] ?? emptyProgress()}
                engine={engine}
                engineStatus={engineStatus}
                onProgress={(change) => onProgress(spec.id, change)}
                onGlobalNotice={setGlobalNotice}
              />
            ) : (
              <p>No ticket is selected.</p>
            )}
          </main>
        </div>
      ) : (
        <main id="main" className="mx-auto max-w-4xl min-w-0 p-4">
          {renderRoute(route)}
        </main>
      )}
    </div>
  );
}
