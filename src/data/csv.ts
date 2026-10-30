// Minimal CSV writer. Missing values are written as empty fields, which pandas reads as NaN.

export type Cell = string | number | null;

export function toCsv(columns: readonly string[], rows: ReadonlyArray<readonly Cell[]>): string {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(row.map((cell) => (cell === null ? '' : String(cell))).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
