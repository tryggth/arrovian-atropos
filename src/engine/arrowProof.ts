/**
 * Arrow's Impossibility Theorem Implication & Proof Extraction Engine (v0.2.0)
 *
 * Implements:
 * 1. Pairwise Vote Tallies (A vs B, B vs C, C vs A) for any preference profile (k_0, k_1, k_2).
 * 2. Dynamic Arrovian Selection Implications for each candidate societal ruling c in {0, 1, 2}:
 *    - Supporting Coalition Block (G_0, G_1, G_2) & Vote Split (k_c vs n - k_c)
 *    - Constitutional Power Classification:
 *      * Majority Rule (k_c > n - k_c)
 *      * Split Tie-Break (k_c = n - k_c)
 *      * Minority Override (1 < k_c < n - k_c)
 *      * 1-Voter Dictator Override (k_c = 1)
 *      * Unanimous Pareto Violation (k_c = 0)
 *    - Local Transitivity vs. Immediate Arrovian Paradox Triad (A > C > B > A) preview
 * 3. Pivotal Dictator Voter Index d in {1..n} & Paradox Triad Post-Mortem Proof Extraction
 *    following Tanaka (2006) / Reny (2001) / Geanakopolos (2005).
 */

import {
  BarycentricCoord,
  ElementaryTriangle,
  isPanchromaticTriangle,
  LatticeGraph,
  RULING_COLORS,
  RulingColor,
  VertexId,
} from './barycentric';

export type PowerClassification =
  | 'Majority Rule'
  | 'Split Tie-Break'
  | 'Minority Override'
  | '1-Voter Dictator Override'
  | 'Unanimous Pareto Violation';

export interface PairwiseTally {
  readonly pairLabel: 'A vs B' | 'B vs C' | 'C vs A';
  readonly leftOption: 'A' | 'B' | 'C';
  readonly rightOption: 'A' | 'B' | 'C';
  readonly leftVotes: number;
  readonly rightVotes: number;
  readonly leftBlocksLabel: string;
  readonly rightBlocksLabel: string;
  readonly isUnanimous: boolean;
  readonly unanimousWinner: string | null;
  readonly paretoForbiddenRuling: RulingColor | null;
}

export interface ParadoxTriadMember {
  readonly vertexId: VertexId;
  readonly coord: BarycentricCoord;
  readonly ruling: RulingColor;
  readonly rulingBadge: string;
  readonly coalitionBlock: 'G₀' | 'G₁' | 'G₂';
  readonly supportVotes: number;
  readonly opposeVotes: number;
}

export interface ParadoxTriadProof {
  readonly triangle: ElementaryTriangle;
  readonly membersByRuling: Record<RulingColor, ParadoxTriadMember>;
  readonly cycleText: string;
  readonly pivotalVoterIndex: number;
  readonly pivotalTransitionSummary: string;
  readonly explanation: string;
}

export interface RulingImplication {
  readonly ruling: RulingColor;
  readonly rulingText: string;
  readonly shortBadge: string;
  readonly coalitionBlock: 'G₀' | 'G₁' | 'G₂';
  readonly coalitionRanking: string;
  readonly supportVotes: number;
  readonly opposeVotes: number;
  readonly totalVoters: number;
  readonly splitLabel: string;
  readonly powerClassification: PowerClassification;
  readonly powerBadgeText: string;
  readonly compactPillText: string;
  readonly isLocallyTransitive: boolean;
  readonly triggeredTriads: readonly ElementaryTriangle[];
  readonly pivotalDictatorVoter: number | null;
  readonly primaryParadoxProof: ParadoxTriadProof | null;
}

/**
 * Computes the 3 pairwise societal tallies (A vs B, B vs C, C vs A) for a preference profile (k_0, k_1, k_2).
 *
 * - Block G_0 (k_0 voters): A > B > C
 * - Block G_1 (k_1 voters): B > C > A
 * - Block G_2 (k_2 voters): C > A > B
 */
export function computePairwiseTallies(coord: BarycentricCoord): readonly [
  PairwiseTally,
  PairwiseTally,
  PairwiseTally,
] {
  const [k0, k1, k2] = coord;
  const n = k0 + k1 + k2;

  // 1. A vs B: G_0 + G_2 (k0 + k2) prefer A > B; G_1 (k1) prefers B > A
  const aOverB = k0 + k2;
  const bOverA = k1;
  const abUnanimous = aOverB === n || bOverA === n;
  const abWinner = aOverB === n ? 'A ≻ B' : bOverA === n ? 'B ≻ A' : null;

  // 2. B vs C: G_0 + G_1 (k0 + k1) prefer B > C; G_2 (k2) prefers C > B
  const bOverC = k0 + k1;
  const cOverB = k2;
  const bcUnanimous = bOverC === n || cOverB === n;
  const bcWinner = bOverC === n ? 'B ≻ C' : cOverB === n ? 'C ≻ B' : null;

  // 3. C vs A: G_1 + G_2 (k1 + k2) prefer C > A; G_0 (k0) prefers A > C
  const cOverA = k1 + k2;
  const aOverC = k0;
  const caUnanimous = cOverA === n || aOverC === n;
  const caWinner = cOverA === n ? 'C ≻ A' : aOverC === n ? 'A ≻ C' : null;

  return [
    {
      pairLabel: 'A vs B',
      leftOption: 'A',
      rightOption: 'B',
      leftVotes: aOverB,
      rightVotes: bOverA,
      leftBlocksLabel: 'G₀ + G₂',
      rightBlocksLabel: 'G₁',
      isUnanimous: abUnanimous,
      unanimousWinner: abWinner,
      paretoForbiddenRuling: aOverB === n ? 1 : null,
    },
    {
      pairLabel: 'B vs C',
      leftOption: 'B',
      rightOption: 'C',
      leftVotes: bOverC,
      rightVotes: cOverB,
      leftBlocksLabel: 'G₀ + G₁',
      rightBlocksLabel: 'G₂',
      isUnanimous: bcUnanimous,
      unanimousWinner: bcWinner,
      paretoForbiddenRuling: bOverC === n ? 2 : null,
    },
    {
      pairLabel: 'C vs A',
      leftOption: 'C',
      rightOption: 'A',
      leftVotes: cOverA,
      rightVotes: aOverC,
      leftBlocksLabel: 'G₁ + G₂',
      rightBlocksLabel: 'G₀',
      isUnanimous: caUnanimous,
      unanimousWinner: caWinner,
      paretoForbiddenRuling: cOverA === n ? 0 : null,
    },
  ];
}

/**
 * Classifies the constitutional power dynamics when assigning `ruling` (0, 1, or 2)
 * at a preference profile (k_0, k_1, k_2).
 */
export function classifyPowerDynamics(
  supportVotes: number,
  opposeVotes: number,
  coalitionBlock: 'G₀' | 'G₁' | 'G₂'
): {
  classification: PowerClassification;
  powerBadgeText: string;
  compactPillText: string;
} {
  if (supportVotes === 0) {
    return {
      classification: 'Unanimous Pareto Violation',
      powerBadgeText: `Unanimous Pareto Violation (0 vs ${opposeVotes})`,
      compactPillText: `${coalitionBlock}: 0v${opposeVotes} Pareto Forbidden`,
    };
  }

  if (supportVotes > opposeVotes) {
    return {
      classification: 'Majority Rule',
      powerBadgeText: `Majority Rule (${supportVotes} vs ${opposeVotes})`,
      compactPillText: `${coalitionBlock}: ${supportVotes}v${opposeVotes} Majority`,
    };
  }

  if (supportVotes === opposeVotes) {
    return {
      classification: 'Split Tie-Break',
      powerBadgeText: `Split Tie-Break (${supportVotes} vs ${opposeVotes})`,
      compactPillText: `${coalitionBlock}: ${supportVotes}v${opposeVotes} Tie-Break`,
    };
  }

  if (supportVotes === 1) {
    return {
      classification: '1-Voter Dictator Override',
      powerBadgeText: `1-Voter Dictator Override (1 vs ${opposeVotes})`,
      compactPillText: `${coalitionBlock}: 1v${opposeVotes} Dictator`,
    };
  }

  return {
    classification: 'Minority Override',
    powerBadgeText: `Minority Override (${supportVotes} vs ${opposeVotes})`,
    compactPillText: `${coalitionBlock}: ${supportVotes}v${opposeVotes} Minority`,
  };
}

/**
 * Computes the Pivotal Dictator Voter index d in {1..n} along the single-voter transition
 * between profile v^(0) (where society rules A > C) and profile v^(1) (where society rules B > A).
 *
 * Voters 1..k_0 are in Block G_0, voters (k_0 + 1)..(k_0 + k_1) are in Block G_1,
 * and voters (k_0 + k_1 + 1)..n are in Block G_2.
 */
export function computePivotalVoterIndex(
  coord0: BarycentricCoord,
  coord1: BarycentricCoord
): number {
  const [k0_a, k1_a, k2_a] = coord0;
  const [k0_b, k1_b] = coord1;
  const n = k0_a + k1_a + k2_a;

  let rawIndex: number;
  if (k0_a !== k0_b) {
    rawIndex = Math.max(k0_a, k0_b);
  } else {
    rawIndex = k0_a + Math.max(k1_a, k1_b);
  }

  return Math.max(1, Math.min(n, rawIndex));
}

/**
 * Extracts the complete Arrovian Paradox Triad Proof (the 3 profiles, intransitive cycle A > C > B > A,
 * and Pivotal Dictator Voter #d) for a completed panchromatic Voter-Shift Triad.
 */
export function extractParadoxTriadProof(
  graph: LatticeGraph,
  colors: ReadonlyMap<VertexId, RulingColor>,
  triangle: ElementaryTriangle
): ParadoxTriadProof | null {
  if (!isPanchromaticTriangle(triangle, colors)) {
    return null;
  }

  const membersPartial: Partial<Record<RulingColor, ParadoxTriadMember>> = {};

  for (const vId of triangle.vertices) {
    const ruling = colors.get(vId);
    const vertex = graph.vertices.get(vId);
    if (ruling === undefined || !vertex) {
      return null;
    }

    const meta = RULING_COLORS[ruling];
    const supportVotes = vertex.coord[ruling];
    const opposeVotes = graph.n - supportVotes;

    membersPartial[ruling] = {
      vertexId: vId,
      coord: vertex.coord,
      ruling,
      rulingBadge: meta.ruling,
      coalitionBlock: meta.coalitionBlock,
      supportVotes,
      opposeVotes,
    };
  }

  const m0 = membersPartial[0];
  const m1 = membersPartial[1];
  const m2 = membersPartial[2];

  if (!m0 || !m1 || !m2) {
    return null;
  }

  const pivotalVoterIndex = computePivotalVoterIndex(m0.coord, m1.coord);
  const pivotalTransitionSummary = `Single-Voter Shift (${m0.coord.join(', ')}) ↔ (${m1.coord.join(', ')}) flips society from A ≻ C to B ≻ A while (${m2.coord.join(', ')}) locks C ≻ B.`;
  const explanation = `Across these three adjacent preference profiles (differing by only a single voter's ballot), the constitution simultaneously rules A ≻ C at (${m0.coord.join(',')}), C ≻ B at (${m2.coord.join(',')}), and B ≻ A at (${m1.coord.join(',')}). Under Independence of Irrelevant Alternatives (IIA), Voter #${pivotalVoterIndex} acts as the local Arrovian Dictator whose single preference shift forces the Condorcet cycle A ≻ C ≻ B ≻ A.`;

  return {
    triangle,
    membersByRuling: { 0: m0, 1: m1, 2: m2 },
    cycleText: 'A ≻ C ≻ B ≻ A',
    pivotalVoterIndex,
    pivotalTransitionSummary,
    explanation,
  };
}

/**
 * Evaluates the live Arrovian constitutional implication of assigning `ruling` (0, 1, or 2)
 * to `vertexId` on the current lattice.
 */
export function evaluateRulingImplication(
  graph: LatticeGraph,
  colors: ReadonlyMap<VertexId, RulingColor>,
  vertexId: VertexId,
  ruling: RulingColor
): RulingImplication {
  const vertex = graph.vertices.get(vertexId);
  if (!vertex) {
    throw new Error(`Unknown vertexId: ${vertexId}`);
  }

  const meta = RULING_COLORS[ruling];
  const supportVotes = vertex.coord[ruling];
  const opposeVotes = graph.n - supportVotes;
  const splitLabel = `${supportVotes} vs ${opposeVotes}`;

  const { classification, powerBadgeText, compactPillText } =
    classifyPowerDynamics(supportVotes, opposeVotes, meta.coalitionBlock);

  // Hypothetically assign `ruling` to `vertexId` to check local transitivity on incident Voter-Shift Triads
  const hypotheticalColors = new Map(colors);
  hypotheticalColors.set(vertexId, ruling);

  const incidentTriangles = graph.vertexTriangles.get(vertexId) ?? [];
  const triggeredTriads = incidentTriangles.filter((tri) =>
    isPanchromaticTriangle(tri, hypotheticalColors)
  );

  const isLocallyTransitive = triggeredTriads.length === 0;
  const primaryParadoxProof =
    triggeredTriads.length > 0
      ? extractParadoxTriadProof(graph, hypotheticalColors, triggeredTriads[0]!)
      : null;

  return {
    ruling,
    rulingText: meta.ruling,
    shortBadge: meta.shortBadge,
    coalitionBlock: meta.coalitionBlock,
    coalitionRanking: meta.coalitionRanking,
    supportVotes,
    opposeVotes,
    totalVoters: graph.n,
    splitLabel,
    powerClassification: classification,
    powerBadgeText,
    compactPillText,
    isLocallyTransitive,
    triggeredTriads,
    pivotalDictatorVoter: primaryParadoxProof?.pivotalVoterIndex ?? null,
    primaryParadoxProof,
  };
}

/**
 * Evaluates all 3 candidate societal rulings (0: A > C, 1: B > A, 2: C > B) at `vertexId`.
 */
export function evaluateAllRulingsAtVertex(
  graph: LatticeGraph,
  colors: ReadonlyMap<VertexId, RulingColor>,
  vertexId: VertexId
): Record<RulingColor, RulingImplication> {
  return {
    0: evaluateRulingImplication(graph, colors, vertexId, 0),
    1: evaluateRulingImplication(graph, colors, vertexId, 1),
    2: evaluateRulingImplication(graph, colors, vertexId, 2),
  };
}
