import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { chart, churn, clean, openTicket, setCell, setCode } from './helpers';

const LONG_MISTAKE = /Likely mistake: round\(\) rounds halves to even/;

test.describe('the first ticket', () => {
  test('is accessible and fits a 390 px phone without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openTicket(page, clean.title);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
    expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('Run shows the visible checks, and Submit with the reference passes every check', async ({ page }) => {
    await openTicket(page, clean.title);
    await setCode(page, clean.id, clean.reference);
    await page.getByRole('button', { name: 'Run visible checks' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'The visible checks passed' })).toBeVisible({ timeout: 90_000 });
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Submitted. Every check passed.')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText('(hidden check)').first()).toBeVisible();
  });

  test('a wrong variant gets its mistake explained', async ({ page }) => {
    await openTicket(page, clean.title);
    const variant = clean.variants.find((candidate) => candidate.id === 'round-builtin');
    await setCode(page, clean.id, variant?.code ?? '');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText(LONG_MISTAKE)).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText('Mistake type: rounding')).toBeVisible();
  });

  test('hints open one tier at a time, and the solution unlocks after three failed submissions', async ({ page }) => {
    await openTicket(page, clean.title);
    await expect(page.getByRole('button', { name: 'Show the solution (reduced credit)' })).toHaveCount(0);
    await page.getByRole('button', { name: /Show a hint \(0 of 3\)/ }).click();
    await expect(page.getByText(/Hint 1:/)).toBeVisible();
    await expect(page.getByText(/Hint 2:/)).toHaveCount(0);
    await setCode(page, clean.id, 'def clean_weights(values):\n    return []\n');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.getByRole('button', { name: 'Submit' }).click();
      await expect(page.getByText(/checks passed\./).first()).toBeVisible({ timeout: 90_000 });
    }
    await page.getByRole('button', { name: 'Show the solution (reduced credit)' }).click();
    await expect(page.getByText(/does not count toward mastery/)).toBeVisible();
  });

  test('a pandas notebook loads the visible export and renders a table', async ({ page }) => {
    await openTicket(page, churn.title);
    await expect(page.getByTestId('notebook')).toBeVisible();
    await page.getByRole('button', { name: 'Run cell 1' }).click();
    const output = page.getByLabel('Cell output').first();
    await expect(output.locator('table')).toBeVisible({ timeout: 90_000 });
  });

  test('a notebook cell can draw a chart and show it inline', async ({ page }) => {
    await openTicket(page, churn.title);
    await setCell(page, churn.id, 1, "import matplotlib.pyplot as plt\nplt.bar(['a', 'b'], [1, 2])\nplt.title('demo')\nplt.gcf()");
    await page.getByRole('button', { name: 'Run cell 2' }).click();
    await expect(page.getByRole('img', { name: 'Chart output 1' })).toBeVisible({ timeout: 90_000 });
  });

  test('the chart task grades the figure object and names a wrong chart type', async ({ page }) => {
    await openTicket(page, chart.title);
    const variant = chart.variants.find((candidate) => candidate.id === 'line-chart');
    await setCode(page, chart.id, variant?.code ?? '');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Likely mistake: A line chart for categories')).toBeVisible({ timeout: 120_000 });
  });
});
