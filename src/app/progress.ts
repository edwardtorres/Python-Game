// Pure progress rules, kept out of the UI so they can be tested directly.
import { type ChallengeProgress, emptyProgress } from '../save/schema';
import type { GradeResult } from '../engine/types';

export const SOLUTION_UNLOCK_ATTEMPTS = 3;

export function applySubmission(progress: ChallengeProgress, result: GradeResult, now: string, code: string): ChallengeProgress {
  const passed = result.status === 'pass';
  return {
    ...progress,
    lastCode: code,
    attempts: passed ? progress.attempts : progress.attempts + 1,
    status: passed ? 'passed' : progress.status === 'passed' ? 'passed' : 'attempted',
    passedAt: passed && progress.passedAt === null ? now : progress.passedAt,
  };
}

export function applyRun(progress: ChallengeProgress, code: string): ChallengeProgress {
  return { ...progress, lastCode: code, status: progress.status === 'not-started' ? 'attempted' : progress.status };
}

export function revealHint(progress: ChallengeProgress): ChallengeProgress {
  return { ...progress, hintTier: Math.min(3, progress.hintTier + 1) as 0 | 1 | 2 | 3 };
}

export function revealSolution(progress: ChallengeProgress): ChallengeProgress {
  return { ...progress, solutionRevealed: true };
}

export function canRevealSolution(progress: ChallengeProgress): boolean {
  return progress.attempts >= SOLUTION_UNLOCK_ATTEMPTS || progress.solutionRevealed;
}

// Credit is full only when the learner passed without seeing the solution.
// Revealed solutions earn reduced credit and never count toward mastery.
export function creditFor(progress: ChallengeProgress): 'none' | 'full' | 'reduced' {
  if (progress.status !== 'passed') return 'none';
  return progress.solutionRevealed ? 'reduced' : 'full';
}

export { emptyProgress };
