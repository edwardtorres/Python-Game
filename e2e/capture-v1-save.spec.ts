import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { churn, clean, logPageErrors, setCode } from './helpers';

// Captures a real version 1 save from the app as it ships in Step 1. The save migration
// test loads the result, so the schema change is tested against what learners actually
// have. Run it once, before the save schema changes:
//   CAPTURE_V1=1 npx playwright test e2e/capture-v1-save.spec.ts --project=chromium
const FIXTURE = fileURLToPath(new URL('./fixtures/save-v1.json', import.meta.url));

test.describe('capture a real version 1 save', () => {
  test.skip(!process.env.CAPTURE_V1, 'run with CAPTURE_V1=1 to rewrite e2e/fixtures/save-v1.json');

  test('a learner passes one ticket, hints at another, and attempts it', async ({ page }) => {
    logPageErrors(page);
    await page.goto('/');
    await page.getByRole('button', { name: new RegExp(clean.title) }).click();
    await setCode(page, clean.id, clean.reference);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Submitted. Every check passed.')).toBeVisible({ timeout: 120_000 });

    await page.getByRole('button', { name: new RegExp(churn.title) }).click();
    await page.getByRole('button', { name: /Show a hint \(0 of 3\)/ }).click();
    const variant = churn.variants[0];
    await setCode(page, churn.id, variant?.code ?? '');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Wait for the save to hold both results, then take the stored text as it is.
    await page.waitForFunction(
      ([passed, attempted]) => {
        const raw = window.localStorage.getItem('larkspur.save');
        if (raw === null) return false;
        const save = JSON.parse(raw) as { challenges?: Record<string, { status?: string; attempts?: number }> };
        return save.challenges?.[passed]?.status === 'passed' && (save.challenges?.[attempted]?.attempts ?? 0) === 1;
      },
      [clean.id, churn.id] as const,
      { timeout: 120_000 },
    );
    const raw = await page.evaluate(() => window.localStorage.getItem('larkspur.save'));
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? '{}') as { schema?: number };
    expect(parsed.schema).toBe(1);
    fs.mkdirSync(fileURLToPath(new URL('./fixtures/', import.meta.url)), { recursive: true });
    fs.writeFileSync(FIXTURE, `${JSON.stringify(parsed, null, 2)}\n`);
  });
});
