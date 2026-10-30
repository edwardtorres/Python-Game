import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserEngine } from '../engine/browserEngine';
import type { EngineStatus } from '../engine/client';
import { CHALLENGES, getChallenge } from '../challenges/registry';
import { CURRICULUM } from '../curriculum/data';
import { browserStorage, createSaveStore } from '../save/store';
import { type ChallengeProgress, type SaveV1, emptyProgress } from '../save/schema';
import { installTestBridge, readTestHooks } from '../dev/testHooks';
import { ChallengeView } from '../ui/ChallengeView';
import { Sidebar } from '../ui/Sidebar';

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
  const [save, setSave] = useState<SaveV1>(initial.save);
  const [globalNotice, setGlobalNotice] = useState<string | null>(initial.notice);
  const [selectedId, setSelectedId] = useState(CHALLENGES[0]?.id ?? '');
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('idle');
  const engine = useMemo(() => createBrowserEngine(setEngineStatus, hooks), [hooks]);

  const onProgress = useCallback((id: string, change: (current: ChallengeProgress) => ChallengeProgress) => {
    setSave((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      challenges: { ...current.challenges, [id]: change(current.challenges[id] ?? emptyProgress()) },
    }));
  }, []);

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

  const spec = getChallenge(selectedId);
  const progressById = save.challenges;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Larkspur Freight Analytics</p>
            <p className="text-sm text-slate-700">Analytics Intern</p>
          </div>
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
    </div>
  );
}
