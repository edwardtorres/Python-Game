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
