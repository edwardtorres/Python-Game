// Customer churn: one row per customer. About 6% of regions are missing, and about 5%
// of rows are repeated copies of an earlier customer (the classic duplicate-row trap).
import { createRng } from './prng';
import { round, toCsv, type Cell } from './csv';
import type { GeneratedDataset } from './types';

export const CHURN_COLUMNS = ['customer_id', 'region', 'plan', 'tenure_months', 'monthly_charge', 'churned'];
const REGIONS = ['north', 'south', 'east', 'west'];
const PLANS = ['basic', 'plus', 'pro'];

export function generateChurn(seed: number, rows = 150): GeneratedDataset {
  const rng = createRng(seed);
  const customers: Cell[][] = [];
  for (let index = 0; index < rows; index += 1) {
    const plan = rng.pick(PLANS);
    const tenure = rng.int(1, 72);
    const charge = round(rng.normal(plan === 'pro' ? 89 : plan === 'plus' ? 54 : 29, 6), 2);
    const churnRisk = (plan === 'basic' ? 0.35 : plan === 'plus' ? 0.2 : 0.1) + (tenure < 12 ? 0.2 : 0);
    customers.push([
      `C${String(index + 1).padStart(4, '0')}`,
      rng.chance(0.06) ? null : rng.pick(REGIONS),
      plan,
      tenure,
      charge,
      rng.chance(churnRisk) ? 1 : 0,
    ]);
  }
  const body = [...customers];
  const copies = Math.round(rows * 0.05);
  for (let copy = 0; copy < copies; copy += 1) {
    const original = customers[rng.int(0, customers.length - 1)];
    if (original !== undefined) body.splice(rng.int(0, body.length), 0, [...original]);
  }
  return { name: 'churn', seed, rows: body.length, columns: CHURN_COLUMNS, csv: toCsv(CHURN_COLUMNS, body) };
}
