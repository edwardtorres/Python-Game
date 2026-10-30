import { type ChallengeProgress, type SaveV1, CURRENT_SCHEMA, emptyProgress, emptySave } from './schema';

export interface MigrationResult {
  save: SaveV1;
  notice: string | null;
  // Set when a save from a newer version was found. The raw text is kept under this key.
  backupReason: 'newer-schema' | 'unreadable' | null;
}

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

// v0 is the legacy shape: no schema field, and progress entries of { attempts, passed }.
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
};

function coerceProgress(value: unknown): ChallengeProgress {
  const base = emptyProgress();
  if (typeof value !== 'object' || value === null) return base;
  const entry = value as Record<string, unknown>;
  const status = entry.status === 'passed' || entry.status === 'attempted' ? entry.status : 'not-started';
  const tier = typeof entry.hintTier === 'number' && entry.hintTier >= 0 && entry.hintTier <= 3 ? Math.floor(entry.hintTier) : 0;
  return {
    status,
    attempts: typeof entry.attempts === 'number' && entry.attempts >= 0 ? Math.floor(entry.attempts) : 0,
    hintTier: tier as 0 | 1 | 2 | 3,
    solutionRevealed: entry.solutionRevealed === true,
    lastCode: typeof entry.lastCode === 'string' ? entry.lastCode : '',
    cells: Array.isArray(entry.cells) ? entry.cells.filter((cell): cell is string => typeof cell === 'string').slice(0, 60) : [],
    passedAt: typeof entry.passedAt === 'string' ? entry.passedAt : null,
  };
}

function toV1(raw: Record<string, unknown>): SaveV1 {
  const player = (raw.player ?? {}) as Record<string, unknown>;
  const challenges: Record<string, ChallengeProgress> = {};
  for (const [id, value] of Object.entries((raw.challenges ?? {}) as Record<string, unknown>)) {
    challenges[id] = coerceProgress(value);
  }
  return {
    schema: 1,
    player: {
      name: typeof player.name === 'string' && player.name.trim() !== '' ? player.name.slice(0, 40) : 'Analyst',
      rank: 'analytics-intern',
    },
    challenges,
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
  return { save: toV1(raw), notice: null, backupReason: null };
}
