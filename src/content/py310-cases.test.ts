// Exports the sample and chapter grading payloads and the engine's verdicts for them, with the
// lesson and option code. CI runs the same code under CPython 3.10 (scripts/py310/run-cases.py) and
// compares verdicts. Set UPDATE_PY310_CASES=1 to rewrite the committed files after changing content.
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, expect, it } from 'vitest';
import { PyRuntime } from '../engine/runtime';
import { CHALLENGES } from '../challenges/registry';
import { buildGradeRequest } from '../challenges/payload';
import type { ChallengeSpec } from '../challenges/types';
import { CHAPTERS } from './chapters';
import { outputsPath } from './generate';
import type { ChapterOutputs } from './output-types';
import type { Chapter } from './types';

const CASES_FILE = path.resolve('scripts/py310/cases.json');
const SNIPPETS_FILE = path.resolve('scripts/py310/snippets.json');
const EXAMPLES_FILE = path.resolve('scripts/py310/examples.json');
let runtime: PyRuntime;

interface LearnerCase {
  name: string;
  learner: string;
  kind: 'reference' | 'starter' | 'variant';
}

function learnerCases(spec: ChallengeSpec): LearnerCase[] {
  return [
    { name: `${spec.id}:reference`, learner: spec.reference, kind: 'reference' },
    { name: `${spec.id}:starter`, learner: spec.starter, kind: 'starter' },
    ...spec.variants.map((variant) => ({ name: `${spec.id}:variant:${variant.id}`, learner: variant.code, kind: 'variant' as const })),
  ];
}

interface Example {
  name: string;
  code: string;
  // stdout: the printed text must match exactly. error-type: only the exception type must match.
  check: 'stdout' | 'error-type';
  expected: string;
}

function buildExamples(chapter: Chapter, outputs: ChapterOutputs): Example[] {
  const examples: Example[] = [];
  for (const lesson of chapter.lessons) {
    for (const section of lesson.sections) {
      for (const example of section.examples) {
        const recorded = outputs.examples[example.id];
        examples.push({ name: `example:${example.id}`, code: example.code, check: 'stdout', expected: recorded?.stdout ?? '' });
      }
    }
  }
  for (const item of chapter.choice) {
    const recorded = outputs.choice[item.id];
    for (const option of recorded?.options ?? []) {
      const code = option.id === 'true' ? item.code : item.variants.find((variant) => variant.id === option.id)?.code ?? '';
      // A printed option is compared exactly. An option that raises is compared by exception type,
      // because CPython words some messages differently from Pyodide.
      if (item.kind === 'predict' && option.error === null) {
        examples.push({ name: `choice:${item.id}:${option.id}`, code, check: 'stdout', expected: `${option.text}\n` });
      } else {
        examples.push({ name: `choice:${item.id}:${option.id}`, code, check: 'error-type', expected: option.error?.type ?? 'none' });
      }
    }
  }
  return examples;
}

function build(): { cases: unknown[]; snippets: unknown[]; examples: Example[] } {
  const cases: unknown[] = [];
  const snippets: unknown[] = [];
  const graded = CHAPTERS.flatMap((chapter) => [...chapter.graded, ...chapter.boss]);
  for (const spec of [...CHALLENGES, ...graded]) {
    for (const item of learnerCases(spec)) {
      const { payload, datasets } = buildGradeRequest(spec, item.learner, 'submit');
      const result = runtime.grade(JSON.stringify(payload), JSON.stringify(datasets));
      cases.push({
        name: item.name,
        payload,
        datasets,
        expected: {
          status: result.status,
          passed: result.passed,
          total: result.total,
          cases: result.cases.map((caseResult) => [caseResult.id, caseResult.ok]),
          matched: result.matched.map((mistake) => mistake.variantId),
        },
      });
      snippets.push({ name: item.name, code: item.learner });
    }
  }
  for (const chapter of CHAPTERS) {
    for (const lesson of chapter.lessons) {
      for (const section of lesson.sections) {
        for (const example of section.examples) snippets.push({ name: `example:${example.id}`, code: example.code });
      }
    }
    for (const item of chapter.choice) {
      snippets.push({ name: `choice:${item.id}`, code: item.code });
      for (const variant of item.variants) snippets.push({ name: `choice:${item.id}:${variant.id}`, code: variant.code });
    }
  }
  const examples = CHAPTERS.flatMap((chapter) => buildExamples(chapter, JSON.parse(fs.readFileSync(outputsPath(chapter), 'utf8')) as ChapterOutputs));
  return { cases, snippets, examples };
}

beforeAll(async () => {
  runtime = new PyRuntime({
    indexURL: `${path.resolve('public/pyodide')}/`,
    loadModule: async () => (await import('pyodide')) as never,
  });
  await runtime.init();
  await runtime.loadPackages(['pandas', 'matplotlib']);
}, 300_000);

it('the committed CPython 3.10 cases match the engine (regenerate with UPDATE_PY310_CASES=1)', () => {
  const { cases, snippets, examples } = build();
  const casesText = `${JSON.stringify(cases, null, 2)}\n`;
  const snippetsText = `${JSON.stringify(snippets, null, 2)}\n`;
  const examplesText = `${JSON.stringify(examples, null, 2)}\n`;
  if (process.env.UPDATE_PY310_CASES === '1') {
    fs.writeFileSync(CASES_FILE, casesText);
    fs.writeFileSync(SNIPPETS_FILE, snippetsText);
    fs.writeFileSync(EXAMPLES_FILE, examplesText);
  }
  expect(fs.existsSync(CASES_FILE), 'scripts/py310/cases.json is missing').toBe(true);
  expect(fs.readFileSync(CASES_FILE, 'utf8')).toBe(casesText);
  expect(fs.readFileSync(SNIPPETS_FILE, 'utf8')).toBe(snippetsText);
  expect(fs.readFileSync(EXAMPLES_FILE, 'utf8')).toBe(examplesText);
}, 600_000);
