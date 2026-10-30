import { expect, test } from '@playwright/test';
import { clean, openTicket, setCode } from './helpers';

const RUNAWAY = 'while True:\n    pass\n';

// A first run starts Python (a few seconds). Warm the engine first, so a stop lands on the loop.
async function warmEngine(page: import('@playwright/test').Page, title: string): Promise<void> {
  await openTicket(page, title);
  await setCode(page, clean.id, clean.reference);
  await page.getByRole('button', { name: 'Run visible checks' }).click();
  await expect(page.getByText('The visible checks passed. Submit to run the hidden checks.')).toBeVisible({ timeout: 120_000 });
}

test.describe('stopping and recovering the engine', () => {
  test('the buffer stops a runaway loop without restarting the engine', async ({ page }) => {
    await warmEngine(page, clean.title);
    await setCode(page, clean.id, RUNAWAY);
    await page.getByRole('button', { name: 'Submit' }).click();
    const stop = page.getByRole('button', { name: 'Stop' });
    await expect(stop).toBeVisible({ timeout: 90_000 });
    await page.waitForTimeout(1_500);
    const clicked = Date.now();
    await stop.click();
    await expect(page.getByRole('status').filter({ hasText: /^Stopped\.$/ })).toBeVisible({ timeout: 10_000 });
    expect(Date.now() - clicked).toBeLessThan(4_000);
    const stats = await page.evaluate(() => (window as unknown as { __LARKSPUR_TEST__: { status(): { restarts: Record<string, number> } } }).__LARKSPUR_TEST__.status());
    expect(stats.restarts.interrupt).toBe(0);
  });

  test('when the buffer is ignored, the engine restarts after two seconds and keeps working', async ({ page }) => {
    await page.goto('/?forceInterruptFailure=1');
    await page.getByRole('button', { name: new RegExp(clean.title) }).click();
    await setCode(page, clean.id, clean.reference);
    await page.getByRole('button', { name: 'Run visible checks' }).click();
    await expect(page.getByText('The visible checks passed. Submit to run the hidden checks.')).toBeVisible({ timeout: 120_000 });
    await setCode(page, clean.id, RUNAWAY);
    await page.getByRole('button', { name: 'Submit' }).click();
    const stop = page.getByRole('button', { name: 'Stop' });
    await expect(stop).toBeVisible({ timeout: 90_000 });
    // Let the loop start before stopping, so the buffer is raised and then ignored.
    await page.waitForTimeout(1_500);
    await stop.click();
    await expect(page.getByText(/did not confirm the stop in time/)).toBeVisible({ timeout: 15_000 });
    await setCode(page, clean.id, clean.reference);
    await page.getByRole('button', { name: 'Run visible checks' }).click();
    await expect(page.getByText('The visible checks passed. Submit to run the hidden checks.')).toBeVisible({ timeout: 120_000 });
    const stats = await page.evaluate(() => (window as unknown as { __LARKSPUR_TEST__: { status(): { restarts: Record<string, number> } } }).__LARKSPUR_TEST__.status());
    expect(stats.restarts.interrupt).toBe(1);
  });

  test('worker memory over the threshold restarts the engine between runs', async ({ page }) => {
    await page.goto('/?recycleThresholdBytes=1');
    await page.getByRole('button', { name: new RegExp(clean.title) }).click();
    await setCode(page, clean.id, clean.reference);
    await page.getByRole('button', { name: 'Run visible checks' }).click();
    await expect(page.getByText('The engine restarted to free memory.')).toBeVisible({ timeout: 120_000 });
    await page.getByRole('button', { name: 'Run visible checks' }).click();
    await expect(page.getByText('The visible checks passed. Submit to run the hidden checks.')).toBeVisible({ timeout: 120_000 });
  });

  test('a Python engine that never starts shows a clear timeout message', async ({ page }) => {
    await page.route('**/pyodide/pyodide.mjs', () => {
      // Never answer: the engine must time out and say so, instead of spinning forever.
    });
    await openTicket(page, clean.title);
    await setCode(page, clean.id, clean.reference);
    await page.getByRole('button', { name: 'Run visible checks' }).click();
    await expect(page.getByRole('alert').or(page.getByRole('status').filter({ hasText: /did not start within 30 seconds/ }))).toBeVisible({ timeout: 60_000 });
  });
});
