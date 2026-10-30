// Sensor telemetry: readings every five minutes from a few sensors. Some readings are
// missing, and some vibration values are spikes that a careful analyst should notice.
import { createRng } from './prng';
import { round, toCsv, type Cell } from './csv';
import type { GeneratedDataset } from './types';

export const TELEMETRY_COLUMNS = ['sensor_id', 'timestamp', 'temp_c', 'vibration_g', 'status'];

export function generateTelemetry(seed: number, rows = 240): GeneratedDataset {
  const rng = createRng(seed);
  const sensors = ['S-101', 'S-102', 'S-103'];
  const start = Date.UTC(2026, 2, 1, 0, 0, 0);
  const body: Cell[][] = [];
  for (let index = 0; index < rows; index += 1) {
    const sensor = sensors[index % sensors.length] ?? 'S-101';
    const stamp = new Date(start + Math.floor(index / sensors.length) * 5 * 60_000).toISOString();
    const temperature = round(rng.normal(21, 1.4), 2);
    const spike = rng.chance(0.02) ? rng.normal(6, 1) : 0;
    const vibration = round(Math.abs(rng.normal(0.18, 0.05)) + spike, 3);
    body.push([sensor, stamp, rng.chance(0.04) ? null : temperature, vibration, rng.chance(0.06) ? null : rng.pick(['ok', 'warn'])]);
  }
  return { name: 'telemetry', seed, rows, columns: TELEMETRY_COLUMNS, csv: toCsv(TELEMETRY_COLUMNS, body) };
}
