import {
  type ChallengeProgress,
  type ChapterProgress,
  type ChoiceProgress,
  type HintTier,
  type SaveV2,
  CURRENT_SCHEMA,
  emptyChapter,
  emptyChoice,
  emptyProgress,
  emptySave,
} from './schema';

export interface MigrationResult {
  save: SaveV2;
  notice: string | null;
  // Set when a save from a newer version was found. The raw text is kept under this key.
  backupReason: 'newer-schema' | 'unreadable' | null;
}

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

// v0 is the legacy shape: no schema field, and progress entries of { attempts, passed }.
// v1 has no chapter progress. Version 2 copies v1 challenges unchanged and adds no chapters.
const MIGRATIONS: Record<number, Migration> = {
  0: (raw) => {
    const legacy = (raw.progress ?? {}) as Record<string, { attempts?: unknown; passed?: unknown }>;
    const challenges: Record<string, Record<string, unknown>> = {};
    for (const [id, entry] of Object.entries(legacy)) {
      challenges[id] = {
        status: entry.passed === true ? 'passed' : 'attempted',
        attempts: typeof entry.attempts === 'number' ? entry.attempts : 0,
      };
    }
    return { schema: 1, player: { name: 'Analyst', rank: 'analytics-intern' }, challenges, updatedAt: raw.updatedAt ?? '' };
  },
  1: (raw) => ({ ...raw, schema: 2, chapters: {} }),
};

function tierOf(value: unknown): HintTier {
  return typeof value === 'number' && value >= 0 && value <= 3 ? (Math.floor(value) as HintTier) : 0;
}

function strings(value: unknown, limit: number): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, limit) : [];
}

function coerceProgress(value: unknown): ChallengeProgress {
  const base = emptyProgress();
  if (typeof value !== 'object' || value === null) return base;
  const entry = value as Record<string, unknown>;
  const status = entry.status === 'passed' || entry.status === 'attempted' ? entry.status : 'not-started';
  return {
    status,
    attempts: typeof entry.attempts === 'number' && entry.attempts >= 0 ? Math.floor(entry.attempts) : 0,
    hintTier: tierOf(entry.hintTier),
    solutionRevealed: entry.solutionRevealed === true,
    lastCode: typeof entry.lastCode === 'string' ? entry.lastCode : '',
    cells: strings(entry.cells, 60),
    passedAt: typeof entry.passedAt === 'string' ? entry.passedAt : null,
    mistakesSeen: strings(entry.mistakesSeen, 40),
  };
}

function coerceChoice(value: unknown): ChoiceProgress {
  const base = emptyChoice();
  if (typeof value !== 'object' || value === null) return base;
  const entry = value as Record<string, unknown>;
  return {
    status: entry.status === 'passed' || entry.status === 'attempted' ? entry.status : 'not-started',
    attempts: typeof entry.attempts === 'number' && entry.attempts >= 0 ? Math.floor(entry.attempts) : 0,
    hintTier: tierOf(entry.hintTier),
    solutionRevealed: entry.solutionRevealed === true,
    mistakesSeen: strings(entry.mistakesSeen, 40),
  };
}

function coerceChapter(value: unknown): ChapterProgress {
  if (typeof value !== 'object' || value === null) return emptyChapter();
  const entry = value as Record<string, unknown>;
  const choice: Record<string, ChoiceProgress> = {};
  if (typeof entry.choice === 'object' && entry.choice !== null) {
    for (const [id, item] of Object.entries(entry.choice as Record<string, unknown>)) choice[id] = coerceChoice(item);
  }
  return { lessonsRead: strings(entry.lessonsRead, 60), choice };
}

function toCurrent(raw: Record<string, unknown>): SaveV2 {
  const player = (raw.player ?? {}) as Record<string, unknown>;
  const challenges: Record<string, ChallengeProgress> = {};
  for (const [id, value] of Object.entries((raw.challenges ?? {}) as Record<string, unknown>)) {
    challenges[id] = coerceProgress(value);
  }
  const chapters: Record<string, ChapterProgress> = {};
  for (const [id, value] of Object.entries((raw.chapters ?? {}) as Record<string, unknown>)) {
    chapters[id] = coerceChapter(value);
  }
  return {
    schema: 2,
    player: {
      name: typeof player.name === 'string' && player.name.trim() !== '' ? player.name.slice(0, 40) : 'Analyst',
      rank: 'analytics-intern',
    },
    challenges,
    chapters,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
}

// Parses a stored save and migrates it to the current schema. Never throws.
export function migrateSave(text: string | null, now: string): MigrationResult {
  if (text === null) return { save: emptySave(now), notice: null, backupReason: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { save: emptySave(now), notice: 'Your saved progress could not be read, so the game started fresh. A copy was kept.', backupReason: 'unreadable' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { save: emptySave(now), notice: 'Your saved progress could not be read, so the game started fresh. A copy was kept.', backupReason: 'unreadable' };
  }
  let raw = parsed as Record<string, unknown>;
  const version = typeof raw.schema === 'number' ? raw.schema : 0;
  if (version > CURRENT_SCHEMA) {
    return {
      save: emptySave(now),
      notice: 'Your saved progress is from a newer version of the game, so it was kept as a backup and the game started fresh.',
      backupReason: 'newer-schema',
    };
  }
  for (let from = version; from < CURRENT_SCHEMA; from += 1) {
    const migrate = MIGRATIONS[from];
    if (migrate === undefined) {
      return { save: emptySave(now), notice: 'Your saved progress could not be upgraded, so it was kept as a backup.', backupReason: 'unreadable' };
    }
    raw = migrate(raw);
  }
  return { save: toCurrent(raw), notice: null, backupReason: null };
}
