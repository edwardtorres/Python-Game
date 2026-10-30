import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { CHAPTER1_BOSS, CHAPTER1_GRADED } from '../src/content/chapter1/index';
import { logPageErrors, setCode } from './helpers';

// Chapter 1 at a 390 px phone and a 1280 px desktop. Every interaction is a tap, so the
// browser is a touch device (hasTouch). Each main view runs axe and a sideways-scroll check.
const CHAPTER = '/#/chapter/c01-foundations';
const VIEWPORTS = [
  { name: '390 px phone', width: 390, height: 844 },
  { name: '1280 px desktop', width: 1280, height: 800 },
];
const SUBMITTED = 'Submitted. Every check passed.';

// The last line differs between a broken starter and the reference, so waiting for it
// shows that the editor holds the code under test.
function lastLine(code: string): string {
  return code.trim().split('\n').pop() ?? '';
}

function spec(id: string) {
  const found = [...CHAPTER1_GRADED, ...CHAPTER1_BOSS].find((candidate) => candidate.id === id);
  if (found === undefined) throw new Error(`no spec ${id}`);
  return found;
}

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  expect(serious, JSON.stringify(serious.map((violation) => violation.id))).toEqual([]);
}

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const viewport of VIEWPORTS) {
  test.describe(`Chapter 1 at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: true });

    test('reads a lesson, runs its example, and marks it read', async ({ page }) => {
      logPageErrors(page);
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /Types and conversions/ }).tap();
      await expect(page.getByRole('heading', { level: 1, name: 'Types and conversions' })).toBeVisible();
      await page.getByRole('button', { name: 'Run', exact: true }).first().tap();
      await expect(page.getByLabel('Output').first()).toContainText('43 5.0 7!', { timeout: 120_000 });
      await page.getByRole('button', { name: 'Mark as read' }).tap();
      await expect(page.getByRole('button', { name: 'Marked as read' })).toBeVisible();
      await expectAccessible(page);
      await expectNoSidewaysScroll(page);
    });

    test('answers a predict item: a wrong pick names its mistake, then the right pick passes', async ({ page }) => {
      logPageErrors(page);
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /What does \/ give\?/ }).tap();
      await expect(page.getByRole('heading', { level: 1, name: 'What does / give?' })).toBeVisible();
      await page.locator('label', { has: page.locator('input[value="floor"]') }).tap();
      await page.getByRole('button', { name: 'Check my answer' }).tap();
      await expect(page.getByText('Likely mistake (INT_DIVISION)')).toBeVisible();
      await expectAccessible(page);
      await expectNoSidewaysScroll(page);
      await page.locator('label', { has: page.locator('input[value="true"]') }).tap();
      await page.getByRole('button', { name: 'Check my answer' }).tap();
      await expect(page.getByText('Correct.', { exact: true })).toBeVisible();
    });

    test('reads a traceback: a wrong cause names its mistake, then the right cause passes', async ({ page }) => {
      logPageErrors(page);
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /A missing key/ }).tap();
      await page.locator('label', { has: page.locator('input[value="list-index"]') }).tap();
      await page.getByRole('button', { name: 'Check my answer' }).tap();
      await expect(page.getByText('Likely mistake (KEYERROR_VS_GET)')).toBeVisible();
      await page.locator('label', { has: page.locator('input[value="true"]') }).tap();
      await page.getByRole('button', { name: 'Check my answer' }).tap();
      await expect(page.getByText('Correct.', { exact: true })).toBeVisible();
      await expectNoSidewaysScroll(page);
    });

    test('completes a function ticket after one wrong attempt that shows its mistake', async ({ page }) => {
      logPageErrors(page);
      const ticket = spec('c01-ticket-unique-routes');
      const wrong = ticket.variants.find((variant) => variant.id === 'keeps-repeats');
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /Ticket: unique routes/ }).tap();
      await expect(page.getByRole('heading', { level: 1, name: 'Ticket: unique routes' })).toBeVisible();
      await setCode(page, ticket.id, wrong?.code ?? '');
      await expect(page.getByRole('textbox', { name: `Code for ${ticket.title}` })).toContainText(lastLine(wrong?.code ?? ''));
      await page.getByRole('button', { name: 'Submit' }).tap();
      await expect(page.getByText('Likely mistake: A set is not a list')).toBeVisible({ timeout: 120_000 });
      await expectAccessible(page);
      await expectNoSidewaysScroll(page);
      await setCode(page, ticket.id, ticket.reference);
      await expect(page.getByRole('textbox', { name: `Code for ${ticket.title}` })).toContainText(lastLine(ticket.reference));
      await page.getByRole('button', { name: 'Submit' }).tap();
      await expect(page.getByText(SUBMITTED)).toBeVisible({ timeout: 120_000 });
    });

    test('completes a fix-the-bug ticket', async ({ page }) => {
      logPageErrors(page);
      const fix = spec('c01-fix-with-extra');
      await page.goto(CHAPTER);
      await page.getByRole('link', { name: /Fix: add a parcel to the end/ }).tap();
      await expect(page.getByRole('heading', { level: 1, name: 'Fix: add a parcel to the end' })).toBeVisible();
      await setCode(page, fix.id, fix.reference);
      await expect(page.getByRole('textbox', { name: `Code for ${fix.title}` })).toContainText(lastLine(fix.reference));
      await page.getByRole('button', { name: 'Submit' }).tap();
      await expect(page.getByText(SUBMITTED)).toBeVisible({ timeout: 120_000 });
      await expectNoSidewaysScroll(page);
    });

    test('completes the boss, one part at a time', async ({ page }) => {
      logPageErrors(page);
      await page.goto('/#/boss');
      await expect(page.getByRole('heading', { level: 1, name: 'The weekly word report' })).toBeVisible();
      await expectAccessible(page);
      await expectNoSidewaysScroll(page);
      for (const [index, part] of CHAPTER1_BOSS.entries()) {
        await expect(page.getByRole('heading', { name: new RegExp(`Part ${index + 1} of ${CHAPTER1_BOSS.length}`) })).toBeVisible();
        await setCode(page, part.id, part.reference);
        // Wait for the editor to hold the reference, so Submit grades the code under test.
        await expect(page.getByRole('textbox', { name: `Code for ${part.title}` })).toContainText(lastLine(part.reference));
        await page.getByRole('button', { name: 'Submit' }).tap();
        // A passed part leaves the page at once, so wait for the state that stays: the next
        // part opens, or on the last part all four are marked Passed.
        if (index + 1 < CHAPTER1_BOSS.length) {
          await expect(page.getByRole('heading', { name: new RegExp(`Part ${index + 2} of ${CHAPTER1_BOSS.length}`) })).toBeVisible({ timeout: 120_000 });
        } else {
          await expect(page.getByText('Passed', { exact: true })).toHaveCount(CHAPTER1_BOSS.length, { timeout: 120_000 });
        }
      }
    });
  });
}
