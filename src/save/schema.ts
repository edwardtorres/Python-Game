// Save schema, version 1. Every stored save has a `schema` number. Migrations in
// migrate.ts bring older saves up to the current version. A save from a newer version
// is never overwritten: it is kept as a backup and the learner starts fresh.

export const CURRENT_SCHEMA = 1;
export const SAVE_KEY = 'larkspur.save';

export type ChallengeStatus = 'not-started' | 'attempted' | 'passed';

export interface ChallengeProgress {
  status: ChallengeStatus;
  attempts: number;
  hintTier: 0 | 1 | 2 | 3;
  solutionRevealed: boolean;
  lastCode: string;
  // Notebook challenges keep their cells here, in order. Empty for editor challenges.
  cells: string[];
  passedAt: string | null;
}

export interface SaveV1 {
  schema: 1;
  player: { name: string; rank: 'analytics-intern' };
  challenges: Record<string, ChallengeProgress>;
  updatedAt: string;
}

export function emptyProgress(): ChallengeProgress {
  return { status: 'not-started', attempts: 0, hintTier: 0, solutionRevealed: false, lastCode: '', cells: [], passedAt: null };
}

export function emptySave(now: string): SaveV1 {
  return { schema: 1, player: { name: 'Analyst', rank: 'analytics-intern' }, challenges: {}, updatedAt: now };
}
