/**
 * Immutable State Machine for Arrovian Atropos (Normal Play — "Avoid the Dictator")
 *
 * Rules (k = 1 Locality + Jump Rule):
 *  - Player 1 (Hero / Social Planner) and Player 2 (Adversary / Skeptic) alternate turns.
 *  - Turn 1: Player 1 may color ANY uncolored interior vertex with c in {0, 1, 2}.
 *  - Subsequent Turns (k = 1):
 *      Let v_last be the vertex colored on the immediately preceding turn.
 *      * Adjacent Play: If v_last has at least one uncolored neighbor (at distance 1),
 *        the active player MUST play on one of those uncolored neighbors.
 *      * Jump Rule: If all 6 neighbors of v_last are already colored, the active player
 *        may jump to ANY uncolored interior vertex on the board.
 *  - Termination (Avoid the Dictator):
 *      Immediately after coloring v, inspect the (up to 6) elementary triangles incident to v.
 *      If ANY incident triangle has all three colors {0, 1, 2}, the player who just moved LOSES
 *      immediately and the other player WINS.
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

export type PlayerId = 1 | 2;
export type GameMode = 'solo' | 'duel';

export interface PlayerMetadata {
  readonly id: PlayerId;
  readonly title: string;
  readonly role: string;
  readonly badgeClass: string;
}

export const PLAYERS: Record<PlayerId, PlayerMetadata> = {
  1: {
    id: 1,
    title: 'Constitutional Architect',
    role: 'Builds Coherent Social Choice Rule',
    badgeClass: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
  },
  2: {
    id: 2,
    title: 'Social Choice Skeptic',
    role: 'Forces Arrovian Paradox',
    badgeClass: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  },
};

export interface MoveRecord {
  readonly turn: number;
  readonly player: PlayerId;
  readonly vertexId: VertexId;
  readonly coord: BarycentricCoord;
  readonly color: RulingColor;
  readonly wasJump: boolean;
}

export interface GameState {
  readonly n: number;
  readonly seed: string;
  readonly mode: GameMode;
  readonly graph: LatticeGraph;
  readonly colors: ReadonlyMap<VertexId, RulingColor>;
  readonly currentPlayer: PlayerId;
  readonly turn: number;
  readonly lastMove: VertexId | null;
  readonly legalMoves: ReadonlySet<VertexId>;
  readonly isJumpTurn: boolean;
  readonly status: 'playing' | 'finished';
  readonly loser: PlayerId | null;
  readonly winner: PlayerId | null;
  readonly losingTriangles: readonly ElementaryTriangle[];
  readonly moveHistory: readonly MoveRecord[];
}

export interface LegalMoveResult {
  readonly legalMoves: Set<VertexId>;
  readonly isJumpTurn: boolean;
}

/**
 * Computes the set of legal target vertices for the current turn under k = 1 locality
 * and the Jump Rule.
 */
export function computeLegalMoves(
  graph: LatticeGraph,
  colors: ReadonlyMap<VertexId, RulingColor>,
  lastMove: VertexId | null
): LegalMoveResult {
  // Collect all uncolored interior vertices
  const allUncoloredInterior = graph.interiorIds.filter((id) => !colors.has(id));

  if (allUncoloredInterior.length === 0) {
    return { legalMoves: new Set(), isJumpTurn: false };
  }

  // First turn of the game: any uncolored interior vertex is legal
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

  // Find all uncolored neighbors of lastMove (boundary neighbors are already colored at Turn 0)
  const uncoloredNeighbors = lastVertex.neighbors.filter(
    (nId) => !colors.has(nId) && graph.vertices.get(nId)?.isInterior === true
  );

  if (uncoloredNeighbors.length > 0) {
    return {
      legalMoves: new Set(uncoloredNeighbors),
      isJumpTurn: false,
    };
  }

  // Jump Rule: all 6 neighbors of lastMove are already colored -> jump anywhere in the interior
  return {
    legalMoves: new Set(allUncoloredInterior),
    isJumpTurn: true,
  };
}

/**
 * Creates a fresh Turn 0 GameState for a given board size n, seed string, and mode.
 */
export function createInitialGameState(
  n: number = DEFAULT_BOARD_SIZE,
  seed: string = 'arrow-1951',
  mode: GameMode = 'solo'
): GameState {
  const graph = createLatticeGraph(n);
  const colors = generateBoundaryColoring(graph, seed);
  const { legalMoves, isJumpTurn } = computeLegalMoves(graph, colors, null);

  return {
    n,
    seed,
    mode,
    graph,
    colors,
    currentPlayer: 1,
    turn: 1,
    lastMove: null,
    legalMoves,
    isJumpTurn,
    status: 'playing',
    loser: null,
    winner: null,
    losingTriangles: [],
    moveHistory: [],
  };
}

/**
 * Applies a player's move (coloring `vertexId` with `color`) and returns the next immutable GameState.
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
    throw new Error(`Illegal move: vertex ${vertexId} is not a legal target on turn ${state.turn}.`);
  }

  const vertex = state.graph.vertices.get(vertexId);
  if (!vertex || !vertex.isInterior) {
    throw new Error(`Illegal move: vertex ${vertexId} is not a playable interior vertex.`);
  }

  if (state.colors.has(vertexId)) {
    throw new Error(`Illegal move: vertex ${vertexId} is already colored.`);
  }

  const nextColors = new Map(state.colors);
  nextColors.set(vertexId, color);

  const moveRecord: MoveRecord = {
    turn: state.turn,
    player: state.currentPlayer,
    vertexId,
    coord: vertex.coord,
    color,
    wasJump: state.isJumpTurn,
  };

  const nextHistory = [...state.moveHistory, moveRecord];

  // Inspect the (up to 6) elementary triangles incident to vertexId
  const incidentTriangles = state.graph.vertexTriangles.get(vertexId) ?? [];
  const newlyCompletedRainbow = incidentTriangles.filter((tri) =>
    isPanchromaticTriangle(tri, nextColors)
  );

  if (newlyCompletedRainbow.length > 0) {
    const loser: PlayerId = state.currentPlayer;
    const winner: PlayerId | null =
      state.mode === 'solo' ? null : state.currentPlayer === 1 ? 2 : 1;

    return {
      ...state,
      colors: nextColors,
      lastMove: vertexId,
      legalMoves: new Set(),
      isJumpTurn: false,
      status: 'finished',
      loser,
      winner,
      losingTriangles: newlyCompletedRainbow,
      moveHistory: nextHistory,
    };
  }

  const nextPlayer: PlayerId =
    state.mode === 'solo' ? 1 : state.currentPlayer === 1 ? 2 : 1;
  const { legalMoves, isJumpTurn } = computeLegalMoves(
    state.graph,
    nextColors,
    vertexId
  );

  return {
    ...state,
    colors: nextColors,
    currentPlayer: nextPlayer,
    turn: state.turn + 1,
    lastMove: vertexId,
    legalMoves,
    isJumpTurn,
    moveHistory: nextHistory,
  };
}
