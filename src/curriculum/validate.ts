import type { Curriculum } from './types';

// Returns a list of problems. An empty list means the curriculum is sound.
export function validateCurriculum(curriculum: Curriculum): string[] {
  const problems: string[] = [];
  const chapterIds = new Set<string>();
  const competencyIds = new Set(curriculum.competencies.map((competency) => competency.id));

  if (competencyIds.size !== curriculum.competencies.length) problems.push('duplicate competency ids');
  for (const chapter of curriculum.chapters) {
    if (chapterIds.has(chapter.id)) problems.push(`duplicate chapter id ${chapter.id}`);
    chapterIds.add(chapter.id);
  }

  for (const chapter of curriculum.chapters) {
    for (const prerequisite of chapter.prerequisites) {
      if (!chapterIds.has(prerequisite)) problems.push(`${chapter.id} requires unknown chapter ${prerequisite}`);
    }
    for (const competency of chapter.competencies) {
      if (!competencyIds.has(competency)) problems.push(`${chapter.id} uses unknown competency ${competency}`);
    }
    for (const lesson of chapter.lessons) {
      if (!competencyIds.has(lesson.competency)) problems.push(`${lesson.id} uses unknown competency ${lesson.competency}`);
    }
  }

  // Prerequisites must form a DAG.
  const state = new Map<string, 'visiting' | 'done'>();
  const byId = new Map(curriculum.chapters.map((chapter) => [chapter.id, chapter]));
  const visit = (id: string, trail: string[]): void => {
    const current = state.get(id);
    if (current === 'done') return;
    if (current === 'visiting') {
      problems.push(`prerequisite cycle: ${[...trail, id].join(' -> ')}`);
      return;
    }
    state.set(id, 'visiting');
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) visit(prerequisite, [...trail, id]);
    state.set(id, 'done');
  };
  for (const chapter of curriculum.chapters) visit(chapter.id, []);

  // Every chapter must be reachable from a chapter with no prerequisites.
  const unlocks = new Map<string, string[]>();
  for (const chapter of curriculum.chapters) {
    for (const prerequisite of chapter.prerequisites) {
      unlocks.set(prerequisite, [...(unlocks.get(prerequisite) ?? []), chapter.id]);
    }
  }
  const roots = curriculum.chapters.filter((chapter) => chapter.prerequisites.length === 0).map((chapter) => chapter.id);
  if (roots.length === 0) problems.push('no chapter is open to start from');
  const reached = new Set<string>(roots);
  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const next of unlocks.get(current) ?? []) {
      if (!reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
    }
  }
  for (const chapter of curriculum.chapters) {
    if (!reached.has(chapter.id)) problems.push(`${chapter.id} is not reachable from the start`);
  }

  // Every competency must be taught by at least one lesson.
  const taught = new Set(curriculum.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.competency)));
  for (const competency of curriculum.competencies) {
    if (!taught.has(competency.id)) problems.push(`competency ${competency.id} has no lesson`);
  }
  return problems;
}
