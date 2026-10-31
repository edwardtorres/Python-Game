import { expect, test } from '@playwright/test';
import { CHAPTER3_BOSS, CHAPTER3_CHOICE, CHAPTER3_GRADED } from '../src/content/chapter3/index';
import { logPageErrors, setCode } from './helpers';
import {
  answerChoiceItem,
  bossOneByOne,
  expectAccessible,
  expectNoSidewaysScroll,
  findItem,
  lastLine,
  recordedOutput,
  SUBMITTED,
  ticketWrongThenRight,
  VIEWPORTS,
} from './chapter-flows';

// Chapter 3 at a 390 px phone and a 1280 px desktop. Every interaction is a tap.
const CHAPTER = '/#/chapter/c03-testing';
const BOSS = '/#/boss/c03-testing';

for (const viewport of VIEWPORTS) {
  test.describe(`Chapter 3 at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: true });

    test('reads a lesson, runs its example, and marks it read', async ({ page }) => {
      logPageErrors(page);
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /Assert statements/ }).tap();
      await expect(page.getByRole('heading', { level: 1, name: 'Assert statements' })).toBeVisible();
      await page.getByRole('button', { name: 'Run', exact: true }).first().tap();
      await expect(page.getByLabel('Output').first()).toContainText(recordedOutput('chapter3.outputs.json', 'c03-assert-1'), { timeout: 120_000 });
      await page.getByRole('button', { name: 'Mark as read' }).tap();
      await expect(page.getByRole('button', { name: 'Marked as read' })).toBeVisible();
      await expectAccessible(page);
      await expectNoSidewaysScroll(page);
    });

    test('answers an assert predict item: a wrong pick names its mistake, then the right pick passes', async ({ page }) => {
      const item = CHAPTER3_CHOICE.find((candidate) => candidate.id === 'c03-predict-assert-message');
      if (item === undefined) throw new Error('no assert item');
      await answerChoiceItem(page, CHAPTER, /What does the failed check say/, item.title, 'message-dropped', 'ASSERT_MESSAGE_OMITTED');
      await expectNoSidewaysScroll(page);
    });

    test('a weak suite names the bug it misses, and a strong suite passes', async ({ page }) => {
      logPageErrors(page);
      const item = findItem(CHAPTER3_GRADED, 'c03-testing-parse-weight');
      const missed = item.mutants?.find((mutant) => mutant.id === 'no-fallback');
      if (missed === undefined || item.weakTests === undefined || item.modelTests === undefined) throw new Error('testing item is missing its suites');
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /Tests for parse_weight/ }).tap();
      await expect(page.getByRole('heading', { level: 1, name: item.title })).toBeVisible();
      await setCode(page, item.id, item.weakTests);
      await expect(page.getByRole('textbox', { name: `Code for ${item.title}` })).toContainText(lastLine(item.weakTests));
      await page.getByRole('button', { name: 'Submit' }).tap();
      await expect(page.getByText(`Likely mistake: ${missed.mistake.title}`)).toBeVisible({ timeout: 120_000 });
      await expectAccessible(page);
      await expectNoSidewaysScroll(page);
      await setCode(page, item.id, item.modelTests);
      await expect(page.getByRole('textbox', { name: `Code for ${item.title}` })).toContainText(lastLine(item.modelTests));
      await page.getByRole('button', { name: 'Submit' }).tap();
      await expect(page.getByText(SUBMITTED)).toBeVisible({ timeout: 120_000 });
    });

    test('a test-driven fix: a wrong fix names its mistake, then the owner tests pass', async ({ page }) => {
      const ticket = findItem(CHAPTER3_GRADED, 'c03-suite-fix-dock-count');
      const wrong = ticket.variants.find((variant) => variant.id === 'counts-lines');
      if (wrong === undefined) throw new Error('no wrong variant counts-lines');
      await ticketWrongThenRight(page, CHAPTER, /Fix: count the docks/, ticket, wrong.code, wrong.mistake.title, ticket.reference);
      await expectNoSidewaysScroll(page);
    });

    test('completes the testing boss, one part at a time', async ({ page }) => {
      await bossOneByOne(
        page,
        BOSS,
        'The report tests',
        CHAPTER3_BOSS.map((part) => ({ id: part.id, title: part.title, code: part.modelTests ?? '' })),
      );
    });
  });
}
