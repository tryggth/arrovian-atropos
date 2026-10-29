/**
 * Immutable State Machine for Arrovian Atropos ("The Constitutional Architect's Dilemma")
 *
 * Rules (Single-Voter Shift k = 1 Locality + Deadlock Jump):
 *  - A single Constitutional Architect adjudicates Divided Electorate Profiles step-by-step.
 *  - Step 1: The Constitutional Architect may adjudicate ANY unadjudicated Divided Electorate Profile
 *    in the interior with a pairwise societal ruling c in {0, 1, 2}.
 *  - Subsequent Steps (Single-Voter Shift k = 1):
 *      Let v_last be the profile adjudicated on the immediately preceding step.
 *      * Single-Voter Shift: If v_last has at least one unadjudicated interior neighbor (at distance 1),
 *        the Constitutional Architect MUST adjudicate one of those neighboring profiles.
 *      * Deadlock Jump: If all 6 neighbors of v_last are already adjudicated, the Constitutional Architect
 *        may jump to ANY remaining unadjudicated interior profile on the simplex.
 *  - Termination (Arrow's Impossibility Trap):
 *      Immediately after adjudicating v, inspect the (up to 6) Voter-Shift Triads incident to v.
 *      If ANY incident triad has all three societal rulings {A > C, B > A, C > B}, the constitution
 *      collapses into an intransitive Condorcet cycle A > C > B > A and unmasks a Pivotal Dictator Voter.
 */

import {
  BarycentricCoord,
  createLatticeGraph,
  DEFAULT_BOARD_SIZE,
  ElementaryTriangle,
  generateBoundaryColoring,
  isPanchromaticTriangle,
  LatticeGraph,
  RulingColor,
  VertexId,
} from './barycentric';

export const CONSTITUTIONAL_ARCHITECT = {
  title: 'Constitutional Architect',
  role: 'Builds Coherent Social Choice Rule',
  badgeClass: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
} as const;

export interface MoveRecord {
  readonly turn: number;
  readonly vertexId: VertexId;
  readonly coord: BarycentricCoord;
  readonly color: RulingColor;
  readonly wasJump: boolean;
}

export interface GameState {
  readonly n: number;
  readonly seed: string;
  readonly graph: LatticeGraph;
  readonly colors: ReadonlyMap<VertexId, RulingColor>;
  readonly turn: number;
  readonly lastMove: VertexId | null;
  readonly legalMoves: ReadonlySet<VertexId>;
  readonly isJumpTurn: boolean;
  readonly status: 'playing' | 'finished';
  readonly losingTriangles: readonly ElementaryTriangle[];
  readonly moveHistory: readonly MoveRecord[];
}

export interface LegalMoveResult {
  readonly legalMoves: Set<VertexId>;
  readonly isJumpTurn: boolean;
}

/**
 * Computes the set of legal target vertices for the current step under Single-Voter Shift (k = 1)
 * locality and the Deadlock Jump rule.
 */
export function computeLegalMoves(
  graph: LatticeGraph,
  colors: ReadonlyMap<VertexId, RulingColor>,
  lastMove: VertexId | null
): LegalMoveResult {
  // Collect all unadjudicated interior vertices
  const allUncoloredInterior = graph.interiorIds.filter((id) => !colors.has(id));

  if (allUncoloredInterior.length === 0) {
    return { legalMoves: new Set(), isJumpTurn: false };
  }

  // Opening step: any unadjudicated interior profile is open
  if (lastMove === null) {
    return {
      legalMoves: new Set(allUncoloredInterior),
      isJumpTurn: true,
    };
  }

  const lastVertex = graph.vertices.get(lastMove);
  if (!lastVertex) {
    return {
      legalMoves: new Set(allUncoloredInterior),
      isJumpTurn: true,
    };
  }

  // Find all unadjudicated interior neighbors of lastMove (Pareto boundary neighbors are pre-colored at Step 0)
  const uncoloredNeighbors = lastVertex.neighbors.filter(
    (nId) => !colors.has(nId) && graph.vertices.get(nId)?.isInterior === true
  );

  if (uncoloredNeighbors.length > 0) {
    return {
      legalMoves: new Set(uncoloredNeighbors),
      isJumpTurn: false,
    };
  }

  // Deadlock Jump: all 6 neighbors of lastMove are already adjudicated -> jump to any open interior profile
  return {
    legalMoves: new Set(allUncoloredInterior),
    isJumpTurn: true,
  };
}

/**
 * Creates a fresh Step 0 GameState for a given electorate size n and constitution seed string.
 */
export function createInitialGameState(
  n: number = DEFAULT_BOARD_SIZE,
  seed: string = 'arrow-1951'
): GameState {
  const graph = createLatticeGraph(n);
  const colors = generateBoundaryColoring(graph, seed);
  const { legalMoves, isJumpTurn } = computeLegalMoves(graph, colors, null);

  return {
    n,
    seed,
    graph,
    colors,
    turn: 1,
    lastMove: null,
    legalMoves,
    isJumpTurn,
    status: 'playing',
    losingTriangles: [],
    moveHistory: [],
  };
}

/**
 * Applies the Constitutional Architect's adjudication (`vertexId` with `color`) and returns
 * the next immutable GameState.
 */
export function applyMove(
  state: GameState,
  vertexId: VertexId,
  color: RulingColor
): GameState {
  if (state.status !== 'playing') {
    throw new Error('Cannot apply move: game is already finished.');
  }

  if (!state.legalMoves.has(vertexId)) {
    throw new Error(
      `Illegal move: vertex ${vertexId} is not a legal target on turn ${state.turn}.`
    );
  }

  const vertex = state.graph.vertices.get(vertexId);
  if (!vertex || !vertex.isInterior) {
    throw new Error(
      `Illegal move: vertex ${vertexId} is not a playable interior vertex.`
    );
  }

  if (state.colors.has(vertexId)) {
    throw new Error(`Illegal move: vertex ${vertexId} is already colored.`);
  }

  const nextColors = new Map(state.colors);
  nextColors.set(vertexId, color);

  const moveRecord: MoveRecord = {
    turn: state.turn,
    vertexId,
    coord: vertex.coord,
    color,
    wasJump: state.isJumpTurn,
  };

  const nextHistory = [...state.moveHistory, moveRecord];

  // Inspect the (up to 6) Voter-Shift Triads incident to vertexId
  const incidentTriangles = state.graph.vertexTriangles.get(vertexId) ?? [];
  const newlyCompletedRainbow = incidentTriangles.filter((tri) =>
    isPanchromaticTriangle(tri, nextColors)
  );

  if (newlyCompletedRainbow.length > 0) {
    return {
      ...state,
      colors: nextColors,
      lastMove: vertexId,
      legalMoves: new Set(),
      isJumpTurn: false,
      status: 'finished',
      losingTriangles: newlyCompletedRainbow,
      moveHistory: nextHistory,
    };
  }

  const { legalMoves, isJumpTurn } = computeLegalMoves(
    state.graph,
    nextColors,
    vertexId
  );

  return {
    ...state,
    colors: nextColors,
    turn: state.turn + 1,
    lastMove: vertexId,
    legalMoves,
    isJumpTurn,
    moveHistory: nextHistory,
  };
}
