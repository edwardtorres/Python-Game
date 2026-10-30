import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'check-py310.py');

function run(snippets) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'py310-'));
  const file = path.join(dir, 'snippets.json');
  fs.writeFileSync(file, JSON.stringify(snippets));
  const result = spawnSync('python3', [script, file], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

test('plain Python 3.10 code is accepted', () => {
  const code = 'from dataclasses import dataclass\n\n@dataclass\nclass Point:\n    x: int\n\nif (n := 3) > 2:\n    print(f\'{n}\')\nmatch n:\n    case 3:\n        pass\n';
  assert.equal(run([{ name: 'ok', code }]).status, 0);
});

test('a PEP 695 generic (Python 3.12) is rejected', () => {
  const result = run([{ name: 'generic', code: 'def first[T](items: list[T]) -> T:\n    return items[0]\n' }]);
  assert.equal(result.status, 1);
  assert.match(result.output, /syntax newer than Python 3.10/);
});

test('an exception group (Python 3.11) is rejected', () => {
  const result = run([{ name: 'group', code: 'try:\n    pass\nexcept* ValueError:\n    pass\n' }]);
  assert.equal(result.status, 1);
});

test('a nested same-quote f-string (Python 3.12) is rejected', () => {
  const result = run([{ name: 'nested', code: 'data = {"a": 1}\nprint(f"{data["a"]}")\n' }]);
  assert.equal(result.status, 1);
  assert.match(result.output, /Python 3.12/);
});

test('a name added in Python 3.11 is reported', () => {
  const result = run([{ name: 'toml', code: 'import tomllib\n' }]);
  assert.equal(result.status, 1);
  assert.match(result.output, /tomllib/);
});
