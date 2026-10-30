import { generateChurn } from './churn';
import { generatePricing } from './pricing';
import { generateShipments } from './shipments';
import { generateTelemetry } from './telemetry';
import type { GeneratedDataset, GeneratorName } from './types';

export type { GeneratedDataset, GeneratorName } from './types';

const GENERATORS: Record<GeneratorName, (seed: number, rows?: number) => GeneratedDataset> = {
  shipments: generateShipments,
  telemetry: generateTelemetry,
  churn: generateChurn,
  pricing: generatePricing,
};

export function generateDataset(name: GeneratorName, seed: number, rows?: number): GeneratedDataset {
  return rows === undefined ? GENERATORS[name](seed) : GENERATORS[name](seed, rows);
}
