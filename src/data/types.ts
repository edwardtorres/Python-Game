export interface GeneratedDataset {
  name: string;
  seed: number;
  rows: number;
  columns: string[];
  csv: string;
}

export type GeneratorName = 'shipments' | 'telemetry' | 'churn' | 'pricing';
