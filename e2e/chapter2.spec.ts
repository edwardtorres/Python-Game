import { expect, test } from '@playwright/test';
import { CHAPTER2_BOSS, CHAPTER2_GRADED } from '../src/content/chapter2/index';
import { logPageErrors, setCode } from './helpers';
import { answerChoiceItem, bossOneByOne, expectAccessible, expectNoSidewaysScroll, findItem, recordedOutput, ticketWrongThenRight, VIEWPORTS } from './chapter-flows';

// Chapter 2 at a 390 px phone and a 1280 px desktop. Every interaction is a tap.
const CHAPTER = '/#/chapter/c02-informatics';
const BOSS = '/#/boss/c02-informatics';

for (const viewport of VIEWPORTS) {
  test.describe(`Chapter 2 at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: true });

    test('reads a lesson, runs its example, and marks it read', async ({ page }) => {
      logPageErrors(page);
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /Classes and instances/ }).tap();
      await expect(page.getByRole('heading', { level: 1, name: 'Classes and instances' })).toBeVisible();
      await page.getByRole('button', { name: 'Run', exact: true }).first().tap();
      await expect(page.getByLabel('Output').first()).toContainText(recordedOutput('chapter2.outputs.json', 'c02-classes-1'), { timeout: 120_000 });
      await page.getByRole('button', { name: 'Mark as read' }).tap();
      await expect(page.getByRole('button', { name: 'Marked as read' })).toBeVisible();
      await expectAccessible(page);
      await expectNoSidewaysScroll(page);
    });

    test('answers a predict item: a wrong pick names its mistake, then the right pick passes', async ({ page }) => {
      await answerChoiceItem(page, CHAPTER, /How many comparisons does each lookup make/, 'How many comparisons does each lookup make?', 'set-scans', 'BIGO_LIST_LOOKUP');
      await expectNoSidewaysScroll(page);
    });

    test('reads a traceback: a wrong error names its mistake, then the right error passes', async ({ page }) => {
      await answerChoiceItem(page, CHAPTER, /Which error stops the set/, 'Which error stops the set?', 'set-append', 'SET_ORDER_ASSUMPTION');
    });

    test('completes a function ticket after one wrong attempt that shows its mistake', async ({ page }) => {
      const ticket = findItem(CHAPTER2_GRADED, 'c02-guided-depth');
      const wrong = ticket.variants.find((variant) => variant.id === 'no-plus-one');
      if (wrong === undefined) throw new Error('no wrong variant no-plus-one');
      await ticketWrongThenRight(page, CHAPTER, /Guided: how deep is a nested list/, ticket, wrong.code, wrong.mistake.title, ticket.reference);
      await expectNoSidewaysScroll(page);
    });

    test('completes a structure ticket after one wrong attempt that shows its mistake', async ({ page }) => {
      const ticket = findItem(CHAPTER2_GRADED, 'c02-structure-queue-popleft');
      const wrong = ticket.variants.find((variant) => variant.id === 'pop-zero');
      if (wrong === undefined) throw new Error('no wrong variant pop-zero');
      await ticketWrongThenRight(page, CHAPTER, /Structure: serve the queue from the front/, ticket, wrong.code, wrong.mistake.title, ticket.reference);
    });

    test('completes a class ticket after one wrong attempt that shows its mistake', async ({ page }) => {
      const ticket = findItem(CHAPTER2_GRADED, 'c02-class-version-dunders');
      const wrong = ticket.variants.find((variant) => variant.id === 'no-lt');
      if (wrong === undefined) throw new Error('no wrong variant no-lt');
      await ticketWrongThenRight(page, CHAPTER, /Class: versions with __repr__ and __lt__/, ticket, wrong.code, wrong.mistake.title, ticket.reference);
    });

    test('an efficiency ticket: the slow version takes too long and names its mistake, then the fast one passes', async ({ page }) => {
      const ticket = findItem(CHAPTER2_GRADED, 'c02-eff-stock-check');
      const slow = ticket.variants.find((variant) => variant.id === 'list-lookup');
      if (slow === undefined) throw new Error('no slow variant list-lookup');
      logPageErrors(page);
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /Efficiency: check order lines against the catalog/ }).tap();
      await expect(page.getByRole('heading', { level: 1, name: ticket.title })).toBeVisible();
      await setCode(page, ticket.id, slow.code);
      await page.getByRole('button', { name: 'Submit' }).tap();
      // The slow version's timed visible case takes more than 50 times the reference, and the feedback says so before the mistake.
      await expect(page.getByText(/took [\d.]+ ms, and the reference took/)).toBeVisible({ timeout: 180_000 });
      await expect(page.getByText(`Likely mistake: ${slow.mistake.title}`)).toBeVisible({ timeout: 180_000 });
      await expectAccessible(page);
      await expectNoSidewaysScroll(page);
      await setCode(page, ticket.id, ticket.reference);
      await page.getByRole('button', { name: 'Submit' }).tap();
      await expect(page.getByText(/Submitted\. Every check passed\./)).toBeVisible({ timeout: 180_000 });
    });

    test('completes the boss, one part at a time', async ({ page }) => {
      await bossOneByOne(
        page,
        BOSS,
        'The dock dispatch board',
        CHAPTER2_BOSS.map((part) => ({ id: part.id, title: part.title, code: part.reference })),
      );
      await expect(page.getByText('Passed', { exact: true })).toHaveCount(CHAPTER2_BOSS.length);
    });
  });
}
