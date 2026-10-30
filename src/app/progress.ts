// Pure progress rules, kept out of the UI so they can be tested directly.
import { type ChallengeProgress, type ChoiceProgress, type HintTier, emptyProgress } from '../save/schema';
import type { GradeResult } from '../engine/types';

export const SOLUTION_UNLOCK_ATTEMPTS = 3;

// Adds each mistake the submission matched, once, in the order the learner first saw it.
export function withMistakes(seen: string[], result: GradeResult): string[] {
  const tags = result.matched.map((mistake) => mistake.tag);
  return [...seen, ...tags.filter((tag, index) => !seen.includes(tag) && tags.indexOf(tag) === index)];
}

export function applySubmission(progress: ChallengeProgress, result: GradeResult, now: string, code: string): ChallengeProgress {
  const passed = result.status === 'pass';
  return {
    ...progress,
    lastCode: code,
    attempts: passed ? progress.attempts : progress.attempts + 1,
    status: passed ? 'passed' : progress.status === 'passed' ? 'passed' : 'attempted',
    passedAt: passed && progress.passedAt === null ? now : progress.passedAt,
    mistakesSeen: withMistakes(progress.mistakesSeen, result),
  };
}

// A choice item: a right pick passes it, and a wrong pick counts as an attempt and shows
// its mistake. Three wrong picks unlock the answer, as three failed submissions do.
export function applyChoice(progress: ChoiceProgress, picked: { correct: boolean; mistake: string | null }): ChoiceProgress {
  if (picked.correct) return { ...progress, status: 'passed' };
  const mistakesSeen = picked.mistake === null || progress.mistakesSeen.includes(picked.mistake) ? progress.mistakesSeen : [...progress.mistakesSeen, picked.mistake];
  return { ...progress, attempts: progress.attempts + 1, status: progress.status === 'passed' ? 'passed' : 'attempted', mistakesSeen };
}

export function applyRun(progress: ChallengeProgress, code: string): ChallengeProgress {
  return { ...progress, lastCode: code, status: progress.status === 'not-started' ? 'attempted' : progress.status };
}

export function revealHint<T extends { hintTier: HintTier }>(progress: T): T {
  return { ...progress, hintTier: Math.min(3, progress.hintTier + 1) as HintTier };
}

export function revealSolution<T extends { solutionRevealed: boolean }>(progress: T): T {
  return { ...progress, solutionRevealed: true };
}

export function canRevealSolution(progress: { attempts: number; solutionRevealed: boolean }): boolean {
  return progress.attempts >= SOLUTION_UNLOCK_ATTEMPTS || progress.solutionRevealed;
}

// Credit is full only when the learner passed without seeing the solution.
// Revealed solutions earn reduced credit and never count toward mastery.
export function creditFor(progress: ChallengeProgress): 'none' | 'full' | 'reduced' {
  if (progress.status !== 'passed') return 'none';
  return progress.solutionRevealed ? 'reduced' : 'full';
}

export { emptyProgress };
