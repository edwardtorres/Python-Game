import { expect, test } from '@playwright/test';
import { churn, openTicket, setCell } from './helpers';

interface Sample {
  run: number;
  wasmBytes: number;
  workerStarts: number;
  memoryRestarts: number;
  heavyRestarts: number;
}

// A long session of data-heavy checks. The recycling policy has to keep WebAssembly memory
// bounded, and the test records the numbers so the threshold can be judged against them.
test('a long session of data-heavy checks stays bounded by worker recycling', async ({ page }, testInfo) => {
  test.setTimeout(20 * 60 * 1000);
  await openTicket(page, churn.title);
  await setCell(page, churn.id, 1, churn.reference);

  const samples: Sample[] = [];
  const RUNS = 45;
  for (let run = 1; run <= RUNS; run += 1) {
    await page.getByRole('button', { name: 'Run visible checks' }).click();
    await expect(page.getByRole('button', { name: 'Run visible checks' })).toBeEnabled({ timeout: 180_000 });
    const status = await page.evaluate(() => (window as unknown as { __LARKSPUR_TEST__: { status(): { workerStarts: number; restarts: Record<string, number>; lastWasmBytes: number } } }).__LARKSPUR_TEST__.status());
    samples.push({
      run,
      wasmBytes: status.lastWasmBytes,
      workerStarts: status.workerStarts,
      memoryRestarts: status.restarts.memory ?? 0,
      heavyRestarts: status.restarts['heavy-runs'] ?? 0,
    });
  }

  const peak = Math.max(...samples.map((sample) => sample.wasmBytes));
  const restarts = samples.at(-1)?.workerStarts ?? 1;
  const report = {
    runs: RUNS,
    peakWasmBytes: peak,
    finalWasmBytes: samples.at(-1)?.wasmBytes ?? 0,
    workerStarts: restarts,
    memoryRestarts: samples.at(-1)?.memoryRestarts ?? 0,
    heavyRunRestarts: samples.at(-1)?.heavyRestarts ?? 0,
    samples,
  };
  await testInfo.attach('memory-soak.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  console.log(`memory soak: peak ${(peak / 1048576).toFixed(1)} MiB, worker starts ${restarts}, heavy-run restarts ${report.heavyRunRestarts}`);

  // The policy must have recycled at least once across 45 heavy runs, and the worker
  // must be back under the limit at the end.
  expect(restarts).toBeGreaterThan(1);
  expect(report.finalWasmBytes).toBeLessThan(256 * 1024 * 1024 * 2);
});
