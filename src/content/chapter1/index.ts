// Chapter 1, Foundations refresh: lessons, choice items, graded items, and the boss.
import type { ChallengeSpec } from '../../challenges/types';
import { BOSS_SPECS, GRADED_SPECS } from './graded-items';
import { CHOICE_ITEMS } from './choice-items';
import { LESSONS_A } from './lessons-a';
import { LESSONS_B } from './lessons-b';
import type { ChapterInfo, ChoiceItem, Lesson } from '../types';

export const CHAPTER1_ID = 'c01-foundations';

export const CHAPTER1_LESSONS: Lesson[] = [...LESSONS_A, ...LESSONS_B];
export const CHAPTER1_CHOICE: ChoiceItem[] = CHOICE_ITEMS;

// Graded items, in the order the chapter page shows them. The boss is four graded parts, and
// each part is a spec that the grader checks on its own.
export const CHAPTER1_GRADED: ChallengeSpec[] = GRADED_SPECS;
export const CHAPTER1_BOSS: ChallengeSpec[] = BOSS_SPECS;

export const CHAPTER1: ChapterInfo = {
  id: CHAPTER1_ID,
  number: 1,
  title: 'Foundations refresh',
  intro: 'Thirteen short lessons, then practice items and a boss. Each lesson has examples you can edit and run. Your progress is saved in this browser.',
  bossTitle: 'The weekly word report',
  bossIntro: 'Four parts, in order: clean the lines, count the words, rank the top words, and format the report. Each part is checked on its own.',
  lessons: CHAPTER1_LESSONS,
  choice: CHAPTER1_CHOICE,
  graded: CHAPTER1_GRADED,
  boss: CHAPTER1_BOSS,
};
