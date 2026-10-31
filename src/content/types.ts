// Content types shared by every chapter, as typed data. Lessons teach with runnable examples.
// Choice items (predict and traceback) take their answers from running code, never from a table.
// Graded items reuse the grader through ChallengeSpec.
import type { ChallengeSpec } from '../challenges/types';
import type { Mistake } from '../engine/types';
import type { ChapterOutputs } from './output-types';

export interface Example {
  id: string;
  code: string;
}

export interface Section {
  id: string;
  title: string;
  paragraphs: string[];
  // Each section has at least one example. Every claim in its paragraphs is shown by
  // the examples, and the source pass checks that the examples are recorded.
  examples: Example[];
  // Mistake tags (see mistakes.ts) that this section warns about.
  commonMistakes: string[];
  // True when a claim in this section needs a documentation source. Such a section must cite
  // at least one quote id from docs/quotes.json. The docs-quotes job enforces this.
  docClaim: boolean;
  quotes: string[];
}

// An "If you know JavaScript" note. Each note cites at least one quote id, from the Python
// docs or MDN, because the JavaScript side of the note is a documentation claim.
export interface JsNote {
  id: string;
  text: string;
  quotes: string[];
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  competency: string;
  intro: string;
  sections: Section[];
  jsNotes: JsNote[];
}

// A wrong answer for a choice item. Its code is run, and its output or error is the
// option text. The mistake tells the learner what went wrong.
export interface ChoiceVariant {
  id: string;
  code: string;
  mistake: Mistake;
}

export interface PredictItem {
  id: string;
  kind: 'predict';
  lessonId: string;
  title: string;
  prompt: string;
  code: string;
  variants: ChoiceVariant[];
  hints: [string, string, string];
}

export interface TracebackItem {
  id: string;
  kind: 'traceback';
  lessonId: string;
  title: string;
  prompt: string;
  code: string;
  variants: ChoiceVariant[];
  hints: [string, string, string];
}

export type ChoiceItem = PredictItem | TracebackItem;

// A chapter's content and wording. The recorded outputs are added by the registry (chapters.ts),
// so content modules never import the generated JSON.
export interface ChapterInfo {
  id: string;
  number: number;
  title: string;
  intro: string;
  bossTitle: string;
  bossIntro: string;
  lessons: Lesson[];
  choice: ChoiceItem[];
  graded: ChallengeSpec[];
  boss: ChallengeSpec[];
}

// A chapter as the app reads it: its content, plus the outputs recorded for its examples and
// practice items.
export interface Chapter extends ChapterInfo {
  outputs: ChapterOutputs;
}
