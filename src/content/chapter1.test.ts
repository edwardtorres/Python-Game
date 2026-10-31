// The Chapter 1 content check. It runs every example, option, and graded reference in
// Pyodide under Node. Set UPDATE_CONTENT=1 to rewrite generated/chapter1.outputs.json.
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildGradeRequest } from '../challenges/payload';
import type { ChallengeSpec } from '../challenges/types';
import { PyRuntime } from '../engine/runtime';
import type { GradeResult } from '../engine/types';
import { buildOutputs, type ChapterOutputs, runSnippet, serialise } from './chapter1/generate';
import { CHAPTER1_BOSS, CHAPTER1_CHOICE, CHAPTER1_GRADED, CHAPTER1_LESSONS } from './chapter1/index';
import { MISTAKES } from './mistakes';

const OUTPUTS = path.resolve('src/content/generated/chapter1.outputs.json');
const GRADED = [...CHAPTER1_GRADED, ...CHAPTER1_BOSS];

let runtime: PyRuntime;
let outputs: ChapterOutputs;

beforeAll(async () => {
  runtime = new PyRuntime({
    indexURL: `${path.resolve('public/pyodide')}/`,
    loadModule: async () => (await import('pyodide')) as never,
  });
  await runtime.init();
  outputs = buildOutputs(runtime);
  if (process.env.UPDATE_CONTENT === '1') {
    fs.mkdirSync(path.dirname(OUTPUTS), { recursive: true });
    fs.writeFileSync(OUTPUTS, serialise(outputs));
  }
}, 300_000);

function grade(spec: ChallengeSpec, learner: string, mode: 'run' | 'submit'): GradeResult {
  const { payload, datasets } = buildGradeRequest(spec, learner, mode);
  return runtime.grade(JSON.stringify(payload), JSON.stringify(datasets));
}

// Checks a starter with the ast module: a write task's starter is a bare `pass`.
function isSkeleton(code: string): boolean {
  const probe = `import ast\nSOURCE = ${JSON.stringify(code)}\ntree = ast.parse(SOURCE)\nfunction = tree.body[0]\nprint(all(isinstance(node, ast.Pass) for node in function.body))\n`;
  return runSnippet(runtime, `skeleton-${code.length}`, probe).stdout.trim() === 'True';
}

describe('lessons (source pass)', () => {
  it('the recorded example outputs match a fresh run', () => {
    const committed = JSON.parse(fs.readFileSync(OUTPUTS, 'utf8')) as ChapterOutputs;
    expect(committed).toEqual(outputs);
  });

  it('lessons are numbered 1 to 13 in competency order', () => {
    expect(CHAPTER1_LESSONS.map((lesson) => lesson.number)).toEqual(Array.from({ length: 13 }, (_, index) => index + 1));
    expect(new Set(CHAPTER1_LESSONS.map((lesson) => lesson.id)).size).toBe(13);
  });

  it.each(CHAPTER1_LESSONS.flatMap((lesson) => lesson.sections.map((section) => [lesson.id, section] as const)))('%s has examples that run cleanly', (_lessonId, section) => {
    expect(section.examples.length, `section ${section.id} needs an example`).toBeGreaterThan(0);
    for (const example of section.examples) {
      const recorded = outputs.examples[example.id];
      expect(recorded, `example ${example.id} is not recorded`).toBeDefined();
      expect(recorded?.error, `example ${example.id} raised`).toBeNull();
    }
  });

  it('every mistake tag a section names is in the taxonomy', () => {
    for (const lesson of CHAPTER1_LESSONS) {
      for (const section of lesson.sections) {
        for (const tag of section.commonMistakes) expect(MISTAKES, `${section.id} names ${tag}`).toHaveProperty(tag);
      }
    }
  });
});

describe('choice items (predict and traceback)', () => {
  it.each(CHAPTER1_CHOICE.map((item) => [item.id, item] as const))('%s has three hints, a true answer, and tagged options', (_id, item) => {
    expect(item.hints).toHaveLength(3);
    for (const hint of item.hints) expect(hint.trim()).not.toBe('');
    const recorded = outputs.choice[item.id];
    expect(recorded).toBeDefined();
    expect(recorded?.options.length).toBeGreaterThanOrEqual(2);
    const texts = recorded?.options.map((option) => option.text) ?? [];
    expect(new Set(texts).size, 'every option has a different computed text').toBe(texts.length);
    for (const option of recorded?.options ?? []) {
      if (option.id === 'true') continue;
      expect(option.tag, `option ${option.id} is tagged`).toBeTruthy();
      expect(MISTAKES, `option ${option.id} uses a known tag`).toHaveProperty(option.tag ?? '');
    }
    const answer = recorded?.options.find((option) => option.id === 'true');
    if (item.kind === 'traceback') expect(answer?.error, 'the true cause is a real error').not.toBeNull();
    if (item.kind === 'predict') expect(answer?.error, 'the true output is printed, not raised').toBeNull();
  });
});

describe('graded items', () => {
  it.each(GRADED.map((spec) => [spec.id, spec] as const))('%s: the reference passes, and the grader is repeatable', (_id, spec) => {
    const first = grade(spec, spec.reference, 'submit');
    expect(first.status, JSON.stringify(first.cases.filter((c) => !c.ok))).toBe('pass');
    expect(grade(spec, spec.reference, 'submit')).toEqual(first);
  }, 120_000);

  it.each(GRADED.map((spec) => [spec.id, spec] as const))('%s: has three hints and a rule for every wrong variant', (_id, spec) => {
    expect(spec.hints).toHaveLength(3);
    expect(spec.rules.length).toBeGreaterThan(0);
    const covered = new Set(Object.values(spec.variantRule));
    spec.rules.forEach((_, index) => expect(covered.has(index), `no wrong variant breaks rule ${index + 1}`).toBe(true));
    expect(Object.keys(spec.variantRule).sort()).toEqual(spec.variants.map((variant) => variant.id).sort());
  });

  it.each(GRADED.map((spec) => [spec.id, spec] as const))('%s: each wrong variant is caught by at least two cases, and one fails visible data', (_id, spec) => {
    expect(spec.variants.length).toBeGreaterThanOrEqual(2);
    let visibleFailure = false;
    for (const variant of spec.variants) {
      const result = grade(spec, variant.code, 'submit');
      expect(result.status, `${variant.id} should fail`).toBe('fail');
      expect(result.cases.filter((c) => !c.ok).length, `${variant.id} is caught by at least two checks`).toBeGreaterThanOrEqual(2);
      const matched = result.matched.find((m) => m.variantId === variant.id);
      expect(matched?.tag, `${variant.id} names its mistake`).toBe(variant.mistake.tag);
      if (grade(spec, variant.code, 'run').status === 'fail') visibleFailure = true;
    }
    expect(visibleFailure, 'at least one wrong variant fails on visible data').toBe(true);
  }, 240_000);

  it.each(GRADED.map((spec) => [spec.id, spec] as const))('%s: the starter is a skeleton (write task) or broken (fix task)', (_id, spec) => {
    if (spec.id.startsWith('c01-fix-')) {
      expect(isSkeleton(spec.starter), 'fix tasks start from broken code, not a skeleton').toBe(false);
      expect(grade(spec, spec.starter, 'submit').status, 'the broken starter fails').toBe('fail');
    } else {
      expect(isSkeleton(spec.starter), 'write tasks start from a bare pass').toBe(true);
    }
  });
});

describe('boss', () => {
  it('has four graded parts, each with its own rules and wrong variants', () => {
    expect(CHAPTER1_BOSS.map((part) => part.id)).toEqual([
      'c01-boss-clean-lines',
      'c01-boss-count-words',
      'c01-boss-top-words',
      'c01-boss-report-lines',
    ]);
  });
});
