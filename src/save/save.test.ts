import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { migrateSave } from './migrate';
import { createSaveStore, type StorageLike } from './store';
import { CURRENT_SCHEMA, SAVE_KEY, emptyChapter, emptyChoice, emptyProgress, emptySave } from './schema';

const NOW = '2026-10-30T12:00:00.000Z';
const FIXTURE_V1 = path.resolve('e2e/fixtures/save-v1.json');

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('save schema v2', () => {
  it('is version 2 and starts empty, with chapter progress', () => {
    expect(CURRENT_SCHEMA).toBe(2);
    expect(emptySave(NOW)).toEqual({ schema: 2, player: { name: 'Analyst', rank: 'analytics-intern' }, challenges: {}, chapters: {}, updatedAt: NOW });
    expect(emptyProgress().status).toBe('not-started');
    expect(emptyProgress().mistakesSeen).toEqual([]);
    expect(emptyChoice()).toEqual({ status: 'not-started', attempts: 0, hintTier: 0, solutionRevealed: false, mistakesSeen: [] });
    expect(emptyChapter()).toEqual({ lessonsRead: [], choice: {} });
  });
});

describe('migrations', () => {
  it('starts fresh when nothing is stored', () => {
    const result = migrateSave(null, NOW);
    expect(result.save.schema).toBe(2);
    expect(result.notice).toBeNull();
  });

  it('upgrades the legacy v0 shape to the current schema', () => {
    const legacy = JSON.stringify({ progress: { 'clean-weights': { attempts: 3, passed: true }, 'churn-by-region': { attempts: 1 } } });
    const result = migrateSave(legacy, NOW);
    expect(result.save.schema).toBe(2);
    expect(result.save.challenges['clean-weights']?.status).toBe('passed');
    expect(result.save.challenges['clean-weights']?.attempts).toBe(3);
    expect(result.save.challenges['churn-by-region']?.status).toBe('attempted');
    expect(result.save.challenges['churn-by-region']?.hintTier).toBe(0);
    expect(result.save.chapters).toEqual({});
  });

  it('migrates a real version 1 save from the app, keeping its challenges unchanged', () => {
    const text = fs.readFileSync(FIXTURE_V1, 'utf8');
    const v1 = JSON.parse(text) as { schema: number; challenges: Record<string, Record<string, unknown>> };
    expect(v1.schema).toBe(1);
    const result = migrateSave(text, NOW);
    expect(result.notice).toBeNull();
    expect(result.save.schema).toBe(2);
    expect(result.save.chapters).toEqual({});
    for (const [id, progress] of Object.entries(v1.challenges)) {
      expect(result.save.challenges[id], id).toEqual({ ...progress, mistakesSeen: [] });
    }
    expect(Object.keys(result.save.challenges).sort()).toEqual(Object.keys(v1.challenges).sort());
  });

  it('keeps a v1 save and repairs bad fields', () => {
    const damaged = JSON.stringify({
      schema: 1,
      player: { name: 42 },
      challenges: { x: { status: 'bogus', attempts: -4, hintTier: 9, solutionRevealed: 'yes', lastCode: 12 } },
      updatedAt: NOW,
    });
    const { save } = migrateSave(damaged, NOW);
    expect(save.player.name).toBe('Analyst');
    expect(save.challenges.x).toEqual({ status: 'not-started', attempts: 0, hintTier: 0, solutionRevealed: false, lastCode: '', cells: [], passedAt: null, mistakesSeen: [] });
  });

  it('repairs chapter progress that is damaged', () => {
    const damaged = JSON.stringify({ schema: 2, challenges: {}, chapters: { 'c01-foundations': { lessonsRead: ['a', 3], choice: { p: { status: 'bogus', attempts: 2, hintTier: 7 } } } } });
    const { save } = migrateSave(damaged, NOW);
    expect(save.chapters['c01-foundations']).toEqual({
      lessonsRead: ['a'],
      choice: { p: { status: 'not-started', attempts: 2, hintTier: 0, solutionRevealed: false, mistakesSeen: [] } },
    });
  });

  it('keeps a newer save as a backup and starts fresh', () => {
    const newer = JSON.stringify({ schema: 3, challenges: {} });
    const result = migrateSave(newer, NOW);
    expect(result.backupReason).toBe('newer-schema');
    expect(result.save.schema).toBe(2);
    expect(result.notice).toContain('newer version');
  });

  it('starts fresh with a notice for unreadable text', () => {
    const result = migrateSave('{not json', NOW);
    expect(result.backupReason).toBe('unreadable');
    expect(result.save.challenges).toEqual({});
  });
});

describe('save store', () => {
  it('round-trips a save through storage', () => {
    const storage = memoryStorage();
    const store = createSaveStore(storage);
    const save = emptySave(NOW);
    save.challenges['clean-weights'] = { ...emptyProgress(), status: 'passed', attempts: 2 };
    expect(store.write(save).ok).toBe(true);
    const loaded = store.load(NOW);
    expect(loaded.save.challenges['clean-weights']?.status).toBe('passed');
    expect(loaded.persistent).toBe(true);
  });

  it('keeps a backup when it finds an unreadable save', () => {
    const storage = memoryStorage({ [SAVE_KEY]: 'oops' });
    createSaveStore(storage).load(NOW);
    expect(storage.data.get(`${SAVE_KEY}.backup`)).toBe('oops');
  });

  it('works without storage and reports that progress will not persist', () => {
    const store = createSaveStore(null);
    expect(store.load(NOW).persistent).toBe(false);
    expect(store.write(emptySave(NOW)).ok).toBe(false);
  });

  it('survives storage that throws on access', () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    const store = createSaveStore(throwing);
    const loaded = store.load(NOW);
    expect(loaded.persistent).toBe(false);
    expect(loaded.notice).toContain('cannot be saved');
    expect(store.write(emptySave(NOW)).ok).toBe(false);
  });
});
