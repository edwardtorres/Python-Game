// Chapter 3, Testing: lessons, practice items, graded items, and the boss.
import type { ChallengeSpec } from '../../challenges/types';
import { BOSS_SPECS } from './boss-items';
import { CHOICE_ITEMS } from './choice-items';
import { GRADED_SPECS } from './graded-items';
import { LESSONS } from './lessons';
import type { ChapterInfo, ChoiceItem, Lesson } from '../types';

export const CHAPTER3_ID = 'c03-testing';

export const CHAPTER3_LESSONS: Lesson[] = LESSONS;
export const CHAPTER3_CHOICE: ChoiceItem[] = CHOICE_ITEMS;
export const CHAPTER3_GRADED: ChallengeSpec[] = GRADED_SPECS;
export const CHAPTER3_BOSS: ChallengeSpec[] = BOSS_SPECS;

export const CHAPTER3: ChapterInfo = {
  id: CHAPTER3_ID,
  number: 3,
  title: 'Testing',
  intro: 'Four short lessons on assert, test functions, choosing cases, and fixing code test first. Testing items grade the tests you write, and suite items grade the fixes you make.',
  bossTitle: 'The report tests',
  bossIntro: 'Four parts, in order: test clean_lines, test count_words, test top_words, and test report_lines. Each part is graded on its own.',
  lessons: CHAPTER3_LESSONS,
  choice: CHAPTER3_CHOICE,
  graded: CHAPTER3_GRADED,
  boss: CHAPTER3_BOSS,
};
