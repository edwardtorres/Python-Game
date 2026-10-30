// Shipments: one row per freight shipment. About 3% of weights are missing, and
// `late` is 1 when the shipment arrived after its promised days.
import { createRng } from './prng';
import { round, toCsv, type Cell } from './csv';
import type { GeneratedDataset } from './types';

const MODES = ['truck', 'rail', 'ocean', 'air'] as const;
const CARRIERS = ['NorthStar Haulage', 'Bluefin Freight', 'Keel & Co'];
const CITIES = ['Ashford', 'Brinmoor', 'Cressley', 'Dunmere', 'Eastholt', 'Farrowby'];

export const SHIPMENT_COLUMNS = [
  'shipment_id',
  'carrier',
  'mode',
  'origin',
  'destination',
  'weight_kg',
  'distance_km',
  'promised_days',
  'actual_days',
  'late',
  'cost_usd',
];

export function generateShipments(seed: number, rows = 200): GeneratedDataset {
  const rng = createRng(seed);
  const body: Cell[][] = [];
  for (let index = 0; index < rows; index += 1) {
    const mode = rng.pick(MODES);
    const origin = rng.pick(CITIES);
    let destination = rng.pick(CITIES);
    while (destination === origin) destination = rng.pick(CITIES);
    const distance = rng.int(120, 4200);
    const promised = mode === 'air' ? rng.int(1, 3) : mode === 'truck' ? rng.int(2, 6) : rng.int(5, 21);
    const slip = rng.normal(mode === 'ocean' ? 2 : 0.4, 2.2);
    const actual = Math.max(1, Math.round(promised + slip));
    const weight = round(Math.max(0.5, rng.normal(mode === 'air' ? 40 : 900, mode === 'air' ? 25 : 500)), 1);
    const cost = round(distance * (mode === 'air' ? 1.9 : mode === 'ocean' ? 0.09 : 0.35) + weight * 0.12, 2);
    body.push([
      `SH-${String(index + 1).padStart(5, '0')}`,
      rng.pick(CARRIERS),
      mode,
      origin,
      destination,
      rng.chance(0.03) ? null : weight,
      distance,
      promised,
      actual,
      actual > promised ? 1 : 0,
      cost,
    ]);
  }
  return { name: 'shipments', seed, rows, columns: SHIPMENT_COLUMNS, csv: toCsv(SHIPMENT_COLUMNS, body) };
}
