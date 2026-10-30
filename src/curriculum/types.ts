// The curriculum is typed data: chapters with prerequisites, competencies, and lessons.
// src/curriculum/validate.ts checks the graph, and the tests fail if it breaks.

export type LessonStatus = 'planned' | 'drafted' | 'reviewed';

export interface Competency {
  id: string;
  label: string;
}

export interface Lesson {
  id: string;
  title: string;
  competency: string;
  status: LessonStatus;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  prerequisites: string[];
  competencies: string[];
  lessons: Lesson[];
}

export interface Curriculum {
  competencies: Competency[];
  chapters: Chapter[];
}
