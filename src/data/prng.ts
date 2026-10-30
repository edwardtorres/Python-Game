// Seeded pseudo-random numbers (sfc32 with a splitmix32 seed step). The same seed
// gives the same sequence on every platform, so generated datasets are reproducible.

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
  normal(mean: number, deviation: number): number;
}

function splitmix32(state: { value: number }): number {
  state.value = (state.value + 0x9e3779b9) >>> 0;
  let z = state.value;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
  return (z ^ (z >>> 16)) >>> 0;
}

export function createRng(seed: number): Rng {
  const state = { value: seed >>> 0 };
  let a = splitmix32(state);
  let b = splitmix32(state);
  let c = splitmix32(state);
  let d = splitmix32(state);
  const next = (): number => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(items) {
      return items[Math.floor(next() * items.length)] as never;
    },
    chance(probability) {
      return next() < probability;
    },
    normal(mean, deviation) {
      const u = Math.max(next(), 1e-12);
      const v = next();
      return mean + deviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}
