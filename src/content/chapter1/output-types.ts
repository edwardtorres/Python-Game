// The shape of generated/chapter1.outputs.json. The app reads this file, so these types
// must not import anything that needs Node (the generator in generate.ts does).
import type { PythonErrorInfo } from '../../engine/types';

export interface ExampleOutput {
  codeHash: string;
  stdout: string;
  error: PythonErrorInfo | null;
}

export interface OptionOutput {
  id: string;
  text: string;
  tag: string | null;
  codeHash: string;
  error: PythonErrorInfo | null;
}

export interface ChoiceOutput {
  codeHash: string;
  answer: string;
  options: OptionOutput[];
}

export interface ChapterOutputs {
  examples: Record<string, ExampleOutput>;
  choice: Record<string, ChoiceOutput>;
}
