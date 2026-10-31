import { expect, test } from '@playwright/test';
import { clean, expectFeedback, logPageErrors, openTicket } from './helpers';

// The production build has no test bridge, so the test types the code like a learner.
// insertText keeps the spaces as spaces; fill() on a contenteditable can insert non-breaking ones.
async function typeCode(page: import('@playwright/test').Page, id: string, code: string): Promise<void> {
  const editor = page.locator(`[data-editor="${id}"] .cm-content`);
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(code);
}

// A refused style means the production policy blocks CodeMirror's injected theme, so the editor is unstyled.
const STYLE_REFUSAL = /Refused to apply a stylesheet|violates the following Content Security Policy/;

// These run against the production build (the preview server), with the production CSP.
test.describe('production build', () => {
  test('loads Python under the production Content-Security-Policy and grades a function', async ({ page }) => {
    logPageErrors(page);
    const refusals: string[] = [];
    page.on('console', (message) => {
      if (STYLE_REFUSAL.test(message.text())) refusals.push(message.text());
    });
    await openTicket(page, clean.title);
    await typeCode(page, clean.id, clean.reference);
    await page.getByRole('button', { name: 'Submit' }).click();
    // On a failure, expectFeedback prints the page text and the engine stats for the CI log.
    await expectFeedback(page, 'Submitted. Every check passed.');
    // The production policy must not refuse the editor's injected style. A refusal names the hash to add.
    expect(refusals).toEqual([]);
  });

  test('a policy without wasm-unsafe-eval fails at once with a clear message', async ({ page }) => {
    await page.route('**/', async (route) => {
      const response = await route.fetch();
      // The meta content HTML-escapes its quotes, so replace the token itself.
      const body = (await response.text()).replaceAll('wasm-unsafe-eval', 'unlisted');
      await route.fulfill({ response, body, headers: { ...response.headers(), 'content-type': 'text/html; charset=utf-8' } });
    });
    await openTicket(page, clean.title);
    await typeCode(page, clean.id, clean.reference);
    await page.getByRole('button', { name: 'Run visible checks' }).click();
    await expect(page.getByRole('status').filter({ hasText: /blocks WebAssembly/ }).or(page.getByText(/blocks WebAssembly/))).toBeVisible({ timeout: 15_000 });
  });
});
