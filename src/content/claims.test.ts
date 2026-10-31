// The lesson claims manifest. docs/lesson-claims.json lists each section and JavaScript note with
// its doc-dependent flag and quote ids. The docs-quotes job reads that file (scripts/check-quotes.mjs),
// so this test keeps it in step with the lessons. Set UPDATE_CLAIMS=1 to rewrite the file.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHAPTERS } from './chapters';

const MANIFEST = path.resolve('docs/lesson-claims.json');
const QUOTES = path.resolve('docs/quotes.json');

const claims = CHAPTERS.flatMap((chapter) => chapter.lessons).map((lesson) => ({
  lesson: lesson.id,
  sections: lesson.sections.map((section) => ({ id: section.id, docClaim: section.docClaim, quotes: section.quotes })),
  jsNotes: lesson.jsNotes.map((note) => ({ id: note.id, quotes: note.quotes })),
}));

const quoteIds = new Set((JSON.parse(fs.readFileSync(QUOTES, 'utf8')) as Array<{ id: string }>).map((entry) => entry.id));

describe('lesson claims', () => {
  it('the manifest matches the lessons (regenerate with UPDATE_CLAIMS=1)', () => {
    const text = `${JSON.stringify(claims, null, 2)}\n`;
    if (process.env.UPDATE_CLAIMS === '1') fs.writeFileSync(MANIFEST, text);
    expect(fs.readFileSync(MANIFEST, 'utf8')).toBe(text);
  });

  it('every doc-dependent section and every JavaScript note cites a quote that exists', () => {
    for (const lesson of claims) {
      for (const section of lesson.sections) {
        if (section.docClaim) expect(section.quotes.length, `${lesson.lesson} / ${section.id}`).toBeGreaterThan(0);
        for (const id of section.quotes) expect(quoteIds.has(id), `${id} is not in docs/quotes.json`).toBe(true);
      }
      for (const note of lesson.jsNotes) {
        expect(note.quotes.length, `${lesson.lesson} / ${note.id}`).toBeGreaterThan(0);
        for (const id of note.quotes) expect(quoteIds.has(id), `${id} is not in docs/quotes.json`).toBe(true);
      }
    }
  });
});
