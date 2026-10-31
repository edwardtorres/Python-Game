// Shared flows for the chapter specs. Every interaction is a tap, the browser is a touch device, and
// each main view runs axe and a sideways-scroll check. Expected output comes from the recorded outputs.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { logPageErrors, setCode } from './helpers';

export const VIEWPORTS = [
  { name: '390 px phone', width: 390, height: 844 },
  { name: '1280 px desktop', width: 1280, height: 800 },
];
export const SUBMITTED = 'Submitted. Every check passed.';

// The last line differs between a broken starter and the reference, so waiting for it shows that the
// editor holds the code under test.
export function lastLine(code: string): string {
  return code.trim().split('\n').pop() ?? '';
}

export function findItem<T extends { id: string }>(items: readonly T[], id: string): T {
  const found = items.find((candidate) => candidate.id === id);
  if (found === undefined) throw new Error(`no item ${id}`);
  return found;
}

// The recorded stdout of an example, read from the generated outputs file.
export function recordedOutput(chapterFile: string, exampleId: string): string {
  const outputs = JSON.parse(fs.readFileSync(path.resolve(`src/content/generated/${chapterFile}`), 'utf8')) as {
    examples: Record<string, { stdout: string }>;
  };
  const stdout = outputs.examples[exampleId]?.stdout;
  if (stdout === undefined) throw new Error(`no recorded output for ${exampleId}`);
  return stdout.split('\n')[0] ?? '';
}

export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  expect(serious, JSON.stringify(serious.map((violation) => violation.id))).toEqual([]);
}

export async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

// A predict or traceback item: a wrong pick names its mistake, then the right pick passes.
export async function answerChoiceItem(page: Page, chapter: string, linkName: RegExp, heading: string, wrongValue: string, mistakeTag: string) {
  logPageErrors(page);
  await page.goto(chapter);
  await page.getByRole('link', { name: linkName }).tap();
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await page.locator('label', { has: page.locator(`input[value="${wrongValue}"]`) }).tap();
  await page.getByRole('button', { name: 'Check my answer' }).tap();
  await expect(page.getByText(`Likely mistake (${mistakeTag})`)).toBeVisible();
  await expectAccessible(page);
  await expectNoSidewaysScroll(page);
  await page.locator('label', { has: page.locator('input[value="true"]') }).tap();
  await page.getByRole('button', { name: 'Check my answer' }).tap();
  await expect(page.getByText('Correct.', { exact: true })).toBeVisible();
}

// A ticket: a wrong attempt shows its mistake, then the right code passes.
export async function ticketWrongThenRight(
  page: Page,
  chapter: string,
  linkName: RegExp,
  ticket: { id: string; title: string },
  wrongCode: string,
  mistakeTitle: string,
  rightCode: string,
) {
  logPageErrors(page);
  await page.goto(chapter);
  await page.getByRole('link', { name: linkName }).tap();
  await expect(page.getByRole('heading', { level: 1, name: ticket.title })).toBeVisible();
  await setCode(page, ticket.id, wrongCode);
  await expect(page.getByRole('textbox', { name: `Code for ${ticket.title}` })).toContainText(lastLine(wrongCode));
  await page.getByRole('button', { name: 'Submit' }).tap();
  await expect(page.getByText(`Likely mistake: ${mistakeTitle}`)).toBeVisible({ timeout: 120_000 });
  await expectAccessible(page);
  await expectNoSidewaysScroll(page);
  await setCode(page, ticket.id, rightCode);
  await expect(page.getByRole('textbox', { name: `Code for ${ticket.title}` })).toContainText(lastLine(rightCode));
  await page.getByRole('button', { name: 'Submit' }).tap();
  await expect(page.getByText(SUBMITTED)).toBeVisible({ timeout: 120_000 });
}

// The boss: each part opens after the one before it passes. Each part is submitted with its right code.
export async function bossOneByOne(page: Page, bossHref: string, bossTitle: string, parts: Array<{ id: string; title: string; code: string }>) {
  logPageErrors(page);
  await page.goto(bossHref);
  await expect(page.getByRole('heading', { level: 1, name: bossTitle })).toBeVisible();
  await expectAccessible(page);
  await expectNoSidewaysScroll(page);
  for (const [index, part] of parts.entries()) {
    await expect(page.getByRole('heading', { name: new RegExp(`Part ${index + 1} of ${parts.length}`) })).toBeVisible();
    await setCode(page, part.id, part.code);
    await expect(page.getByRole('textbox', { name: `Code for ${part.title}` })).toContainText(lastLine(part.code));
    await page.getByRole('button', { name: 'Submit' }).tap();
    if (index + 1 < parts.length) {
      await expect(page.getByRole('heading', { name: new RegExp(`Part ${index + 2} of ${parts.length}`) })).toBeVisible({ timeout: 120_000 });
    } else {
      await expect(page.getByText('Passed', { exact: true })).toHaveCount(parts.length, { timeout: 120_000 });
    }
  }
}

export { test };
