// Runs every Chapter 1 example and choice option in the engine and returns what the
// interpreter printed or raised. Only tests use this (it needs node:crypto). The app reads
// the recorded result from generated/chapter1.outputs.json.
import { createHash } from 'node:crypto';
import type { PyRuntime } from '../../engine/runtime';
import type { CellResult } from '../../engine/types';
import { CHAPTER1_CHOICE, CHAPTER1_LESSONS } from './index';
import type { ChoiceItem } from './types';
import type { ChapterOutputs, ChoiceOutput, ExampleOutput, OptionOutput } from './output-types';

export type { ChapterOutputs, ChoiceOutput, ExampleOutput, OptionOutput } from './output-types';

export function codeHash(code: string): string {
  return createHash('sha256').update(code).digest('hex').slice(0, 16);
}

export const ANSWER = 'true';

export function runSnippet(runtime: PyRuntime, label: string, code: string): CellResult {
  const session = `content-${label}`;
  runtime.resetSession(session);
  const result = runtime.runCell(session, code);
  runtime.resetSession(session);
  return result;
}

// A predict option is the printed text. A traceback option is the error the code raises.
function optionText(result: CellResult, kind: ChoiceItem['kind']): string {
  if (result.error !== null) return `${result.error.type}: ${result.error.message}`;
  if (kind === 'traceback') return '(no error)';
  return result.stdout.replace(/\n$/, '');
}

// The true answer is first in the list. The options are rotated by a hash of the code, so
// the true answer is not always in the same place, and the rotation is the same every run.
function rotate<T>(items: T[], key: string): T[] {
  const offset = parseInt(codeHash(key).slice(0, 4), 16) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function buildChoice(runtime: PyRuntime, item: ChoiceItem): ChoiceOutput {
  const truth = runSnippet(runtime, `${item.id}-answer`, item.code);
  const options: OptionOutput[] = [{ id: ANSWER, text: optionText(truth, item.kind), tag: null, codeHash: codeHash(item.code), error: truth.error }];
  for (const variant of item.variants) {
    const result = runSnippet(runtime, `${item.id}-${variant.id}`, variant.code);
    options.push({ id: variant.id, text: optionText(result, item.kind), tag: variant.mistake.tag, codeHash: codeHash(variant.code), error: result.error });
  }
  return { codeHash: codeHash(item.code), answer: ANSWER, options: rotate(options, item.code) };
}

export function buildOutputs(runtime: PyRuntime): ChapterOutputs {
  const examples: Record<string, ExampleOutput> = {};
  for (const lesson of CHAPTER1_LESSONS) {
    for (const section of lesson.sections) {
      for (const example of section.examples) {
        const result = runSnippet(runtime, example.id, example.code);
        examples[example.id] = { codeHash: codeHash(example.code), stdout: result.stdout, error: result.error };
      }
    }
  }
  const choice: Record<string, ChoiceOutput> = {};
  for (const item of CHAPTER1_CHOICE) choice[item.id] = buildChoice(runtime, item);
  return { examples, choice };
}

export function serialise(outputs: ChapterOutputs): string {
  return `${JSON.stringify(outputs, null, 2)}\n`;
}
