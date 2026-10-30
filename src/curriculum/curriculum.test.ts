import { describe, expect, it } from 'vitest';
import { CURRICULUM } from './data';
import { validateCurriculum } from './validate';
import type { Curriculum } from './types';

describe('curriculum data', () => {
  it('passes validation: acyclic, reachable, and every competency taught', () => {
    expect(validateCurriculum(CURRICULUM)).toEqual([]);
  });

  it('has the eleven chapters from the brief, in order', () => {
    expect(CURRICULUM.chapters.map((chapter) => chapter.title)).toEqual([
      'Foundations refresh',
      'Informatics fundamentals',
      'Testing',
      'Files and formats',
      'APIs and automation',
      'NumPy',
      'pandas',
      'Visualization and reporting',
      'Statistics',
      'Machine learning basics',
      'Capstones and interviews',
    ]);
  });

  it('gives every chapter at least one lesson per listed competency', () => {
    for (const chapter of CURRICULUM.chapters) {
      expect(chapter.lessons.map((lesson) => lesson.competency)).toEqual(chapter.competencies);
    }
  });
});

describe('curriculum validation', () => {
  const sound: Curriculum = {
    competencies: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    chapters: [
      { id: 'one', number: 1, title: 'One', prerequisites: [], competencies: ['a'], lessons: [{ id: 'one/a', title: 'A', competency: 'a', status: 'planned' }] },
      { id: 'two', number: 2, title: 'Two', prerequisites: ['one'], competencies: ['b'], lessons: [{ id: 'two/b', title: 'B', competency: 'b', status: 'planned' }] },
    ],
  };

  it('accepts a sound curriculum', () => {
    expect(validateCurriculum(sound)).toEqual([]);
  });

  it('rejects a prerequisite cycle', () => {
    const cyclic: Curriculum = {
      ...sound,
      chapters: [
        { ...sound.chapters[0]!, prerequisites: ['two'] },
        sound.chapters[1]!,
      ],
    };
    expect(validateCurriculum(cyclic).some((problem) => problem.includes('prerequisite cycle'))).toBe(true);
  });

  it('rejects an unknown prerequisite', () => {
    const broken: Curriculum = { ...sound, chapters: [{ ...sound.chapters[0]!, prerequisites: ['missing'] }, sound.chapters[1]!] };
    expect(validateCurriculum(broken).join(' ')).toContain('unknown chapter missing');
  });

  it('rejects a chapter that cannot be reached', () => {
    const island: Curriculum = {
      ...sound,
      chapters: [...sound.chapters, { id: 'three', number: 3, title: 'Three', prerequisites: ['three'], competencies: [], lessons: [] }],
    };
    expect(validateCurriculum(island).some((problem) => problem.includes('three'))).toBe(true);
  });

  it('rejects a competency that no lesson teaches', () => {
    const untaught: Curriculum = { ...sound, competencies: [...sound.competencies, { id: 'c', label: 'C' }] };
    expect(validateCurriculum(untaught).join(' ')).toContain('competency c has no lesson');
  });
});
