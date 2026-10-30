// Exports the sample grading payloads and the engine's verdicts for them. CI runs the same
// payloads under CPython 3.10 (scripts/py310/run-cases.py) and compares verdicts.
// Set UPDATE_PY310_CASES=1 to rewrite the committed files after changing a challenge.
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, expect, it } from 'vitest';
import { PyRuntime } from '../engine/runtime';
import { CHALLENGES } from '../challenges/registry';
import { buildGradeRequest } from '../challenges/payload';
import type { ChallengeSpec } from '../challenges/types';

const CASES_FILE = path.resolve('scripts/py310/cases.json');
const SNIPPETS_FILE = path.resolve('scripts/py310/snippets.json');
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

function build(): { cases: unknown[]; snippets: unknown[] } {
  const cases: unknown[] = [];
  const snippets: unknown[] = [];
  for (const spec of CHALLENGES) {
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
  return { cases, snippets };
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
  const { cases, snippets } = build();
  const casesText = `${JSON.stringify(cases, null, 2)}\n`;
  const snippetsText = `${JSON.stringify(snippets, null, 2)}\n`;
  if (process.env.UPDATE_PY310_CASES === '1') {
    fs.writeFileSync(CASES_FILE, casesText);
    fs.writeFileSync(SNIPPETS_FILE, snippetsText);
  }
  expect(fs.existsSync(CASES_FILE), 'scripts/py310/cases.json is missing').toBe(true);
  expect(fs.readFileSync(CASES_FILE, 'utf8')).toBe(casesText);
  expect(fs.readFileSync(SNIPPETS_FILE, 'utf8')).toBe(snippetsText);
}, 600_000);
