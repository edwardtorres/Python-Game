import { generateDataset } from '../data';
import type { DatasetSpec } from './types';

// Builds the CSV text for a challenge's datasets. A Run sends only the visible
// datasets; a Submit sends all of them, so hidden data is not generated until needed.
export function buildDatasets(specs: DatasetSpec[], scope: 'visible' | 'all'): Record<string, string> {
  const out: Record<string, string> = {};
  for (const spec of specs) {
    if (scope === 'visible' && spec.visibility !== 'visible') continue;
    out[spec.name] = generateDataset(spec.generator, spec.seed, spec.rows).csv;
  }
  return out;
}
