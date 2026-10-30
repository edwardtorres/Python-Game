import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { PyRuntime } from '../engine/runtime';
import { CHALLENGES } from './registry';
import { buildGradeRequest, type GradeMode } from './payload';
import type { ChallengeSpec } from './types';

let runtime: PyRuntime;

beforeAll(async () => {
  runtime = new PyRuntime({
    indexURL: `${path.resolve('public/pyodide')}/`,
    loadModule: async () => (await import('pyodide')) as never,
  });
  await runtime.init();
  await runtime.loadPackages(['pandas', 'matplotlib']);
}, 240_000);

function grade(spec: ChallengeSpec, learner: string, mode: GradeMode) {
  const { payload, datasets } = buildGradeRequest(spec, learner, mode);
  return runtime.grade(JSON.stringify(payload), JSON.stringify(datasets));
}

describe.each(CHALLENGES)('$title', (spec) => {
  it('the reference passes every visible and hidden case', () => {
    const result = grade(spec, spec.reference, 'submit');
    expect(result.status, JSON.stringify(result.cases.filter((c) => !c.ok))).toBe('pass');
    expect(result.passed).toBe(result.total);
  }, 120_000);

  it('gives the same result when run twice (randomness is reseeded)', () => {
    const first = grade(spec, spec.reference, 'submit');
    const second = grade(spec, spec.reference, 'submit');
    expect(second).toEqual(first);
  }, 120_000);

  it('has a wrong variant for every stated rule', () => {
    const covered = new Set(Object.values(spec.variantRule));
    spec.rules.forEach((_, index) => {
      expect(covered.has(index), `no variant breaks rule ${index + 1}`).toBe(true);
    });
  });

  it('maps every variant to one rule, and every mapped rule exists', () => {
    for (const variant of spec.variants) {
      const rule = spec.variantRule[variant.id];
      expect(rule, `variant ${variant.id} has no rule`).toBeDefined();
      expect(rule).toBeGreaterThanOrEqual(0);
      expect(rule).toBeLessThan(spec.rules.length);
    }
    expect(Object.keys(spec.variantRule).sort()).toEqual(spec.variants.map((v) => v.id).sort());
  });

  it('has at least two wrong variants, each with a mistake tag', () => {
    expect(spec.variants.length).toBeGreaterThanOrEqual(2);
    for (const variant of spec.variants) expect(variant.mistake.tag).not.toBe('');
  });

  it.each(CHALLENGES.flatMap((challenge) => challenge.variants.map((variant) => [challenge.id, variant.id] as const)).filter(([id]) => id === spec.id).map(([, variantId]) => variantId))(
    'variant %s is caught by at least two cases',
    (variantId) => {
      const variant = spec.variants.find((v) => v.id === variantId);
      expect(variant).toBeDefined();
      const result = grade(spec, variant?.code ?? '', 'submit');
      expect(result.status).toBe('fail');
      expect(result.cases.filter((c) => !c.ok).length).toBeGreaterThanOrEqual(2);
    },
    120_000,
  );

  it('has at least one wrong variant that fails on the visible data', () => {
    const failing = spec.variants.filter((variant) => grade(spec, variant.code, 'run').status === 'fail');
    expect(failing.length).toBeGreaterThan(0);
  }, 240_000);

  it('names the matching mistake when a learner submits a wrong variant', () => {
    for (const variant of spec.variants) {
      const result = grade(spec, variant.code, 'submit');
      expect(result.matched.map((m) => m.variantId), variant.id).toContain(variant.id);
      const explained = result.matched.find((m) => m.variantId === variant.id);
      expect(explained?.tag).toBe(variant.mistake.tag);
    }
  }, 240_000);

  it('never reveals hidden case inputs or expected values in messages', () => {
    for (const variant of spec.variants) {
      const result = grade(spec, variant.code, 'submit');
      for (const caseResult of result.cases) {
        if (caseResult.visibility === 'hidden') expect(caseResult.message).not.toMatch(/expected|got /i);
      }
    }
  }, 240_000);

  it('a Run sends and grades only visible data', () => {
    const { payload, datasets } = buildGradeRequest(spec, spec.reference, 'run');
    expect(payload.cases.length).toBe(spec.cases.length);
    const hidden = spec.datasets.filter((d) => d.visibility === 'hidden').map((d) => d.name);
    for (const name of hidden) expect(datasets[name]).toBeUndefined();
    const result = grade(spec, spec.reference, 'run');
    expect(result.total).toBe(spec.cases.filter((c) => c.visibility === 'visible').length);
  }, 120_000);
});
