// Grades the recorded blind-solve solutions against the current items of each chapter. Each solution
// was written by a fresh agent that saw only its brief, so a rule change can move its result. The
// recorded results are in each chapter's regrade.json. Set UPDATE_BLIND=1 to rewrite them.
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildGradeRequest } from '../challenges/payload';
import { PyRuntime } from '../engine/runtime';
import { CHAPTERS } from './chapters';

interface Record {
  root: string;
  // The solution folders, relative to the root. Chapter 1's G1 to G4 were solved before the Step 2a-fix rules.
  dirs: string[];
  // Solutions that must pass under the current rules. Chapter 1's fix-2a re-solves pass; its G1 to G4 do not all.
  mustPass: (solution: string) => boolean;
}

const RECORDS: Record[] = [
  {
    root: 'docs/blind-solves/chapter1',
    dirs: ['solutions/G1', 'solutions/G2', 'solutions/G3', 'solutions/G4', 'fix-2a/solutions'],
    mustPass: (solution) => solution.startsWith('fix-2a/'),
  },
  {
    root: 'docs/blind-solves/chapter2',
    dirs: ['solutions/G1', 'solutions/G2', 'solutions/G3', 'solutions/G4', 'solutions/G4-r2'],
    mustPass: () => true,
  },
];

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

function regrade(record: Record): Regrade[] {
  const specs = new Map(CHAPTERS.flatMap((chapter) => [...chapter.graded, ...chapter.boss]).map((spec) => [spec.id, spec] as const));
  return record.dirs.flatMap((dir) =>
    fs
      .readdirSync(path.join(record.root, dir))
      .filter((file) => file.endsWith('.py'))
      .sort()
      .map((file) => {
        const id = file.replace(/\.py$/, '');
        const spec = specs.get(id);
        if (spec === undefined) throw new Error(`${dir}/${file} names no item`);
        const code = fs.readFileSync(path.join(record.root, dir, file), 'utf8');
        const { payload, datasets } = buildGradeRequest(spec, code, 'submit');
        const result = runtime.grade(JSON.stringify(payload), JSON.stringify(datasets));
        return { solution: `${dir}/${file}`, id, status: result.status, passed: result.passed, total: result.total };
      }),
  );
}

describe.each(RECORDS.map((record) => [record.root, record] as const))('recorded blind-solve solutions in %s', (_root, record) => {
  it('the recorded regrade matches a fresh run (regenerate with UPDATE_BLIND=1)', () => {
    const fresh = regrade(record);
    const file = path.join(record.root, 'regrade.json');
    if (process.env.UPDATE_BLIND === '1') fs.writeFileSync(file, `${JSON.stringify(fresh, null, 2)}\n`);
    const committed = JSON.parse(fs.readFileSync(file, 'utf8')) as Regrade[];
    expect(fresh).toEqual(committed);
  });

  it('the solutions that must pass do pass every visible and hidden case under the current rules', () => {
    const rows = regrade(record).filter((row) => record.mustPass(row.solution));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.status, row.solution).toBe('pass');
  });
});
