// The content check for every chapter. It runs every example, option, and graded reference in
// Pyodide under Node, and checks the rules each graded item must follow. Set UPDATE_CONTENT=1 to
// rewrite every generated/chapter<N>.outputs.json.
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildGradeRequest } from '../challenges/payload';
import type { ChallengeSpec } from '../challenges/types';
import { PyRuntime } from '../engine/runtime';
import type { GradeResult } from '../engine/types';
import { CHAPTERS } from './chapters';
import { buildOutputs, outputsPath, runSnippet, serialise } from './generate';
import { MISTAKES } from './mistakes';
import type { ChapterOutputs } from './output-types';
import type { Chapter } from './types';

// The counts each chapter's plan sets. Changing a chapter's content changes its entry here.
const COUNTS: Record<string, { lessons: number; choice: number; graded: number; boss: number }> = {
  'c01-foundations': { lessons: 13, choice: 15, graded: 14, boss: 4 },
  'c02-informatics': { lessons: 11, choice: 13, graded: 11, boss: 4 },
};

let runtime: PyRuntime;
const built = new Map<string, ChapterOutputs>();

beforeAll(async () => {
  runtime = new PyRuntime({
    indexURL: `${path.resolve('public/pyodide')}/`,
    loadModule: async () => (await import('pyodide')) as never,
  });
  await runtime.init();
  for (const chapter of CHAPTERS) {
    const outputs = buildOutputs(runtime, chapter);
    built.set(chapter.id, outputs);
    if (process.env.UPDATE_CONTENT === '1') {
      fs.mkdirSync(path.dirname(outputsPath(chapter)), { recursive: true });
      fs.writeFileSync(outputsPath(chapter), serialise(outputs));
    }
  }
}, 600_000);

function outputsOf(chapter: Chapter): ChapterOutputs {
  const outputs = built.get(chapter.id);
  if (outputs === undefined) throw new Error(`no outputs were built for ${chapter.id}`);
  return outputs;
}

function grade(spec: ChallengeSpec, learner: string, mode: 'run' | 'submit'): GradeResult {
  const { payload, datasets } = buildGradeRequest(spec, learner, mode);
  return runtime.grade(JSON.stringify(payload), JSON.stringify(datasets));
}

// Checks a starter with the ast module: a write task's starter is a bare `pass`.
function isSkeleton(code: string): boolean {
  const probe = `import ast\nSOURCE = ${JSON.stringify(code)}\ntree = ast.parse(SOURCE)\nfunction = tree.body[0]\nprint(all(isinstance(node, ast.Pass) for node in function.body))\n`;
  return runSnippet(runtime, `skeleton-${code.length}`, probe).stdout.trim() === 'True';
}

// A fix and a test-driven fix start from broken code. Every other write task starts from a bare pass.
function startsBroken(spec: ChallengeSpec): boolean {
  return spec.kind === 'suite' || spec.id.includes('-fix-');
}

// The rule indexes each case names. The grader names a structure check's case check-<index>.
function namedRules(spec: ChallengeSpec): Map<string, number[]> {
  const named = new Map<string, number[]>();
  for (const item of spec.cases) named.set(item.id, ('rules' in item ? item.rules : undefined) ?? []);
  (spec.structureChecks ?? []).forEach((check, index) => named.set(`check-${index}`, check.rules ?? []));
  return named;
}

describe.each(CHAPTERS.map((chapter) => [chapter.id, chapter] as const))('chapter %s', (_id, chapter) => {
  const outputs = () => outputsOf(chapter);
  const graded = [...chapter.graded, ...chapter.boss];

  describe('lessons (source pass)', () => {
    it('has the counts its plan sets', () => {
      expect(COUNTS[chapter.id]).toEqual({ lessons: chapter.lessons.length, choice: chapter.choice.length, graded: chapter.graded.length, boss: chapter.boss.length });
    });

    it('the recorded example outputs match a fresh run', () => {
      const committed = JSON.parse(fs.readFileSync(outputsPath(chapter), 'utf8')) as ChapterOutputs;
      expect(committed).toEqual(outputs());
    });

    it('lessons are numbered in order from 1, with distinct ids', () => {
      expect(chapter.lessons.map((lesson) => lesson.number)).toEqual(chapter.lessons.map((_, index) => index + 1));
      expect(new Set(chapter.lessons.map((lesson) => lesson.id)).size).toBe(chapter.lessons.length);
    });

    it.each(chapter.lessons.flatMap((lesson) => lesson.sections.map((section) => [lesson.id, section] as const)))('%s has examples that run cleanly', (_lessonId, section) => {
      expect(section.examples.length, `section ${section.id} needs an example`).toBeGreaterThan(0);
      for (const example of section.examples) {
        const recorded = outputs().examples[example.id];
        expect(recorded, `example ${example.id} is not recorded`).toBeDefined();
        expect(recorded?.error, `example ${example.id} raised`).toBeNull();
      }
    });

    it('every mistake tag a section names is in the taxonomy', () => {
      for (const lesson of chapter.lessons) {
        for (const section of lesson.sections) {
          for (const tag of section.commonMistakes) expect(MISTAKES, `${section.id} names ${tag}`).toHaveProperty(tag);
        }
      }
    });
  });

  describe('choice items (predict and traceback)', () => {
    it.each(chapter.choice.map((item) => [item.id, item] as const))('%s has three hints, a true answer, and tagged options', (_id, item) => {
      expect(item.hints).toHaveLength(3);
      for (const hint of item.hints) expect(hint.trim()).not.toBe('');
      const recorded = outputs().choice[item.id];
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
    it.each(graded.map((spec) => [spec.id, spec] as const))('%s: the reference passes, and the grader is repeatable', (_id, spec) => {
      const first = grade(spec, spec.reference, 'submit');
      expect(first.status, JSON.stringify(first.cases.filter((c) => !c.ok))).toBe('pass');
      expect(grade(spec, spec.reference, 'submit')).toEqual(first);
    }, 120_000);

    it.each(graded.map((spec) => [spec.id, spec] as const))('%s: has three hints and a rule for every wrong variant', (_id, spec) => {
      expect(spec.hints).toHaveLength(3);
      expect(spec.rules.length).toBeGreaterThan(0);
      const covered = new Set(Object.values(spec.variantRule));
      spec.rules.forEach((_, index) => expect(covered.has(index), `no wrong variant breaks rule ${index + 1}`).toBe(true));
      expect(Object.keys(spec.variantRule).sort()).toEqual(spec.variants.map((variant) => variant.id).sort());
    });

    it.each(graded.map((spec) => [spec.id, spec] as const))('%s: every case names its rules, and a wrong variant fails only cases that name its rule', (_id, spec) => {
      const named = namedRules(spec);
      for (const [caseId, rules] of named) {
        expect(rules.length, `${caseId} names a rule`).toBeGreaterThan(0);
        for (const rule of rules) expect(rule, `${caseId} names a rule that exists`).toBeLessThan(spec.rules.length);
      }
      spec.rules.forEach((_, index) => {
        expect([...named.values()].some((rules) => rules.includes(index)), `rule ${index + 1} is checked by a case`).toBe(true);
      });
      for (const variant of spec.variants) {
        const rule = spec.variantRule[variant.id];
        for (const caseResult of grade(spec, variant.code, 'submit').cases.filter((c) => !c.ok)) {
          expect(named.get(caseResult.id), `${variant.id} fails ${caseResult.id}, which does not name rule ${rule}`).toContain(rule);
        }
      }
    }, 240_000);

    it.each(graded.map((spec) => [spec.id, spec] as const))('%s: each wrong variant is caught by at least two cases, and one fails visible data', (_id, spec) => {
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

    it.each(graded.map((spec) => [spec.id, spec] as const))('%s: the starter is a skeleton (write task) or broken (fix task)', (_id, spec) => {
      if (startsBroken(spec)) {
        expect(isSkeleton(spec.starter), 'fix tasks start from broken code, not a skeleton').toBe(false);
        expect(grade(spec, spec.starter, 'submit').status, 'the broken starter fails').toBe('fail');
      } else {
        expect(isSkeleton(spec.starter), 'write tasks start from a bare pass').toBe(true);
      }
    });
  });

  describe('boss', () => {
    it('has graded parts named for the chapter', () => {
      const prefix = `c${String(chapter.number).padStart(2, '0')}-boss-`;
      expect(chapter.boss.length).toBeGreaterThan(0);
      for (const part of chapter.boss) expect(part.id.startsWith(prefix), part.id).toBe(true);
    });
  });
});
