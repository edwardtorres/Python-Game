import { describe, expect, it } from 'vitest';
import { generateDataset, type GeneratorName } from './index';
import { createRng } from './prng';
import { CHURN_COLUMNS } from './churn';
import { SHIPMENT_COLUMNS } from './shipments';
import { TELEMETRY_COLUMNS } from './telemetry';
import { PRICING_COLUMNS } from './pricing';

const NAMES: GeneratorName[] = ['shipments', 'telemetry', 'churn', 'pricing'];

function parse(csv: string): string[][] {
  return csv.trimEnd().split('\n').map((line) => line.split(','));
}

describe('seeded random numbers', () => {
  it('gives the same sequence for the same seed', () => {
    const first = createRng(42);
    const second = createRng(42);
    const a = Array.from({ length: 20 }, () => first.next());
    const b = Array.from({ length: 20 }, () => second.next());
    expect(a).toEqual(b);
  });

  it('gives different sequences for different seeds', () => {
    const a = createRng(1).next();
    const b = createRng(2).next();
    expect(a).not.toBe(b);
  });

  it('keeps integers inside the requested range', () => {
    const rng = createRng(7);
    for (let index = 0; index < 500; index += 1) {
      const value = rng.int(3, 9);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(9);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe.each(NAMES)('%s generator', (name) => {
  it('is byte-identical for the same seed', () => {
    const first = generateDataset(name, 101);
    const second = generateDataset(name, 101);
    expect(second.csv).toBe(first.csv);
  });

  it('changes with the seed', () => {
    expect(generateDataset(name, 101).csv).not.toBe(generateDataset(name, 202).csv);
  });

  it('writes a header that matches its declared columns', () => {
    const dataset = generateDataset(name, 5);
    expect(parse(dataset.csv)[0]).toEqual(dataset.columns);
  });

  it('keeps every row the same width as the header', () => {
    const rows = parse(generateDataset(name, 9).csv);
    const width = rows[0]?.length ?? 0;
    for (const row of rows) expect(row).toHaveLength(width);
  });
});

describe('shipments', () => {
  it('uses the documented columns and a late flag that matches the days', () => {
    const rows = parse(generateDataset('shipments', 11, 300).csv);
    expect(rows[0]).toEqual(SHIPMENT_COLUMNS);
    const late = SHIPMENT_COLUMNS.indexOf('late');
    const promised = SHIPMENT_COLUMNS.indexOf('promised_days');
    const actual = SHIPMENT_COLUMNS.indexOf('actual_days');
    for (const row of rows.slice(1)) {
      expect(row[late]).toBe(Number(row[actual]) > Number(row[promised]) ? '1' : '0');
    }
  });

  it('leaves some weights missing', () => {
    const rows = parse(generateDataset('shipments', 11, 400).csv).slice(1);
    const missing = rows.filter((row) => row[SHIPMENT_COLUMNS.indexOf('weight_kg')] === '');
    expect(missing.length).toBeGreaterThan(0);
  });
});

describe('churn', () => {
  it('repeats some customers and leaves some regions missing', () => {
    const rows = parse(generateDataset('churn', 101, 150).csv).slice(1);
    const ids = rows.map((row) => row[0]);
    expect(new Set(ids).size).toBeLessThan(ids.length);
    expect(rows.some((row) => row[CHURN_COLUMNS.indexOf('region')] === '')).toBe(true);
  });

  it('only uses the documented regions and plans', () => {
    const rows = parse(generateDataset('churn', 303, 150).csv).slice(1);
    for (const row of rows) {
      expect(['north', 'south', 'east', 'west', '']).toContain(row[1]);
      expect(['basic', 'plus', 'pro']).toContain(row[2]);
    }
  });
});

describe('telemetry', () => {
  it('uses the documented columns', () => {
    expect(parse(generateDataset('telemetry', 4).csv)[0]).toEqual(TELEMETRY_COLUMNS);
  });
});

describe('pricing', () => {
  it('computes revenue as price times units', () => {
    const rows = parse(generateDataset('pricing', 8).csv).slice(1);
    for (const row of rows) {
      const price = Number(row[PRICING_COLUMNS.indexOf('price_usd')]);
      const units = Number(row[PRICING_COLUMNS.indexOf('units_sold')]);
      const revenue = Number(row[PRICING_COLUMNS.indexOf('revenue_usd')]);
      expect(Math.abs(revenue - price * units)).toBeLessThan(0.011);
    }
  });
});
