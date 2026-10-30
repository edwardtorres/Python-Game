// Chapter 1 content, as typed data. Lessons teach with runnable examples. Choice items
// (predict and traceback) take their answers from running code, never from a table.
// Graded items reuse the grader through ChallengeSpec.
import type { Mistake } from '../../engine/types';

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
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  competency: string;
  intro: string;
  sections: Section[];
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
