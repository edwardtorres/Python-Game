// Save schema, version 2. Every stored save has a `schema` number. Migrations in
// migrate.ts bring older saves up to the current version. A save from a newer version
// is never overwritten: it is kept as a backup and the learner starts fresh.
//
// Version 2 adds the chapter progress (lessons read, and choice items) and the mistakes
// each challenge has shown. A version 1 save keeps its challenges unchanged.

export const CURRENT_SCHEMA = 2;
export const SAVE_KEY = 'larkspur.save';

export type ChallengeStatus = 'not-started' | 'attempted' | 'passed';
export type HintTier = 0 | 1 | 2 | 3;

export interface ChallengeProgress {
  status: ChallengeStatus;
  attempts: number;
  hintTier: HintTier;
  solutionRevealed: boolean;
  lastCode: string;
  // Notebook challenges keep their cells here, in order. Empty for editor challenges.
  cells: string[];
  passedAt: string | null;
  // Mistake tags the learner's submissions matched, in the order first seen.
  mistakesSeen: string[];
}

// A predict or traceback item. The learner picks one option; a wrong pick shows its mistake.
export interface ChoiceProgress {
  status: ChallengeStatus;
  attempts: number;
  hintTier: HintTier;
  solutionRevealed: boolean;
  mistakesSeen: string[];
}

export interface ChapterProgress {
  // Lesson ids the learner has marked as read.
  lessonsRead: string[];
  choice: Record<string, ChoiceProgress>;
}

export interface SaveV2 {
  schema: 2;
  player: { name: string; rank: 'analytics-intern' };
  challenges: Record<string, ChallengeProgress>;
  chapters: Record<string, ChapterProgress>;
  updatedAt: string;
}

export function emptyProgress(): ChallengeProgress {
  return { status: 'not-started', attempts: 0, hintTier: 0, solutionRevealed: false, lastCode: '', cells: [], passedAt: null, mistakesSeen: [] };
}

export function emptyChoice(): ChoiceProgress {
  return { status: 'not-started', attempts: 0, hintTier: 0, solutionRevealed: false, mistakesSeen: [] };
}

export function emptyChapter(): ChapterProgress {
  return { lessonsRead: [], choice: {} };
}

export function emptySave(now: string): SaveV2 {
  return { schema: 2, player: { name: 'Analyst', rank: 'analytics-intern' }, challenges: {}, chapters: {}, updatedAt: now };
}
