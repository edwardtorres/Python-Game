import { expect, test, type Page } from '@playwright/test';
import { CHAPTER2_GRADED } from '../src/content/chapter2/index';
import { findItem } from './chapter-flows';
import { logPageErrors } from './helpers';

// Each efficiency item with its slow variant. Runs in both dev projects, so the margins come from
// the browser's own Python engine. The conditions are the owner's: the slow variant is at least 50
// times slower than the reference, and the reference stays under 50 ms for every timed case.
const MEASURED = [
  { id: 'c02-eff-repeated-tickets', slow: 'slow-scan' },
  { id: 'c02-eff-job-queue', slow: 'list-front-pop' },
  { id: 'c02-eff-stock-check', slow: 'list-lookup' },
];

interface Timing {
  id: string;
  visibility: string;
  reference: number | null;
  learner: number | null;
  timeout: boolean;
}

interface Measured {
  status: string;
  timings?: Timing[];
}

// The test bridge exists only in the dev build. It grades the code with the timings reported.
async function measure(page: Page, id: string, code: string): Promise<Measured> {
  return page.evaluate(
    ([challenge, source]) => (window as unknown as { __LARKSPUR_TEST__: { measure(id: string, code: string): Promise<Measured> } }).__LARKSPUR_TEST__.measure(challenge, source),
    [id, code] as const,
  );
}

test('measures the efficiency items and checks the margins in this browser', async ({ page }, testInfo) => {
  logPageErrors(page);
  await page.goto('/');
  const browser = testInfo.project.name;
  for (const { id, slow } of MEASURED) {
    const item = findItem(CHAPTER2_GRADED, id);
    const variant = item.variants.find((candidate) => candidate.id === slow);
    if (variant === undefined) throw new Error(`no slow variant ${slow} for ${id}`);
    const reference = await measure(page, id, item.reference);
    const wrong = await measure(page, id, variant.code);
    const referenceTimings = reference.timings ?? [];
    const wrongTimings = wrong.timings ?? [];
    expect(referenceTimings.length, `${id} reports its timed cases`).toBeGreaterThan(0);
    expect(wrongTimings.length, `${id} reports the slow variant's timed cases`).toBe(referenceTimings.length);
    for (const [index, timing] of wrongTimings.entries()) {
      const baseline = referenceTimings[index];
      if (baseline === undefined || baseline.reference === null || timing.learner === null) throw new Error(`${id} has a missing timing`);
      const ratio = timing.learner / baseline.reference;
      const milliseconds = (seconds: number) => (seconds * 1000).toFixed(1);
      console.log(
        `EFFICIENCY ${browser} ${id} ${timing.id} (${timing.visibility}) reference=${milliseconds(baseline.reference)} ms slow=${milliseconds(timing.learner)} ms ratio=${ratio.toFixed(0)}x timeout=${timing.timeout}`,
      );
      expect.soft(baseline.reference, `${id} ${timing.id}: the reference stays under 50 ms`).toBeLessThan(0.05);
      expect.soft(ratio, `${id} ${timing.id}: the slow variant is at least 50 times slower`).toBeGreaterThanOrEqual(50);
    }
  }
});
