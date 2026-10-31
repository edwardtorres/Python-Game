// Chapter 2, Informatics fundamentals: lessons, practice items, graded items, and the boss.
import type { ChallengeSpec } from '../../challenges/types';
import { BOSS_SPECS } from './boss-items';
import { CHOICE_ITEMS } from './choice-items';
import { GRADED_SPECS } from './graded-items';
import { LESSONS_A } from './lessons-a';
import { LESSONS_B } from './lessons-b';
import type { ChapterInfo, ChoiceItem, Lesson } from '../types';

export const CHAPTER2_ID = 'c02-informatics';

export const CHAPTER2_LESSONS: Lesson[] = [...LESSONS_A, ...LESSONS_B];
export const CHAPTER2_CHOICE: ChoiceItem[] = CHOICE_ITEMS;
export const CHAPTER2_GRADED: ChallengeSpec[] = GRADED_SPECS;
export const CHAPTER2_BOSS: ChallengeSpec[] = BOSS_SPECS;

export const CHAPTER2: ChapterInfo = {
  id: CHAPTER2_ID,
  number: 2,
  title: 'Informatics fundamentals',
  intro: 'Eleven short lessons on classes, containers, sorting, recursion, and reading errors. Each lesson has examples you can edit and run. Practice items, graded tickets, and a boss follow.',
  bossTitle: 'The dock dispatch board',
  bossIntro: 'Four parts, in order: rank the dock rows, dispatch by priority, flatten the tags, and write the dock report. Each part is checked on its own.',
  lessons: CHAPTER2_LESSONS,
  choice: CHAPTER2_CHOICE,
  graded: CHAPTER2_GRADED,
  boss: CHAPTER2_BOSS,
};
