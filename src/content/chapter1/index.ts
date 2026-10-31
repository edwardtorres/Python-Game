// Chapter 1, Foundations refresh: lessons, choice items, graded items, and the boss.
import type { ChallengeSpec } from '../../challenges/types';
import { BOSS_SPECS, GRADED_SPECS } from './graded-items';
import { CHOICE_ITEMS, PREDICT_ITEMS, TRACEBACK_ITEMS } from './choice-items';
import { LESSONS_A } from './lessons-a';
import { LESSONS_B } from './lessons-b';
import type { ChoiceItem, Lesson } from '../types';

export const CHAPTER1_ID = 'c01-foundations';
export const BOSS_ID = 'c01-boss';

export const CHAPTER1_LESSONS: Lesson[] = [...LESSONS_A, ...LESSONS_B];

export const CHAPTER1_CHOICE: ChoiceItem[] = CHOICE_ITEMS;
export const CHAPTER1_PREDICT: ChoiceItem[] = PREDICT_ITEMS;
export const CHAPTER1_TRACEBACK: ChoiceItem[] = TRACEBACK_ITEMS;

// Graded items, in the order the chapter page shows them. The boss is one item with four
// parts, and each part is a spec that the grader checks on its own.
export const CHAPTER1_GRADED: ChallengeSpec[] = GRADED_SPECS;
export const CHAPTER1_BOSS: ChallengeSpec[] = BOSS_SPECS;
