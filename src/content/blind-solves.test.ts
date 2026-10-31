// Grades the recorded blind-solve solutions against the current Chapter 1 items. Each solution was
// written by a fresh agent that saw only its brief, so a rule change can move its result. The
// recorded results are in docs/blind-solves/chapter1/regrade.json. Set UPDATE_BLIND=1 to rewrite it.
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildGradeRequest } from '../challenges/payload';
import { PyRuntime } from '../engine/runtime';
import { CHAPTERS } from './chapters';

const ROOT = path.resolve('docs/blind-solves/chapter1');
const REGRADE = path.join(ROOT, 'regrade.json');
// G1 to G4 were solved before the Step 2a-fix rules. fix-2a holds the re-solves of the amended items.
const SOLUTION_DIRS = ['solutions/G1', 'solutions/G2', 'solutions/G3', 'solutions/G4', 'fix-2a/solutions'];

interface Regrade {
  solution: string;
  id: string;
  status: string;
  passed: number;
  total: number;
}

let runtime: PyRuntime;

beforeAll(async () => {
  runtime = new PyRuntime({
    indexURL: `${path.resolve('public/pyodide')}/`,
    loadModule: async () => (await import('pyodide')) as never,
  });
  await runtime.init();
}, 300_000);

function regrade(): Regrade[] {
  const specs = new Map(CHAPTERS.flatMap((chapter) => [...chapter.graded, ...chapter.boss]).map((spec) => [spec.id, spec] as const));
  return SOLUTION_DIRS.flatMap((dir) =>
    fs
      .readdirSync(path.join(ROOT, dir))
      .filter((file) => file.endsWith('.py'))
      .sort()
      .map((file) => {
        const id = file.replace(/\.py$/, '');
        const spec = specs.get(id);
        if (spec === undefined) throw new Error(`${dir}/${file} names no Chapter 1 item`);
        const code = fs.readFileSync(path.join(ROOT, dir, file), 'utf8');
        const { payload, datasets } = buildGradeRequest(spec, code, 'submit');
        const result = runtime.grade(JSON.stringify(payload), JSON.stringify(datasets));
        return { solution: `${dir}/${file}`, id, status: result.status, passed: result.passed, total: result.total };
      }),
  );
}

describe('recorded blind-solve solutions', () => {
  it('the recorded regrade matches a fresh run (regenerate with UPDATE_BLIND=1)', () => {
    const fresh = regrade();
    if (process.env.UPDATE_BLIND === '1') fs.writeFileSync(REGRADE, `${JSON.stringify(fresh, null, 2)}\n`);
    const committed = JSON.parse(fs.readFileSync(REGRADE, 'utf8')) as Regrade[];
    expect(fresh).toEqual(committed);
  });

  it('the Step 2a-fix re-solves pass every visible and hidden case under the current rules', () => {
    const reSolves = regrade().filter((row) => row.solution.startsWith('fix-2a/'));
    expect(reSolves.length).toBe(4);
    for (const row of reSolves) expect(row.status, row.solution).toBe('pass');
  });
});
