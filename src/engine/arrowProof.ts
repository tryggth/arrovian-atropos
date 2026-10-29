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

export interface VoterBlockPartition {
  readonly blockIndex: RulingColor;
  readonly blockLabel: 'G₀' | 'G₁' | 'G₂';
  readonly ranking: string;
  readonly count: number;
  readonly startVoterId: number | null;
  readonly endVoterId: number | null;
  readonly voterIds: readonly number[];
  readonly rangeLabel: string;
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
  readonly voterRangeLabel: string;
  readonly swfOutputConstraint: string;
  readonly tanakaPartitionConstraint: string;
  readonly decisiveCoalitionFormula: string;
  readonly powerClassification: PowerClassification;
  readonly powerBadgeText: string;
  readonly compactPillText: string;
  readonly isLocallyTransitive: boolean;
  readonly triggeredTriads: readonly ElementaryTriangle[];
  readonly pivotalDictatorVoter: number | null;
  readonly primaryParadoxProof: ParadoxTriadProof | null;
}

export const SWF_OUTPUT_CONSTRAINTS: Record<
  RulingColor,
  {
    readonly outputSet: string;
    readonly tanakaSet: string;
    readonly decisivePair: string;
  }
> = {
  0: {
    outputSet: 'F(P) ∈ {A≻B≻C, A≻C≻B, B≻A≻C}',
    tanakaSet: 'Tanaka Partition: {A≻B≻C, A≻C≻B, B≻A≻C}',
    decisivePair: 'D_G₀(A,C)',
  },
  1: {
    outputSet: 'F(P) ∈ {B≻C≻A, C≻B≻A, B≻A≻C}',
    tanakaSet: 'Tanaka Partition: {B≻C≻A, C≻B≻A}',
    decisivePair: 'D_G₁(B,A)',
  },
  2: {
    outputSet: 'F(P) ∈ {C≻A≻B, C≻B≻A, A≻C≻B}',
    tanakaSet: 'Tanaka Partition: {C≻A≻B}',
    decisivePair: 'D_G₂(C,B)',
  },
};

/**
 * Formats a contiguous range of 1-indexed Voter IDs into a compact set string:
 *  - count = 0 -> '∅'
 *  - count = 1 -> '{#s}'
 *  - count = 2 -> '{#s, #(s+1)}'
 *  - count >= 3 -> '{#s..#e}'
 */
export function formatVoterRange(startVoterId: number, count: number): string {
  if (count <= 0) return '∅';
  if (count === 1) return `{#${startVoterId}}`;
  if (count === 2) return `{#${startVoterId}, #${startVoterId + 1}}`;
  return `{#${startVoterId}..#${startVoterId + count - 1}}`;
}

/**
 * Computes the contiguous Voter-ID partition for blocks G_0(v), G_1(v), G_2(v)
 * at preference profile v = (k_0, k_1, k_2) with k_0 + k_1 + k_2 = n:
 *  - G_0(v) = {#1 .. #k_0}
 *  - G_1(v) = {#(k_0 + 1) .. #(k_0 + k_1)}
 *  - G_2(v) = {#(k_0 + k_1 + 1) .. #n}
 */
export function computeVoterBlockPartitions(coord: BarycentricCoord): readonly [
  VoterBlockPartition,
  VoterBlockPartition,
  VoterBlockPartition,
] {
  const [k0, k1, k2] = coord;

  const buildBlock = (
    blockIndex: RulingColor,
    startOffset: number,
    count: number
  ): VoterBlockPartition => {
    const meta = RULING_COLORS[blockIndex];
    const startVoterId = count > 0 ? startOffset + 1 : null;
    const endVoterId = count > 0 ? startOffset + count : null;
    const voterIds = Array.from({ length: count }, (_, i) => startOffset + 1 + i);
    const rangeLabel = formatVoterRange(startOffset + 1, count);

    return {
      blockIndex,
      blockLabel: meta.coalitionBlock,
      ranking: meta.coalitionRanking,
      count,
      startVoterId,
      endVoterId,
      voterIds,
      rangeLabel,
    };
  };

  return [
    buildBlock(0, 0, k0),
    buildBlock(1, k0, k1),
    buildBlock(2, k0 + k1, k2),
  ];
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

  const pivotalVoterIndex = getTriadPivotalVoter(graph, triangle);
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

  const partitions = computeVoterBlockPartitions(vertex.coord);
  const blockPartition = partitions[ruling];
  const voterRangeLabel = blockPartition.rangeLabel;
  const swfMeta = SWF_OUTPUT_CONSTRAINTS[ruling];
  const swfOutputConstraint = swfMeta.outputSet;
  const tanakaPartitionConstraint = swfMeta.tanakaSet;
  const decisiveCoalitionFormula = `Forces ${swfMeta.decisivePair} → d ∈ ${voterRangeLabel}`;

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
    voterRangeLabel,
    swfOutputConstraint,
    tanakaPartitionConstraint,
    decisiveCoalitionFormula,
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

// ============================================================================
// Section 4.2 — Live "Possible Dictators" Toggle & Radar Analysis
// ============================================================================

export type TriadThreatStatus = 'eliminated' | 'armed' | 'latent' | 'paradox';

export interface TriadDictatorState {
  readonly triangle: ElementaryTriangle;
  readonly pivotalVoterId: number;
  readonly status: TriadThreatStatus;
  readonly assignedRulings: readonly RulingColor[];
  readonly openVertexIds: readonly VertexId[];
  /** Present when status === 'armed' (1 move away from unmasking pivotalVoterId). */
  readonly openVertexId: VertexId | null;
  readonly missingRuling: RulingColor | null;
}

export type VoterDictatorStatus = 'unmasked' | 'armed' | 'viable' | 'cleared';

export interface VoterDictatorSummary {
  readonly voterId: number;
  readonly status: VoterDictatorStatus;
  readonly totalTriads: number;
  readonly armedTriads: readonly TriadDictatorState[];
  readonly latentTriads: readonly TriadDictatorState[];
  readonly eliminatedCount: number;
  readonly paradoxTriads: readonly TriadDictatorState[];
  /** Unique open interior vertex IDs where a single ruling would immediately unmask this voter. */
  readonly triggerVertexIds: readonly VertexId[];
}

export interface VertexThreatSummary {
  readonly vertexId: VertexId;
  readonly coord: BarycentricCoord;
  readonly safeRulings: readonly RulingColor[];
  /** Maps each lethal ruling c not in safeRulings to the sorted list of Pivotal Voter IDs it unmasks. */
  readonly lethalRulings: ReadonlyMap<RulingColor, readonly number[]>;
  readonly isConstrained: boolean;
  readonly isInevitableTrap: boolean;
}

export interface PossibleDictatorsAnalysis {
  readonly triadStates: ReadonlyMap<string, TriadDictatorState>;
  readonly voterSummaries: readonly VoterDictatorSummary[];
  readonly vertexThreats: ReadonlyMap<VertexId, VertexThreatSummary>;
  readonly activeCandidateVoterIds: readonly number[];
  readonly armedVoterIds: readonly number[];
  readonly clearedVoterIds: readonly number[];
  readonly trapVertexIds: readonly VertexId[];
}

/**
 * Returns the canonical Pivotal Voter index d(\tau) = \max_{u \in \tau} k_0(u) \in {1..n}
 * associated with a Voter-Shift Triad \tau.
 */
export function getTriadPivotalVoter(
  graph: LatticeGraph,
  triangle: ElementaryTriangle
): number {
  let maxK0 = 1;
  for (const vId of triangle.vertices) {
    const v = graph.vertices.get(vId);
    if (v && v.coord[0] > maxK0) {
      maxK0 = v.coord[0];
    }
  }
  return Math.max(1, Math.min(graph.n, maxK0));
}

/**
 * Classifies a single Voter-Shift Triad \tau at the current board state into
 * 'eliminated', 'armed', 'latent', or 'paradox'.
 */
export function classifyTriadDictatorState(
  graph: LatticeGraph,
  colors: ReadonlyMap<VertexId, RulingColor>,
  triangle: ElementaryTriangle
): TriadDictatorState {
  const pivotalVoterId = getTriadPivotalVoter(graph, triangle);
  const assignedRulings: RulingColor[] = [];
  const openVertexIds: VertexId[] = [];

  for (const vId of triangle.vertices) {
    const c = colors.get(vId);
    if (c !== undefined) {
      assignedRulings.push(c);
    } else {
      openVertexIds.push(vId);
    }
  }

  const uniqueRulings = new Set(assignedRulings);

  // Case 1: All 3 vertices colored with distinct rulings {0, 1, 2} -> 'paradox'
  if (assignedRulings.length === 3 && uniqueRulings.size === 3) {
    return {
      triangle,
      pivotalVoterId,
      status: 'paradox',
      assignedRulings,
      openVertexIds,
      openVertexId: null,
      missingRuling: null,
    };
  }

  // Case 2: >= 2 vertices already share the same ruling -> 'eliminated' (can never become {0,1,2})
  if (assignedRulings.length >= 2 && uniqueRulings.size < assignedRulings.length) {
    return {
      triangle,
      pivotalVoterId,
      status: 'eliminated',
      assignedRulings,
      openVertexIds,
      openVertexId: null,
      missingRuling: null,
    };
  }

  // Case 3: Exactly 2 vertices colored with distinct rulings and 1 open vertex -> 'armed'
  if (
    assignedRulings.length === 2 &&
    uniqueRulings.size === 2 &&
    openVertexIds.length === 1
  ) {
    const openVertexId = openVertexIds[0]!;
    const missingRuling =
      ([0, 1, 2] as const).find((r) => !uniqueRulings.has(r)) ?? null;
    return {
      triangle,
      pivotalVoterId,
      status: 'armed',
      assignedRulings,
      openVertexIds,
      openVertexId,
      missingRuling,
    };
  }

  // Case 4: 0 or 1 vertices colored -> 'latent'
  return {
    triangle,
    pivotalVoterId,
    status: 'latent',
    assignedRulings,
    openVertexIds,
    openVertexId: null,
    missingRuling: null,
  };
}

/**
 * Analyzes the entire simplex board at any stage of play to determine:
 * 1. The threat status ('eliminated' | 'armed' | 'latent' | 'paradox') of all n^2 Voter-Shift Triads.
 * 2. The live status ('unmasked' | 'armed' | 'viable' | 'cleared') of every voter d in {1..n}.
 * 3. The Safe Ruling Set S(v) and Inevitable Dictator Trap status (|S(v)| = 0) of every open interior profile.
 */
export function analyzePossibleDictators(
  graph: LatticeGraph,
  colors: ReadonlyMap<VertexId, RulingColor>
): PossibleDictatorsAnalysis {
  const triadStates = new Map<string, TriadDictatorState>();

  const byVoter = new Map<
    number,
    {
      total: number;
      armed: TriadDictatorState[];
      latent: TriadDictatorState[];
      eliminated: number;
      paradox: TriadDictatorState[];
      triggers: Set<VertexId>;
    }
  >();

  for (let d = 1; d <= graph.n; d++) {
    byVoter.set(d, {
      total: 0,
      armed: [],
      latent: [],
      eliminated: 0,
      paradox: [],
      triggers: new Set(),
    });
  }

  for (const tri of graph.triangles) {
    const tState = classifyTriadDictatorState(graph, colors, tri);
    triadStates.set(tri.id, tState);

    const bucket = byVoter.get(tState.pivotalVoterId)!;
    bucket.total += 1;
    if (tState.status === 'armed') {
      bucket.armed.push(tState);
      if (tState.openVertexId) {
        bucket.triggers.add(tState.openVertexId);
      }
    } else if (tState.status === 'latent') {
      bucket.latent.push(tState);
    } else if (tState.status === 'eliminated') {
      bucket.eliminated += 1;
    } else if (tState.status === 'paradox') {
      bucket.paradox.push(tState);
    }
  }

  const voterSummaries: VoterDictatorSummary[] = [];
  const activeCandidateVoterIds: number[] = [];
  const armedVoterIds: number[] = [];
  const clearedVoterIds: number[] = [];

  for (let d = 1; d <= graph.n; d++) {
    const b = byVoter.get(d)!;
    let status: VoterDictatorStatus;
    if (b.paradox.length > 0) {
      status = 'unmasked';
    } else if (b.armed.length > 0) {
      status = 'armed';
    } else if (b.latent.length > 0) {
      status = 'viable';
    } else {
      status = 'cleared';
    }

    if (status === 'armed') {
      armedVoterIds.push(d);
    }
    if (status === 'Cleared'.toLowerCase() || status === 'cleared') {
      clearedVoterIds.push(d);
    } else {
      activeCandidateVoterIds.push(d);
    }

    voterSummaries.push({
      voterId: d,
      status,
      totalTriads: b.total,
      armedTriads: b.armed,
      latentTriads: b.latent,
      eliminatedCount: b.eliminated,
      paradoxTriads: b.paradox,
      triggerVertexIds: Array.from(b.triggers),
    });
  }

  // Compute per-vertex Safe Ruling Sets S(v) and lethal ruling maps for all uncolored interior vertices
  const vertexThreats = new Map<VertexId, VertexThreatSummary>();
  const trapVertexIds: VertexId[] = [];

  for (const vId of graph.interiorIds) {
    if (colors.has(vId)) continue;
    const vertex = graph.vertices.get(vId);
    if (!vertex) continue;

    const incidentTris = graph.vertexTriangles.get(vId) ?? [];
    const lethalMap = new Map<RulingColor, Set<number>>();

    for (const tri of incidentTris) {
      const tState = triadStates.get(tri.id);
      if (
        tState &&
        tState.status === 'armed' &&
        tState.openVertexId === vId &&
        tState.missingRuling !== null
      ) {
        const set = lethalMap.get(tState.missingRuling) ?? new Set<number>();
        set.add(tState.pivotalVoterId);
        lethalMap.set(tState.missingRuling, set);
      }
    }

    const safeRulings: RulingColor[] = [];
    const lethalRulings = new Map<RulingColor, readonly number[]>();

    for (const r of [0, 1, 2] as const) {
      const voters = lethalMap.get(r);
      if (voters && voters.size > 0) {
        lethalRulings.set(
          r,
          Array.from(voters).sort((a, b) => a - b)
        );
      } else {
        safeRulings.push(r);
      }
    }

    const isInevitableTrap = safeRulings.length === 0;
    const isConstrained = safeRulings.length > 0 && safeRulings.length < 3;

    if (isInevitableTrap) {
      trapVertexIds.push(vId);
    }

    vertexThreats.set(vId, {
      vertexId: vId,
      coord: vertex.coord,
      safeRulings,
      lethalRulings,
      isConstrained,
      isInevitableTrap,
    });
  }

  return {
    triadStates,
    voterSummaries,
    vertexThreats,
    activeCandidateVoterIds,
    armedVoterIds,
    clearedVoterIds,
    trapVertexIds,
  };
}
