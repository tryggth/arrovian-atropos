import React, { useMemo } from 'react';
import {
  ElementaryTriangle,
  RULING_COLORS,
  RulingColor,
  VertexId,
} from '../engine/barycentric';
import {
  describeVoterShift,
  evaluateAllRulingsAtVertex,
  getTriadPivotalVoter,
  PossibleDictatorsAnalysis,
} from '../engine/arrowProof';
import { GameState } from '../engine/gameState';

export interface LatticeBoardProps {
  readonly gameState: GameState;
  readonly selectedVertexId: VertexId | null;
  readonly hoveredVertexId: VertexId | null;
  readonly activeColor: RulingColor;
  readonly quickPlaceMode: boolean;
  readonly showBadgesOnNodes: boolean;
  readonly showImpossibilityWarnings?: boolean;
  readonly showPossibleDictators?: boolean;
  readonly dictatorAnalysis?: PossibleDictatorsAnalysis | null;
  readonly hoveredDictatorId?: number | null;
  readonly onSelectVertex: (vertexId: VertexId) => void;
  readonly onHoverVertex: (vertexId: VertexId | null) => void;
  readonly onPickRadialColor: (vertexId: VertexId, color: RulingColor) => void;
  readonly onCancelSelection: () => void;
}

const SVG_WIDTH = 920;
const SVG_HEIGHT = 800;
const PAD_X = 125;
const PAD_TOP = 82;
const SCALE = SVG_WIDTH - PAD_X * 2; // 670

function projectToSvg(normX: number, normY: number): { x: number; y: number } {
  return {
    x: PAD_X + normX * SCALE,
    y: PAD_TOP + normY * SCALE,
  };
}

function getTriangleFill(
  tri: ElementaryTriangle,
  colors: ReadonlyMap<VertexId, RulingColor>,
  isLosingTriangle: boolean
): { fill: string; fillOpacity: number; stroke: string; strokeWidth: number } {
  if (isLosingTriangle) {
    return {
      fill: '#f59e0b',
      fillOpacity: 0.34,
      stroke: '#fbbf24',
      strokeWidth: 3.5,
    };
  }

  const c0 = colors.get(tri.vertices[0]);
  const c1 = colors.get(tri.vertices[1]);
  const c2 = colors.get(tri.vertices[2]);
  const defined = [c0, c1, c2].filter((c): c is RulingColor => c !== undefined);

  if (defined.length < 3) {
    return {
      fill: '#0f172a',
      fillOpacity: 0.35,
      stroke: 'transparent',
      strokeWidth: 0,
    };
  }

  const unique = new Set(defined);
  if (unique.size === 3) {
    return {
      fill: '#f59e0b',
      fillOpacity: 0.3,
      stroke: '#fbbf24',
      strokeWidth: 3,
    };
  }

  if (unique.size === 1) {
    const only = defined[0]!;
    return {
      fill: RULING_COLORS[only].hexFill,
      fillOpacity: 0.14,
      stroke: 'transparent',
      strokeWidth: 0,
    };
  }

  // Dichromatic (2 rulings): subtle blend tint
  return {
    fill: '#334155',
    fillOpacity: 0.22,
    stroke: 'transparent',
    strokeWidth: 0,
  };
}

function getThreatPipOffset(
  ruling: RulingColor,
  radius: number
): { cx: number; cy: number } {
  if (ruling === 0) {
    return { cx: 0, cy: -radius };
  }
  if (ruling === 1) {
    return { cx: -radius * 0.866, cy: radius * 0.5 };
  }
  return { cx: radius * 0.866, cy: radius * 0.5 };
}

export const LatticeBoard: React.FC<LatticeBoardProps> = ({
  gameState,
  selectedVertexId,
  hoveredVertexId,
  activeColor,
  quickPlaceMode,
  showBadgesOnNodes,
  showImpossibilityWarnings = true,
  showPossibleDictators = false,
  dictatorAnalysis = null,
  hoveredDictatorId = null,
  onSelectVertex,
  onHoverVertex,
  onPickRadialColor,
  onCancelSelection,
}) => {
  const {
    graph,
    colors,
    lastMove,
    legalMoves,
    losingTriangles,
    status,
    n,
  } = gameState;

  const losingTriangleIds = new Set(losingTriangles.map((t) => t.id));

  // Scale default vertex radius with board size n in {4..12}, and significantly
  // enlarge any hovered node so its ruling text and coordinates are clearly readable.
  const baseRadius = Math.max(13, Math.min(23, Math.round(138 / n)));
  const hoveredRadius = Math.max(30, Math.round(baseRadius * 1.75));

  // Render hovered and selected vertices last in SVG painter's order so the enlarged
  // node always sits cleanly on top of neighbors and lattice edges.
  const orderedVertices = useMemo(() => {
    return [...graph.vertexList].sort((a, b) => {
      const rank = (id: VertexId): number => {
        if (id === hoveredVertexId) return 2;
        if (id === selectedVertexId) return 1;
        return 0;
      };
      return rank(a.id) - rank(b.id);
    });
  }, [graph.vertexList, hoveredVertexId, selectedVertexId]);

  const topCorner = projectToSvg(0.5, 0);
  const bottomLeftCorner = projectToSvg(0, Math.sqrt(3) / 2);
  const bottomRightCorner = projectToSvg(1, Math.sqrt(3) / 2);

  // Midpoints of the 3 outer edges for Pareto / Unanimity boundary annotations
  const leftEdgeMid = {
    x: (topCorner.x + bottomLeftCorner.x) / 2 - 34,
    y: (topCorner.y + bottomLeftCorner.y) / 2,
  };
  const rightEdgeMid = {
    x: (topCorner.x + bottomRightCorner.x) / 2 + 34,
    y: (topCorner.y + bottomRightCorner.y) / 2,
  };
  const bottomEdgeMid = {
    x: (bottomLeftCorner.x + bottomRightCorner.x) / 2,
    y: bottomLeftCorner.y + 48,
  };

  const selectedVertex = selectedVertexId
    ? graph.vertices.get(selectedVertexId) ?? null
    : null;

  const selectedImplications = useMemo(() => {
    if (!selectedVertex) return null;
    return evaluateAllRulingsAtVertex(graph, colors, selectedVertex.id);
  }, [graph, colors, selectedVertex]);

  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/90 p-2 shadow-2xl sm:p-4">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-auto max-h-[72dvh] w-full max-w-[880px] select-none"
        role="img"
        aria-label={`Arrovian Atropos Preference Simplex Board size n=${n}`}
        onClick={(e) => {
          if (e.target === e.currentTarget && selectedVertexId) {
            onCancelSelection();
          }
        }}
      >
        <defs>
          <radialGradient id="boardGlow" cx="50%" cy="54%" r="52%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
          </radialGradient>
          <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="hoverDropShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="5"
              floodColor="#000000"
              floodOpacity="0.75"
            />
          </filter>
        </defs>

        {/* Ambient Simplex Backdrop */}
        <circle
          cx={SVG_WIDTH / 2}
          cy={SVG_HEIGHT / 2 + 20}
          r={360}
          fill="url(#boardGlow)"
        />

        {/* Outer Pareto Unanimity Boundary Frame */}
        <polygon
          points={`${topCorner.x},${topCorner.y} ${bottomLeftCorner.x},${bottomLeftCorner.y} ${bottomRightCorner.x},${bottomRightCorner.y}`}
          fill="none"
          stroke="#334155"
          strokeWidth={4}
          strokeLinejoin="round"
        />

        {/* Pareto Unanimity Boundary Annotations */}
        <g className="font-mono text-[11px] font-semibold fill-slate-400">
          {/* Top Unanimous Electorate Corner */}
          <text
            x={topCorner.x}
            y={topCorner.y - 36}
            textAnchor="middle"
            className="fill-rose-400 font-bold text-xs"
          >
            All {n} on Team Pizza ({n},0,0) → ● Pizza (A) Wins
            <tspan
              x={topCorner.x}
              dy="14"
              className="fill-slate-400 font-normal text-[10px]"
            >
              Unanimous A ≻ B ≻ C · Ruling A ≻ C
            </tspan>
          </text>

          {/* Bottom-Left Unanimous Electorate Corner */}
          <text
            x={bottomLeftCorner.x - 10}
            y={bottomLeftCorner.y + 30}
            textAnchor="start"
            className="fill-emerald-400 font-bold text-xs"
          >
            All {n} on Team Tacos (0,{n},0) → ■ Tacos (B) Wins
            <tspan
              x={bottomLeftCorner.x - 10}
              dy="14"
              className="fill-slate-400 font-normal text-[10px]"
            >
              Unanimous B ≻ C ≻ A · Ruling B ≻ A
            </tspan>
          </text>

          {/* Bottom-Right Unanimous Electorate Corner */}
          <text
            x={bottomRightCorner.x + 10}
            y={bottomRightCorner.y + 30}
            textAnchor="end"
            className="fill-indigo-400 font-bold text-xs"
          >
            All {n} on Team Sushi (0,0,{n}) → ▲ Sushi (C) Wins
            <tspan
              x={bottomRightCorner.x + 10}
              dy="14"
              className="fill-slate-400 font-normal text-[10px]"
            >
              Unanimous C ≻ A ≻ B · Ruling C ≻ B
            </tspan>
          </text>

          {/* Left Pareto Boundary Edge (k2 = 0) */}
          <text
            x={leftEdgeMid.x}
            y={leftEdgeMid.y - 7}
            textAnchor="middle"
            transform={`rotate(-60, ${leftEdgeMid.x}, ${leftEdgeMid.y})`}
            className="fill-slate-400"
          >
            0 on Team Sushi (k₂ = 0) · All {n} prefer Tacos ≻ Sushi
            <tspan
              x={leftEdgeMid.x}
              dy="14"
              className="fill-slate-500 font-normal text-[10px]"
            >
              ▲ Sushi Eliminated (Forbids C ≻ B)
            </tspan>
          </text>

          {/* Right Pareto Boundary Edge (k1 = 0) */}
          <text
            x={rightEdgeMid.x}
            y={rightEdgeMid.y - 7}
            textAnchor="middle"
            transform={`rotate(60, ${rightEdgeMid.x}, ${rightEdgeMid.y})`}
            className="fill-slate-400"
          >
            0 on Team Tacos (k₁ = 0) · All {n} prefer Pizza ≻ Tacos
            <tspan
              x={rightEdgeMid.x}
              dy="14"
              className="fill-slate-500 font-normal text-[10px]"
            >
              ■ Tacos Eliminated (Forbids B ≻ A)
            </tspan>
          </text>

          {/* Bottom Pareto Boundary Edge (k0 = 0) */}
          <text
            x={bottomEdgeMid.x}
            y={bottomEdgeMid.y - 7}
            textAnchor="middle"
            className="fill-slate-400"
          >
            0 on Team Pizza (k₀ = 0) · All {n} prefer Sushi ≻ Pizza
            <tspan
              x={bottomEdgeMid.x}
              dy="14"
              className="fill-slate-500 font-normal text-[10px]"
            >
              ● Pizza Eliminated (Forbids A ≻ C)
            </tspan>
          </text>
        </g>

        {/* Voter-Shift Triads Layer */}
        <g data-testid="elementary-triangles-layer">
          {graph.triangles.map((tri) => {
            const v0 = graph.vertices.get(tri.vertices[0])!;
            const v1 = graph.vertices.get(tri.vertices[1])!;
            const v2 = graph.vertices.get(tri.vertices[2])!;
            const p0 = projectToSvg(v0.x, v0.y);
            const p1 = projectToSvg(v1.x, v1.y);
            const p2 = projectToSvg(v2.x, v2.y);

            const isLosing = losingTriangleIds.has(tri.id);
            let style = getTriangleFill(tri, colors, isLosing);
            let strokeDasharray: string | undefined = undefined;

            const tState =
              showPossibleDictators && dictatorAnalysis
                ? dictatorAnalysis.triadStates.get(tri.id)
                : undefined;

            const isHoveredVoterTriad = Boolean(
              showPossibleDictators &&
                dictatorAnalysis &&
                hoveredDictatorId !== null &&
                hoveredDictatorId !== undefined &&
                tState?.pivotalVoterId === hoveredDictatorId &&
                tState.status !== 'eliminated'
            );

            if (!isLosing && showPossibleDictators && dictatorAnalysis) {
              if (isHoveredVoterTriad) {
                style = {
                  fill: '#38bdf8',
                  fillOpacity: 0.28,
                  stroke: '#38bdf8',
                  strokeWidth: 2.5,
                };
              } else if (tState?.status === 'eliminated') {
                style = {
                  ...style,
                  fillOpacity: 0.04,
                  stroke: 'transparent',
                };
              } else if (tState?.status === 'armed') {
                style = {
                  fill: '#f59e0b',
                  fillOpacity: 0.2,
                  stroke: '#f59e0b',
                  strokeWidth: 2,
                };
                strokeDasharray = '4 2';
              }
            }

            const centroid = projectToSvg(tri.centroid.x, tri.centroid.y);

            return (
              <g key={tri.id}>
                <polygon
                  data-testid={isLosing ? `losing-triangle-${tri.id}` : undefined}
                  points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
                  fill={style.fill}
                  fillOpacity={style.fillOpacity}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeLinejoin="round"
                />
                {isLosing && (
                  <>
                    <text
                      x={centroid.x}
                      y={centroid.y - 2}
                      textAnchor="middle"
                      className="fill-amber-200 font-mono text-[10px] font-extrabold"
                    >
                      CYCLE
                    </text>
                    <text
                      data-testid={`losing-triangle-dictator-${tri.id}`}
                      x={centroid.x}
                      y={centroid.y + 10}
                      textAnchor="middle"
                      className="fill-amber-100 font-mono text-[8.5px] font-black"
                    >
                      👑 Dictator: Voter #{getTriadPivotalVoter(graph, tri)}
                    </text>
                  </>
                )}
                {!isLosing &&
                  showPossibleDictators &&
                  tState &&
                  (tState.status === 'armed' || isHoveredVoterTriad) && (
                    <text
                      data-testid={
                        tState.status === 'armed'
                          ? `armed-triad-label-${tri.id}`
                          : undefined
                      }
                      x={centroid.x}
                      y={centroid.y + 3}
                      textAnchor="middle"
                      className="pointer-events-none fill-amber-200 font-mono text-[9.5px] font-black"
                    >
                      d=#{tState.pivotalVoterId}
                    </text>
                  )}
              </g>
            );
          })}
        </g>

        {/* Single-Voter Shift Edges */}
        <g>
          {graph.edges.map(([idA, idB]) => {
            const vA = graph.vertices.get(idA)!;
            const vB = graph.vertices.get(idB)!;
            const pA = projectToSvg(vA.x, vA.y);
            const pB = projectToSvg(vB.x, vB.y);

            const isActiveLocalityEdge =
              status === 'playing' &&
              lastMove !== null &&
              ((idA === lastMove && legalMoves.has(idB)) ||
                (idB === lastMove && legalMoves.has(idA)));

            return (
              <line
                key={`${idA}|${idB}`}
                x1={pA.x}
                y1={pA.y}
                x2={pB.x}
                y2={pB.y}
                stroke={isActiveLocalityEdge ? '#38bdf8' : '#334155'}
                strokeWidth={isActiveLocalityEdge ? 2.6 : 1.5}
                strokeDasharray={isActiveLocalityEdge ? '5 3' : undefined}
                strokeOpacity={isActiveLocalityEdge ? 0.9 : 0.65}
              />
            );
          })}
        </g>

        {/* Preference Profile Vertices (sorted so hovered node renders on top and enlarges for readability) */}
        <g data-testid="lattice-vertices-layer">
          {orderedVertices.map((vertex) => {
            const pos = projectToSvg(vertex.x, vertex.y);
            const color = colors.get(vertex.id);
            const isColored = color !== undefined;
            const isLegal = status === 'playing' && legalMoves.has(vertex.id);
            const isLastMove = lastMove === vertex.id;
            const isSelected = selectedVertexId === vertex.id;
            const isHovered = hoveredVertexId === vertex.id;

            const activeRadius = isHovered ? hoveredRadius : baseRadius;

            const colorMeta = isColored ? RULING_COLORS[color] : null;
            const fillHex = colorMeta
              ? colorMeta.hexFill
              : isLegal
                ? '#1e293b'
                : '#0f172a';

            const strokeHex = isHovered
              ? '#f8fafc'
              : isSelected
                ? '#f8fafc'
                : isLastMove
                  ? '#fde047'
                  : isLegal
                    ? '#38bdf8'
                    : vertex.isBoundary
                      ? '#94a3b8'
                      : '#475569';

            const nonHoveredLabel =
              isColored && showBadgesOnNodes ? colorMeta!.shapedBadge : '';

            return (
              <g
                key={vertex.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => onHoverVertex(vertex.id)}
                onMouseLeave={() => onHoverVertex(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLegal) {
                    onSelectVertex(vertex.id);
                  }
                }}
                data-testid={`vertex-${vertex.id}`}
                data-legal={isLegal ? 'true' : 'false'}
                data-colored={isColored ? String(color) : 'uncolored'}
                data-hovered={isHovered ? 'true' : 'false'}
                data-radius={String(activeRadius)}
                className={isLegal ? 'cursor-pointer' : 'cursor-default'}
              >
                {/* Pareto Boundary Outer Ring Indicator */}
                {vertex.isBoundary && (
                  <circle
                    r={activeRadius + 4}
                    fill="none"
                    stroke={vertex.isCorner ? '#f8fafc' : '#64748b'}
                    strokeWidth={vertex.isCorner ? 2.2 : 1.5}
                    strokeDasharray={vertex.isCorner ? undefined : '3 2'}
                    opacity={isHovered ? 0.95 : 0.75}
                  />
                )}

                {/* Pulsing Halo for Precedent Anchor (lastMove) */}
                {isLastMove && (
                  <circle
                    r={activeRadius + 7}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth={2.5}
                    className="animate-pulse-ring"
                  />
                )}

                {/* Legal Target Profile Highlight Ring */}
                {isLegal && (
                  <circle
                    r={activeRadius + 4.5}
                    fill="none"
                    stroke={isSelected || isHovered ? '#f8fafc' : '#38bdf8'}
                    strokeWidth={isSelected || isHovered ? 2.8 : 1.8}
                    opacity={isSelected || isHovered ? 1 : 0.8}
                  />
                )}

                {/* Main Preference Profile Circle (enlarges on hover) */}
                <circle
                  r={activeRadius}
                  fill={fillHex}
                  stroke={strokeHex}
                  strokeWidth={
                    isHovered ? 3.2 : isLastMove || isSelected ? 3 : 2
                  }
                  filter={isHovered ? 'url(#hoverDropShadow)' : undefined}
                />

                {/* Preview Tint on Hover in 1-Click Mode */}
                {isLegal && isHovered && quickPlaceMode && (
                  <circle
                    r={activeRadius - 2}
                    fill={RULING_COLORS[activeColor].hexFill}
                    fillOpacity={0.75}
                  />
                )}

                {/* Live Possible Dictators Radar Threat Indicators */}
                {showPossibleDictators &&
                  dictatorAnalysis &&
                  !isColored &&
                  vertex.isInterior &&
                  (() => {
                    const threat = dictatorAnalysis.vertexThreats.get(vertex.id);
                    if (!threat) return null;

                    if (threat.isInevitableTrap) {
                      return (
                        <g>
                          <circle
                            r={activeRadius + 6.5}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth={2.5}
                            strokeDasharray="3 2"
                            className="animate-pulse"
                          />
                          <text
                            data-testid={`trap-badge-${vertex.id}`}
                            y={-activeRadius - 5}
                            textAnchor="middle"
                            className="pointer-events-none fill-rose-300 font-mono text-[8.5px] font-black"
                          >
                            TRAP
                          </text>
                        </g>
                      );
                    }

                    if (threat.isConstrained) {
                      return (
                        <g>
                          {([0, 1, 2] as const).map((r) => {
                            if (!threat.lethalRulings.has(r)) return null;
                            const offset = getThreatPipOffset(r, activeRadius);
                            return (
                              <circle
                                key={r}
                                r={3.2}
                                cx={offset.cx}
                                cy={offset.cy}
                                fill={RULING_COLORS[r].hexFill}
                                stroke="#090d16"
                                strokeWidth={1}
                                data-testid={`threat-pip-${vertex.id}-${r}`}
                              />
                            );
                          })}
                        </g>
                      );
                    }

                    return null;
                  })()}

                {/* Enlarged Readable Typography when Hovered */}
                {isHovered ? (
                  isColored ? (
                    <g
                      data-testid={`hovered-label-${vertex.id}`}
                      className="pointer-events-none"
                    >
                      <text
                        y={-3}
                        textAnchor="middle"
                        className="font-mono text-[13px] font-black fill-slate-950"
                      >
                        {colorMeta!.shapedBadge}
                      </text>
                      <text
                        y={11}
                        textAnchor="middle"
                        className="font-mono text-[10px] font-extrabold fill-slate-950/90"
                      >
                        ({vertex.coord.join(',')})
                      </text>
                    </g>
                  ) : isLegal && quickPlaceMode ? (
                    <g
                      data-testid={`hovered-label-${vertex.id}`}
                      className="pointer-events-none"
                    >
                      <text
                        y={-3}
                        textAnchor="middle"
                        className="font-mono text-[13px] font-black fill-slate-950"
                      >
                        {RULING_COLORS[activeColor].shapedBadge}
                      </text>
                      <text
                        y={11}
                        textAnchor="middle"
                        className="font-mono text-[10px] font-extrabold fill-slate-950/90"
                      >
                        ({vertex.coord.join(',')})
                      </text>
                    </g>
                  ) : (
                    <g
                      data-testid={`hovered-label-${vertex.id}`}
                      className="pointer-events-none"
                    >
                      <text
                        y={-2}
                        textAnchor="middle"
                        className={`font-mono text-[12px] font-extrabold ${
                          isLegal ? 'fill-sky-200' : 'fill-slate-200'
                        }`}
                      >
                        ({vertex.coord.join(',')})
                      </text>
                      <text
                        y={11}
                        textAnchor="middle"
                        className={`font-mono text-[8.5px] font-bold ${
                          isLegal ? 'fill-sky-300' : 'fill-slate-400'
                        }`}
                      >
                        {isLegal ? 'OPEN PROFILE' : 'DIVIDED'}
                      </text>
                    </g>
                  )
                ) : (
                  <>
                    {/* Standard Non-Hovered Societal Ruling Inside Vertex (A≻C, B≻A, C≻B) */}
                    {nonHoveredLabel && (
                      <text
                        y={3.5}
                        textAnchor="middle"
                        className={`pointer-events-none font-mono font-extrabold fill-slate-950 ${
                          n <= 8 ? 'text-[9.5px]' : 'text-[8px]'
                        }`}
                      >
                        {nonHoveredLabel}
                      </text>
                    )}

                    {/* Subtle Coordinate Label for Unadjudicated Profiles when n <= 8 */}
                    {!isColored && n <= 8 && (
                      <text
                        y={3.5}
                        textAnchor="middle"
                        className={`pointer-events-none font-mono text-[9px] font-medium ${
                          isLegal ? 'fill-sky-200/90' : 'fill-slate-500'
                        }`}
                      >
                        {vertex.coord.join(',')}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Radial Constitutional Ruling Picker Anchored to Selected Open Profile */}
        {selectedVertex &&
          selectedImplications &&
          status === 'playing' &&
          !quickPlaceMode &&
          (() => {
            const rawCenter = projectToSvg(selectedVertex.x, selectedVertex.y);
            const clampedX = Math.max(
              210,
              Math.min(SVG_WIDTH - 210, rawCenter.x)
            );
            const clampedY = Math.max(
              135,
              Math.min(SVG_HEIGHT - 85, rawCenter.y)
            );

            const lastMoveCoord = lastMove
              ? graph.vertices.get(lastMove)?.coord ?? null
              : null;
            const shiftPrompt = describeVoterShift(
              lastMoveCoord,
              selectedVertex.coord
            );

            const pillPositions: Record<
              RulingColor,
              { readonly x: number; readonly y: number }
            > = {
              0: { x: 0, y: -64 },
              1: { x: -84, y: 52 },
              2: { x: 84, y: 52 },
            };

            return (
              <g
                data-testid="radial-color-picker"
                transform={`translate(${clampedX}, ${clampedY})`}
              >
                {/* Floating Two-Step Header Pill above radial ring */}
                <g
                  data-testid="radial-two-step-callout"
                  transform="translate(0, -118)"
                >
                  <rect
                    x={-205}
                    y={-22}
                    width={410}
                    height={44}
                    rx={10}
                    fill="#0f172a"
                    fillOpacity={0.96}
                    stroke="#38bdf8"
                    strokeWidth={1.8}
                    filter="url(#hoverDropShadow)"
                  />
                  <text
                    data-testid="radial-step-1-text"
                    y={-4}
                    textAnchor="middle"
                    className="pointer-events-none font-mono text-[10px] font-bold fill-sky-300"
                  >
                    {shiftPrompt.step1Text}
                  </text>
                  <text
                    data-testid="radial-step-2-text"
                    y={11}
                    textAnchor="middle"
                    className="pointer-events-none font-mono text-[10px] font-black fill-amber-200"
                  >
                    {shiftPrompt.step2Text}
                  </text>
                </g>

                {/* Translucent Tether Ring */}
                <circle
                  r={66}
                  fill="#090d16"
                  fillOpacity={0.78}
                  stroke="#475569"
                  strokeWidth={1.5}
                />

                {([0, 1, 2] as const).map((c) => {
                  const pos = pillPositions[c];
                  const meta = RULING_COLORS[c];
                  const imp = selectedImplications[c];
                  const warnsCycle =
                    showImpossibilityWarnings && !imp.isLocallyTransitive;

                  const pillW = 168;
                  const pillH = 54;

                  return (
                    <g
                      key={c}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPickRadialColor(selectedVertex.id, c);
                      }}
                      data-testid={`radial-color-option-${c}`}
                      data-transitive={imp.isLocallyTransitive ? 'true' : 'false'}
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      <rect
                        x={-pillW / 2}
                        y={-pillH / 2}
                        width={pillW}
                        height={pillH}
                        rx={12}
                        fill={meta.hexFill}
                        stroke={warnsCycle ? '#fde047' : '#f8fafc'}
                        strokeWidth={warnsCycle ? 3 : 2}
                        filter="url(#hoverDropShadow)"
                      />
                      <text
                        y={-11}
                        textAnchor="middle"
                        className="pointer-events-none font-mono text-[11px] font-black fill-slate-950"
                      >
                        {meta.candidateShape} {meta.ruling}
                        {warnsCycle ? ' · ⚠ CYCLE' : ''}
                      </text>
                      <text
                        y={2}
                        textAnchor="middle"
                        className="pointer-events-none font-mono text-[9px] font-black fill-slate-950/95"
                      >
                        {imp.crownedWinnerShort}
                      </text>
                      <text
                        y={15}
                        textAnchor="middle"
                        className="pointer-events-none font-mono text-[8.5px] font-extrabold fill-slate-950/90"
                      >
                        {imp.compactPillText}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
      </svg>
    </div>
  );
};
