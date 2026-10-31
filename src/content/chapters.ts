// The content registry. The app and the content checks read chapters from here. A lookup finds a
// lesson, practice item, or ticket by its id, so the routes need no chapter number.
import type { ChallengeSpec } from '../challenges/types';
import { CHAPTER1 as CHAPTER1_INFO } from './chapter1/index';
import chapter1Outputs from './generated/chapter1.outputs.json';
import { CHAPTER2 as CHAPTER2_INFO } from './chapter2/index';
import chapter2Outputs from './generated/chapter2.outputs.json';
import type { Chapter, ChoiceItem, Lesson } from './types';

// The only module that loads the generated outputs. Chapter modules hold content and stay
// importable without the JSON, which the Playwright runner cannot load.
export const CHAPTERS: readonly Chapter[] = [
  { ...CHAPTER1_INFO, outputs: chapter1Outputs },
  { ...CHAPTER2_INFO, outputs: chapter2Outputs },
];

export interface Found<T> {
  chapter: Chapter;
  item: T;
}

export function findChapter(id: string): Chapter | undefined {
  return CHAPTERS.find((chapter) => chapter.id === id);
}

export function findLesson(id: string): Found<Lesson> | undefined {
  for (const chapter of CHAPTERS) {
    const item = chapter.lessons.find((lesson) => lesson.id === id);
    if (item !== undefined) return { chapter, item };
  }
  return undefined;
}

export function findChoice(id: string): Found<ChoiceItem> | undefined {
  for (const chapter of CHAPTERS) {
    const item = chapter.choice.find((candidate) => candidate.id === id);
    if (item !== undefined) return { chapter, item };
  }
  return undefined;
}

// Graded items and boss parts both open at the ticket route.
export function findTicket(id: string): Found<ChallengeSpec> | undefined {
  for (const chapter of CHAPTERS) {
    const item = [...chapter.graded, ...chapter.boss].find((spec) => spec.id === id);
    if (item !== undefined) return { chapter, item };
  }
  return undefined;
}

// The chapter that a lesson, practice item, or ticket belongs to.
export function chapterOf(id: string): Chapter | undefined {
  return findLesson(id)?.chapter ?? findChoice(id)?.chapter ?? findTicket(id)?.chapter;
}
