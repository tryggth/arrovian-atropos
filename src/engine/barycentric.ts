/**
 * Core Barycentric Simplex Lattice (\Delta^2_n) & Random Unanimity Pre-Coloring
 *
 * Unifies Burke & Teng's (2008) Atropos lattice with the Condorcet 3-block
 * preference simplex of Arrow's Impossibility Theorem:
 *  - Block G_0 (k_0 voters): A > B > C
 *  - Block G_1 (k_1 voters): B > C > A
 *  - Block G_2 (k_2 voters): C > A > B
 *
 * Colors (Pairwise Societal Rulings under IIA):
 *  - Color 0 (Red / Crimson):   A > C (Forbidden on boundary k_0 = 0 by Unanimity)
 *  - Color 1 (Green / Emerald): B > A (Forbidden on boundary k_1 = 0 by Unanimity)
 *  - Color 2 (Blue / Indigo):   C > B (Forbidden on boundary k_2 = 0 by Unanimity)
 */

import { createSeededRNG } from './prng';

export type RulingColor = 0 | 1 | 2;
export type BarycentricCoord = readonly [number, number, number];
export type VertexId = string;

export interface CandidateMetadata {
  readonly id: 'A' | 'B' | 'C';
  readonly name: 'Atlas' | 'Boreas' | 'Cybele';
  readonly shape: '●' | '■' | '▲';
  readonly shortTag: '●A' | '■B' | '▲C';
  readonly fullLabel: '●A (Atlas)' | '■B (Boreas)' | '▲C (Cybele)';
  readonly hexColor: string;
}

export const CANDIDATES: Record<RulingColor, CandidateMetadata> = {
  0: {
    id: 'A',
    name: 'Atlas',
    shape: '●',
    shortTag: '●A',
    fullLabel: '●A (Atlas)',
    hexColor: '#f43f5e',
  },
  1: {
    id: 'B',
    name: 'Boreas',
    shape: '■',
    shortTag: '■B',
    fullLabel: '■B (Boreas)',
    hexColor: '#10b981',
  },
  2: {
    id: 'C',
    name: 'Cybele',
    shape: '▲',
    shortTag: '▲C',
    fullLabel: '▲C (Cybele)',
    hexColor: '#6366f1',
  },
};

export const VOTER_NAMES: readonly string[] = [
  'Ada',
  'Blaise',
  'Condorcet',
  'Dodgson',
  'Emmy',
  'Kenneth',
  'Leonhard',
  'Maskin',
  'Nash',
  'Pareto',
  'Sen',
  'Sperner',
] as const;

export function getVoterName(voterId: number): string {
  return VOTER_NAMES[voterId - 1] ?? `Voter ${voterId}`;
}

export function getVoterLabel(voterId: number): string {
  return `V${voterId} · ${getVoterName(voterId)}`;
}

export type DinnerTeamName = 'Team Pizza' | 'Team Tacos' | 'Team Sushi';

export const TEAM_NAMES: Record<RulingColor, DinnerTeamName> = {
  0: 'Team Pizza',
  1: 'Team Tacos',
  2: 'Team Sushi',
};

export interface ColorMetadata {
  readonly color: RulingColor;
  readonly name: string;
  readonly ruling: string;
  readonly shortBadge: string;
  readonly candidateId: 'A' | 'B' | 'C';
  readonly candidateName: 'Atlas' | 'Boreas' | 'Cybele';
  readonly candidateShape: '●' | '■' | '▲';
  readonly candidateFullLabel: '●A (Atlas)' | '■B (Boreas)' | '▲C (Cybele)';
  readonly shapedRuling: '●A ≻ ▲C' | '■B ≻ ●A' | '▲C ≻ ■B';
  readonly shapedBadge: '● A≻C' | '■ B≻A' | '▲ C≻B';
  readonly coalitionBlock: 'G₀' | 'G₁' | 'G₂';
  readonly coalitionRanking: string;
  readonly shapedCoalitionRanking:
    | '●A ≻ ■B ≻ ▲C'
    | '■B ≻ ▲C ≻ ●A'
    | '▲C ≻ ●A ≻ ■B';
  readonly crownedWinnerText:
    | 'Cuts ▲C≻●A → ●A (Atlas) Wins'
    | 'Cuts ●A≻■B → ■B (Boreas) Wins'
    | 'Cuts ■B≻▲C → ▲C (Cybele) Wins';
  readonly crownedWinnerShort:
    | '●A (Atlas) Wins'
    | '■B (Boreas) Wins'
    | '▲C (Cybele) Wins';
  readonly forbiddenAxis: 0 | 1 | 2;
  readonly unanimousConstraint: string;
  readonly hexFill: string;
  readonly hexStroke: string;
}

export const RULING_COLORS: Record<RulingColor, ColorMetadata> = {
  0: {
    color: 0,
    name: 'Ruling A ≻ C',
    ruling: 'A ≻ C',
    shortBadge: 'A≻C',
    candidateId: 'A',
    candidateName: 'Atlas',
    candidateShape: '●',
    candidateFullLabel: '●A (Atlas)',
    shapedRuling: '●A ≻ ▲C',
    shapedBadge: '● A≻C',
    coalitionBlock: 'G₀',
    coalitionRanking: 'A ≻ B ≻ C',
    shapedCoalitionRanking: '●A ≻ ■B ≻ ▲C',
    crownedWinnerText: 'Cuts ▲C≻●A → ●A (Atlas) Wins',
    crownedWinnerShort: '●A (Atlas) Wins',
    forbiddenAxis: 0,
    unanimousConstraint: 'Pareto Forbids on k₀ = 0 (Unanimous C ≻ A)',
    hexFill: '#f43f5e',
    hexStroke: '#fda4af',
  },
  1: {
    color: 1,
    name: 'Ruling B ≻ A',
    ruling: 'B ≻ A',
    shortBadge: 'B≻A',
    candidateId: 'B',
    candidateName: 'Boreas',
    candidateShape: '■',
    candidateFullLabel: '■B (Boreas)',
    shapedRuling: '■B ≻ ●A',
    shapedBadge: '■ B≻A',
    coalitionBlock: 'G₁',
    coalitionRanking: 'B ≻ C ≻ A',
    shapedCoalitionRanking: '■B ≻ ▲C ≻ ●A',
    crownedWinnerText: 'Cuts ●A≻■B → ■B (Boreas) Wins',
    crownedWinnerShort: '■B (Boreas) Wins',
    forbiddenAxis: 1,
    unanimousConstraint: 'Pareto Forbids on k₁ = 0 (Unanimous A ≻ B)',
    hexFill: '#10b981',
    hexStroke: '#6ee7b7',
  },
  2: {
    color: 2,
    name: 'Ruling C ≻ B',
    ruling: 'C ≻ B',
    shortBadge: 'C≻B',
    candidateId: 'C',
    candidateName: 'Cybele',
    candidateShape: '▲',
    candidateFullLabel: '▲C (Cybele)',
    shapedRuling: '▲C ≻ ■B',
    shapedBadge: '▲ C≻B',
    coalitionBlock: 'G₂',
    coalitionRanking: 'C ≻ A ≻ B',
    shapedCoalitionRanking: '▲C ≻ ●A ≻ ■B',
    crownedWinnerText: 'Cuts ■B≻▲C → ▲C (Cybele) Wins',
    crownedWinnerShort: '▲C (Cybele) Wins',
    forbiddenAxis: 2,
    unanimousConstraint: 'Pareto Forbids on k₂ = 0 (Unanimous B ≻ C)',
    hexFill: '#6366f1',
    hexStroke: '#a5b4fc',
  },
};

export interface LatticeVertex {
  readonly id: VertexId;
  readonly coord: BarycentricCoord;
  readonly isCorner: boolean;
  readonly isBoundary: boolean;
  readonly isInterior: boolean;
  /** Which color is forbidden by Unanimity (for non-corner boundary vertices). */
  readonly forbiddenColor: RulingColor | null;
  /** Up to 6 adjacent vertices at lattice distance d(u, v) = 1. */
  readonly neighbors: VertexId[];
  /** Normalized 2D equilateral x-coordinate in [0, 1]. */
  readonly x: number;
  /** Normalized 2D equilateral y-coordinate in [0, sqrt(3)/2]. */
  readonly y: number;
}

export interface ElementaryTriangle {
  readonly id: string;
  readonly vertices: readonly [VertexId, VertexId, VertexId];
  readonly orientation: 'up' | 'down';
  readonly centroid: { readonly x: number; readonly y: number };
}

export interface LatticeGraph {
  readonly n: number;
  readonly vertices: Map<VertexId, LatticeVertex>;
  readonly vertexList: LatticeVertex[];
  readonly interiorIds: VertexId[];
  readonly boundaryIds: VertexId[];
  readonly triangles: ElementaryTriangle[];
  readonly vertexTriangles: Map<VertexId, ElementaryTriangle[]>;
  readonly edges: ReadonlyArray<readonly [VertexId, VertexId]>;
}

export const BOARD_SIZES = [4, 5, 6, 7, 8, 10, 12] as const;
export const DEFAULT_BOARD_SIZE = 6;

const SQRT3_HALF = Math.sqrt(3) / 2;

/**
 * Formats a barycentric triple (k0, k1, k2) into its canonical VertexId string.
 */
export function toVertexId(k0: number, k1: number, k2: number): VertexId {
  return `${k0},${k1},${k2}`;
}

/**
 * Parses a VertexId string back into its BarycentricCoord triple.
 */
export function parseVertexId(id: VertexId): BarycentricCoord {
  const parts = id.split(',').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/**
 * Returns the lattice distance d(u, v) = 0.5 * sum |k_i - k'_i| on \Delta^2_n.
 * Two vertices are adjacent iff latticeDistance(u, v) === 1 (i.e. L1 distance === 2).
 */
export function latticeDistance(u: BarycentricCoord, v: BarycentricCoord): number {
  const l1 =
    Math.abs(u[0] - v[0]) + Math.abs(u[1] - v[1]) + Math.abs(u[2] - v[2]);
  return l1 / 2;
}

/**
 * Checks whether two barycentric coordinates are directly adjacent (d(u,v) = 1).
 */
export function areAdjacentCoords(u: BarycentricCoord, v: BarycentricCoord): boolean {
  return (
    Math.abs(u[0] - v[0]) + Math.abs(u[1] - v[1]) + Math.abs(u[2] - v[2]) === 2
  );
}

/**
 * Builds the complete triangulated simplex lattice \Delta^2_n for a given n >= 3.
 *
 * - Total vertices: (n + 1)(n + 2) / 2
 * - Interior vertices: (n - 1)(n - 2) / 2
 * - Boundary vertices: 3n
 * - Elementary triangles: n^2
 */
export function createLatticeGraph(n: number): LatticeGraph {
  if (!Number.isInteger(n) || n < 3 || n > 20) {
    throw new Error(`Invalid board size n=${n}. Expected integer in [3, 20].`);
  }

  const vertices = new Map<VertexId, LatticeVertex>();
  const vertexList: LatticeVertex[] = [];
  const interiorIds: VertexId[] = [];
  const boundaryIds: VertexId[] = [];
  const vertexTriangles = new Map<VertexId, ElementaryTriangle[]>();

  // 1. Generate all vertices (k0, k1, k2) with k0 + k1 + k2 = n
  // Iterate from top row (k0 = n) down to bottom row (k0 = 0), left to right (k1 from n - k0 down to 0)
  for (let k0 = n; k0 >= 0; k0--) {
    for (let k1 = n - k0; k1 >= 0; k1--) {
      const k2 = n - k0 - k1;
      const id = toVertexId(k0, k1, k2);
      const coord: BarycentricCoord = [k0, k1, k2];

      const zeroCount = (k0 === 0 ? 1 : 0) + (k1 === 0 ? 1 : 0) + (k2 === 0 ? 1 : 0);
      const isCorner = zeroCount === 2;
      const isBoundary = zeroCount >= 1;
      const isInterior = zeroCount === 0;

      let forbiddenColor: RulingColor | null = null;
      if (isBoundary && !isCorner) {
        if (k0 === 0) forbiddenColor = 0;
        else if (k1 === 0) forbiddenColor = 1;
        else if (k2 === 0) forbiddenColor = 2;
      }

      // 2D Equilateral projection:
      // Top corner (n, 0, 0) -> (0.5, 0)
      // Bottom-Left corner (0, n, 0) -> (0, sqrt(3)/2)
      // Bottom-Right corner (0, 0, n) -> (1, sqrt(3)/2)
      const x = (k2 + 0.5 * k0) / n;
      const y = SQRT3_HALF * (1 - k0 / n);

      const vertex: LatticeVertex = {
        id,
        coord,
        isCorner,
        isBoundary,
        isInterior,
        forbiddenColor,
        neighbors: [],
        x,
        y,
      };

      vertices.set(id, vertex);
      vertexList.push(vertex);
      vertexTriangles.set(id, []);

      if (isInterior) {
        interiorIds.push(id);
      } else {
        boundaryIds.push(id);
      }
    }
  }

  // 2. Populate the 6-regular lattice neighbors for each vertex
  const DELTAS: ReadonlyArray<readonly [number, number, number]> = [
    [1, -1, 0],
    [-1, 1, 0],
    [1, 0, -1],
    [-1, 0, 1],
    [0, 1, -1],
    [0, -1, 1],
  ];

  const edgeSet = new Set<string>();
  const edges: Array<readonly [VertexId, VertexId]> = [];

  for (const v of vertexList) {
    const [k0, k1, k2] = v.coord;
    for (const [d0, d1, d2] of DELTAS) {
      const nk0 = k0 + d0;
      const nk1 = k1 + d1;
      const nk2 = k2 + d2;
      if (nk0 >= 0 && nk1 >= 0 && nk2 >= 0 && nk0 <= n && nk1 <= n && nk2 <= n) {
        const nId = toVertexId(nk0, nk1, nk2);
        if (vertices.has(nId)) {
          v.neighbors.push(nId);
          const pairKey = v.id < nId ? `${v.id}|${nId}` : `${nId}|${v.id}`;
          if (!edgeSet.has(pairKey)) {
            edgeSet.add(pairKey);
            edges.push([v.id, nId]);
          }
        }
      }
    }
  }

  // 3. Generate all n^2 elementary triangles (upward \Delta and downward \nabla)
  const triangles: ElementaryTriangle[] = [];

  for (let k0 = n; k0 >= 1; k0--) {
    for (let k1 = n - k0; k1 >= 0; k1--) {
      const k2 = n - k0 - k1;

      // Upward triangle (\Delta): (k0, k1, k2), (k0 - 1, k1 + 1, k2), (k0 - 1, k1, k2 + 1)
      const u1 = toVertexId(k0, k1, k2);
      const u2 = toVertexId(k0 - 1, k1 + 1, k2);
      const u3 = toVertexId(k0 - 1, k1, k2 + 1);
      const vu1 = vertices.get(u1)!;
      const vu2 = vertices.get(u2)!;
      const vu3 = vertices.get(u3)!;

      const upTri: ElementaryTriangle = {
        id: `up:${u1}`,
        vertices: [u1, u2, u3],
        orientation: 'up',
        centroid: {
          x: (vu1.x + vu2.x + vu3.x) / 3,
          y: (vu1.y + vu2.y + vu3.y) / 3,
        },
      };
      triangles.push(upTri);
      vertexTriangles.get(u1)!.push(upTri);
      vertexTriangles.get(u2)!.push(upTri);
      vertexTriangles.get(u3)!.push(upTri);

      // Downward triangle (\nabla): (k0, k1, k2), (k0 - 1, k1 + 1, k2), (k0, k1 + 1, k2 - 1) for k2 >= 1
      if (k2 >= 1) {
        const d1 = toVertexId(k0, k1, k2);
        const d2 = toVertexId(k0 - 1, k1 + 1, k2);
        const d3 = toVertexId(k0, k1 + 1, k2 - 1);
        const vd1 = vertices.get(d1)!;
        const vd2 = vertices.get(d2)!;
        const vd3 = vertices.get(d3)!;

        const downTri: ElementaryTriangle = {
          id: `down:${d1}`,
          vertices: [d1, d2, d3],
          orientation: 'down',
          centroid: {
            x: (vd1.x + vd2.x + vd3.x) / 3,
            y: (vd1.y + vd2.y + vd3.y) / 3,
          },
        };
        triangles.push(downTri);
        vertexTriangles.get(d1)!.push(downTri);
        vertexTriangles.get(d2)!.push(downTri);
        vertexTriangles.get(d3)!.push(downTri);
      }
    }
  }

  return {
    n,
    vertices,
    vertexList,
    interiorIds,
    boundaryIds,
    triangles,
    vertexTriangles,
    edges,
  };
}

/**
 * Generates the initial Random Unanimity boundary pre-coloring for \Delta^2_n
 * using a deterministic seed and enforcing the Corner-Tip Non-Rainbow Safeguard.
 */
export function generateBoundaryColoring(
  graph: LatticeGraph,
  seed: string
): Map<VertexId, RulingColor> {
  const { n } = graph;
  const rng = createSeededRNG(seed);
  const colors = new Map<VertexId, RulingColor>();

  // 1. Canonical Corners:
  // Top Corner (n, 0, 0) -> 0 (A > C)
  // Bottom-Left Corner (0, n, 0) -> 1 (B > A)
  // Bottom-Right Corner (0, 0, n) -> 2 (C > B)
  colors.set(toVertexId(n, 0, 0), 0);
  colors.set(toVertexId(0, n, 0), 1);
  colors.set(toVertexId(0, 0, n), 2);

  // 2. Corner-Tip Non-Rainbow Safeguard (Critical Invariant):
  // Exclude the single panchromatic pair at each of the 3 corner triangles so Turn 0
  // is guaranteed to have zero {0, 1, 2} elementary triangles.
  const topTipPairs: ReadonlyArray<readonly [RulingColor, RulingColor]> = [
    [0, 0],
    [0, 2],
    [1, 0],
  ]; // Excludes [1, 2] around corner 0
  const [topLeftColor, topRightColor] = rng.pick(topTipPairs);
  colors.set(toVertexId(n - 1, 1, 0), topLeftColor);
  colors.set(toVertexId(n - 1, 0, 1), topRightColor);

  const bottomLeftTipPairs: ReadonlyArray<readonly [RulingColor, RulingColor]> = [
    [1, 1],
    [1, 2],
    [0, 1],
  ]; // Excludes [0, 2] around corner 1
  const [blUpperColor, blBottomColor] = rng.pick(bottomLeftTipPairs);
  colors.set(toVertexId(1, n - 1, 0), blUpperColor);
  colors.set(toVertexId(0, n - 1, 1), blBottomColor);

  const bottomRightTipPairs: ReadonlyArray<readonly [RulingColor, RulingColor]> = [
    [2, 2],
    [2, 1],
    [0, 2],
  ]; // Excludes [0, 1] around corner 2
  const [brUpperColor, brBottomColor] = rng.pick(bottomRightTipPairs);
  colors.set(toVertexId(1, 0, n - 1), brUpperColor);
  colors.set(toVertexId(0, 1, n - 1), brBottomColor);

  // 3. Remaining Boundary Edge Vertices (Unanimity Constraint):
  // Left Edge (k2 = 0, k0 from n-2 down to 2): Color 2 forbidden -> {0, 1}
  const leftOptions: readonly RulingColor[] = [0, 1];
  for (let k0 = n - 2; k0 >= 2; k0--) {
    const k1 = n - k0;
    const id = toVertexId(k0, k1, 0);
    if (!colors.has(id)) {
      colors.set(id, rng.pick(leftOptions));
    }
  }

  // Bottom Edge (k0 = 0, k1 from n-2 down to 2): Color 0 forbidden -> {1, 2}
  const bottomOptions: readonly RulingColor[] = [1, 2];
  for (let k1 = n - 2; k1 >= 2; k1--) {
    const k2 = n - k1;
    const id = toVertexId(0, k1, k2);
    if (!colors.has(id)) {
      colors.set(id, rng.pick(bottomOptions));
    }
  }

  // Right Edge (k1 = 0, k2 from n-2 down to 2): Color 1 forbidden -> {2, 0}
  const rightOptions: readonly RulingColor[] = [2, 0];
  for (let k2 = n - 2; k2 >= 2; k2--) {
    const k0 = n - k2;
    const id = toVertexId(k0, 0, k2);
    if (!colors.has(id)) {
      colors.set(id, rng.pick(rightOptions));
    }
  }

  return colors;
}

/**
 * Checks whether an elementary triangle is panchromatic ("rainbow" {0, 1, 2}).
 */
export function isPanchromaticTriangle(
  triangle: ElementaryTriangle,
  colors: ReadonlyMap<VertexId, RulingColor>
): boolean {
  const c0 = colors.get(triangle.vertices[0]);
  const c1 = colors.get(triangle.vertices[1]);
  const c2 = colors.get(triangle.vertices[2]);
  if (c0 === undefined || c1 === undefined || c2 === undefined) {
    return false;
  }
  return c0 !== c1 && c1 !== c2 && c0 !== c2;
}

/**
 * Returns all panchromatic ({0, 1, 2}) elementary triangles currently present on the board.
 */
export function findAllPanchromaticTriangles(
  graph: LatticeGraph,
  colors: ReadonlyMap<VertexId, RulingColor>
): ElementaryTriangle[] {
  return graph.triangles.filter((tri) => isPanchromaticTriangle(tri, colors));
}
