import { expect, test } from '@playwright/test';
import { clean, openTicket } from './helpers';

// Production build only. A second and third worker in one page must start, because the
// engine replaces its worker after a stop or a memory restart. WebKit refused a second
// worker when the dev server revalidated the script, so this probes the built files.
test('second and third workers start Python under the production headers', async ({ page }) => {
  test.setTimeout(180_000);
  await openTicket(page, clean.title);
  await page.getByRole('button', { name: 'Run visible checks' }).click();
  await expect(page.getByRole('status').filter({ hasText: /./ }).first()).toBeVisible({ timeout: 120_000 });

  const result = await page.evaluate(async () => {
    const url = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) => name.includes('/assets/worker-') && name.endsWith('.js'));
    if (url === undefined) return { error: 'the built worker script was not found' };
    const replies: Array<{ ok: boolean; error: string }> = [];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const worker = new Worker(url, { type: 'module' });
      const reply = await new Promise<{ ok: boolean; error: string }>((resolve) => {
        const timer = setTimeout(() => resolve({ ok: false, error: 'timed out' }), 90_000);
        worker.onmessage = (event: MessageEvent<{ ok: boolean; error?: { message: string } }>) => {
          clearTimeout(timer);
          resolve({ ok: event.data.ok, error: event.data.error?.message ?? '' });
        };
        worker.onerror = (event: ErrorEvent) => {
          clearTimeout(timer);
          resolve({ ok: false, error: event.message || 'the worker failed to load' });
        };
        worker.postMessage({ id: 1, op: 'init' });
      });
      worker.terminate();
      replies.push(reply);
    }
    return { url, replies };
  });

  expect(result, JSON.stringify(result)).not.toHaveProperty('error');
  expect((result as { replies: Array<{ ok: boolean }> }).replies.map((reply) => reply.ok)).toEqual([true, true]);
});
