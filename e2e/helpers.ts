import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { CHALLENGES } from '../src/challenges/registry';

export const clean = CHALLENGES[0]!;
export const churn = CHALLENGES[1]!;
export const chart = CHALLENGES[2]!;

export async function openTicket(page: Page, title: string): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(title) }).click();
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

// The dev-only test bridge sets editor code directly, so a test does not type into CodeMirror.
export async function setCode(page: Page, challengeId: string, code: string): Promise<void> {
  await page.evaluate(
    ([id, value]) => {
      const bridge = (window as unknown as { __LARKSPUR_TEST__: { setCode(id: string, code: string): void } }).__LARKSPUR_TEST__;
      bridge.setCode(id, value);
    },
    [challengeId, code] as const,
  );
}

export async function setCell(page: Page, challengeId: string, index: number, code: string): Promise<void> {
  await page.evaluate(
    ([id, position, value]) => {
      const bridge = (window as unknown as { __LARKSPUR_TEST__: { setCell(id: string, index: number, code: string): void } }).__LARKSPUR_TEST__;
      bridge.setCell(id, position, value);
    },
    [challengeId, index, code] as const,
  );
}

// Waits for a feedback line. On failure it prints the page's text (the whole body, so the
// engine status line is included), the engine stats, and any console or page errors, so a
// CI failure says what the page showed.
export async function expectFeedback(page: Page, text: string | RegExp, timeout = 120_000): Promise<void> {
  try {
    await expect(page.getByText(text)).toBeVisible({ timeout });
  } catch (error) {
    const main = await page.locator('body').innerText().catch(() => '<no body element>');
    const stats = await page
      .evaluate(() => (window as unknown as { __LARKSPUR_TEST__?: { status(): unknown } }).__LARKSPUR_TEST__?.status() ?? null)
      .catch((reason: unknown) => `status unavailable: ${String(reason)}`);
    console.log(`FEEDBACK DUMP waiting for ${String(text)}\nMAIN:\n${main}\nSTATS: ${JSON.stringify(stats)}`);
    throw error;
  }
}

// Records console messages and uncaught errors for the test, for the CI log.
export function logPageErrors(page: Page): void {
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') console.log(`CONSOLE ${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => console.log(`PAGEERROR: ${error.message}`));
  page.on('worker', (worker) => {
    console.log(`WORKER created: ${worker.url()}`);
    worker.on('console', (message) => console.log(`WORKER console: ${message.text()}`));
  });
}
