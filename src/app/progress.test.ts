import { describe, expect, it } from 'vitest';
import { applyRun, applySubmission, canRevealSolution, creditFor, revealHint, revealSolution, SOLUTION_UNLOCK_ATTEMPTS } from './progress';
import { emptyProgress } from '../save/schema';
import type { GradeResult } from '../engine/types';

const NOW = '2026-10-30T12:00:00.000Z';

function result(status: GradeResult['status']): GradeResult {
  return { status, error: null, cases: [], passed: 0, total: 0, matched: [] };
}

describe('submissions', () => {
  it('counts failed submissions and marks the challenge attempted', () => {
    const next = applySubmission(emptyProgress(), result('fail'), NOW, 'x = 1');
    expect(next.attempts).toBe(1);
    expect(next.status).toBe('attempted');
    expect(next.lastCode).toBe('x = 1');
  });

  it('passes once, records the time, and keeps it passed', () => {
    const passed = applySubmission(emptyProgress(), result('pass'), NOW, 'ok');
    expect(passed.status).toBe('passed');
    expect(passed.passedAt).toBe(NOW);
    const later = applySubmission(passed, result('fail'), '2030-01-01T00:00:00.000Z', 'changed');
    expect(later.status).toBe('passed');
    expect(later.passedAt).toBe(NOW);
  });

  it('does not count a pass as an attempt', () => {
    expect(applySubmission(emptyProgress(), result('pass'), NOW, 'ok').attempts).toBe(0);
  });
});

describe('solution unlock and credit', () => {
  it('unlocks the solution after three failed submissions', () => {
    let progress = emptyProgress();
    for (let index = 0; index < SOLUTION_UNLOCK_ATTEMPTS - 1; index += 1) {
      progress = applySubmission(progress, result('fail'), NOW, '');
    }
    expect(canRevealSolution(progress)).toBe(false);
    progress = applySubmission(progress, result('fail'), NOW, '');
    expect(canRevealSolution(progress)).toBe(true);
  });

  it('gives reduced credit when the solution was revealed before passing', () => {
    const passed = applySubmission(revealSolution(emptyProgress()), result('pass'), NOW, 'copied');
    expect(creditFor(passed)).toBe('reduced');
  });

  it('gives full credit for a clean pass and none before passing', () => {
    expect(creditFor(applySubmission(emptyProgress(), result('pass'), NOW, 'ok'))).toBe('full');
    expect(creditFor(emptyProgress())).toBe('none');
  });
});

describe('runs and hints', () => {
  it('marks a run as an attempt without changing a pass', () => {
    expect(applyRun(emptyProgress(), 'x').status).toBe('attempted');
    const passed = applySubmission(emptyProgress(), result('pass'), NOW, '');
    expect(applyRun(passed, 'y').status).toBe('passed');
  });

  it('caps hints at the third tier', () => {
    let progress = emptyProgress();
    for (let index = 0; index < 5; index += 1) progress = revealHint(progress);
    expect(progress.hintTier).toBe(3);
  });
});
