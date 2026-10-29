/**
 * Deterministic Seeded PRNG (xmur3 + mulberry32)
 *
 * Ensures that any human-readable seed string produces the exact same
 * Random Unanimity boundary pre-coloring across sessions and devices.
 */

export interface SeededRNG {
  /** Returns a uniform pseudo-random float in [0, 1). */
  nextFloat(): number;
  /** Returns a uniform pseudo-random integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
  /** Uniformly selects one element from a non-empty array. */
  pick<T>(items: readonly T[]): T;
}

/**
 * xmur3 string hash generator -> 32-bit unsigned seed function
 */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

/**
 * mulberry32 32-bit state PRNG
 */
function mulberry32(a: number): () => number {
  let state = a >>> 0;
  return function () {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a deterministic SeededRNG from any arbitrary seed string.
 */
export function createSeededRNG(seed: string): SeededRNG {
  const normalized = seed.trim().length > 0 ? seed.trim() : 'arrow-1951';
  const seedGen = xmur3(normalized);
  const rand = mulberry32(seedGen());

  return {
    nextFloat(): number {
      return rand();
    },
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 0) {
        throw new Error(`maxExclusive must be > 0, got ${maxExclusive}`);
      }
      return Math.floor(rand() * maxExclusive);
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty array');
      }
      const idx = Math.floor(rand() * items.length);
      return items[idx]!;
    },
  };
}

const SEED_WORDS = [
  'arrow',
  'sperner',
  'atropos',
  'condorcet',
  'brouwer',
  'tanaka',
  'simplex',
  'unanimity',
  'dictator',
  'borda',
  'paradox',
  'topos',
] as const;

/**
 * Generates a human-readable random seed string (e.g., "sperner-4821").
 */
export function generateRandomSeed(): string {
  const word = SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)] ?? 'arrow';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}
