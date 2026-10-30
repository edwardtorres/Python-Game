// Pricing experiment: a control and a treatment price over several weeks. Revenue is
// price times units, so the experiment is a plain group comparison.
import { createRng } from './prng';
import { round, toCsv, type Cell } from './csv';
import type { GeneratedDataset } from './types';

export const PRICING_COLUMNS = ['experiment_id', 'variant', 'price_usd', 'units_sold', 'revenue_usd'];

export function generatePricing(seed: number, rows = 120): GeneratedDataset {
  const rng = createRng(seed);
  const body: Cell[][] = [];
  for (let index = 0; index < rows; index += 1) {
    const variant = index % 2 === 0 ? 'control' : 'treatment';
    const price = variant === 'control' ? 24.99 : round(rng.pick([21.99, 22.99, 23.99]), 2);
    const demand = rng.normal(variant === 'control' ? 180 : 205, 22);
    const units = Math.max(0, Math.round(demand));
    body.push([`EXP-${String(Math.floor(index / 2) + 1).padStart(3, '0')}`, variant, price, units, round(price * units, 2)]);
  }
  return { name: 'pricing', seed, rows, columns: PRICING_COLUMNS, csv: toCsv(PRICING_COLUMNS, body) };
}
