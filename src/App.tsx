import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DEFAULT_BOARD_SIZE,
  RULING_COLORS,
  RulingColor,
  VertexId,
} from './engine/barycentric';
import {
  applyMove,
  CONSTITUTIONAL_ARCHITECT,
  createInitialGameState,
  GameState,
} from './engine/gameState';
import {
  analyzePossibleDictators,
  evaluateAllRulingsAtVertex,
} from './engine/arrowProof';
import { generateRandomSeed } from './engine/prng';
import { useAppUpdate } from './hooks/useAppUpdate';
import { HeaderControls } from './components/HeaderControls';
import { LatticeBoard } from './components/LatticeBoard';
import { ColorPicker } from './components/ColorPicker';
import { InspectorPanel } from './components/InspectorPanel';
import { PossibleDictatorsPanel } from './components/PossibleDictatorsPanel';
import { DictatorModal } from './components/DictatorModal';
import { Compass, Footprints, ScrollText, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const { appVersion, hasUpdate, latestVersion, applyUpdate } = useAppUpdate();

  const [boardSize, setBoardSize] = useState<number>(DEFAULT_BOARD_SIZE);
  const [seed, setSeed] = useState<string>('arrow-1951');
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(DEFAULT_BOARD_SIZE, 'arrow-1951')
  );

  const [selectedVertexId, setSelectedVertexId] = useState<VertexId | null>(
    null
  );
  const [hoveredVertexId, setHoveredVertexId] = useState<VertexId | null>(null);
  const [activeColor, setActiveColor] = useState<RulingColor>(0);
  const [quickPlaceMode, setQuickPlaceMode] = useState<boolean>(false);
  const [showBadgesOnNodes, setShowBadgesOnNodes] = useState<boolean>(true);
  const [showImpossibilityWarnings, setShowImpossibilityWarnings] =
    useState<boolean>(true);
  const [showPossibleDictators, setShowPossibleDictators] =
    useState<boolean>(false);
  const [hoveredDictatorId, setHoveredDictatorId] = useState<number | null>(
    null
  );

  const dictatorAnalysis = useMemo(
    () => analyzePossibleDictators(gameState.graph, gameState.colors),
    [gameState.graph, gameState.colors]
  );

  const startNewGame = useCallback(
    (newN: number, newSeed: string) => {
      setBoardSize(newN);
      setSeed(newSeed);
      setGameState(createInitialGameState(newN, newSeed));
      setSelectedVertexId(null);
      setHoveredVertexId(null);
    },
    []
  );

  const handleCommitMove = useCallback(
    (vertexId: VertexId, color: RulingColor) => {
      if (gameState.status !== 'playing') return;
      if (!gameState.legalMoves.has(vertexId)) return;

      const nextState = applyMove(gameState, vertexId, color);
      setGameState(nextState);
      setSelectedVertexId(null);
    },
    [gameState]
  );

  const handleSelectVertex = useCallback(
    (vertexId: VertexId) => {
      if (gameState.status !== 'playing') return;
      if (!gameState.legalMoves.has(vertexId)) return;

      if (quickPlaceMode) {
        handleCommitMove(vertexId, activeColor);
      } else {
        setSelectedVertexId((prev) => (prev === vertexId ? null : vertexId));
      }
    },
    [gameState, quickPlaceMode, activeColor, handleCommitMove]
  );

  // Keyboard shortcuts: 0/1/2 to pick or commit ruling, Escape to cancel selection
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setSelectedVertexId(null);
        return;
      }

      if (e.key === '0' || e.key === '1' || e.key === '2') {
        const chosenColor = Number(e.key) as RulingColor;
        setActiveColor(chosenColor);
        if (selectedVertexId && gameState.status === 'playing') {
          handleCommitMove(selectedVertexId, chosenColor);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedVertexId, gameState.status, handleCommitMove]);

  const inspectedId =
    hoveredVertexId ?? selectedVertexId ?? gameState.lastMove;
  const inspectedVertex = inspectedId
    ? gameState.graph.vertices.get(inspectedId) ?? null
    : null;
  const inspectedColor = inspectedId
    ? gameState.colors.get(inspectedId)
    : undefined;

  const inspectedImplications = useMemo(() => {
    if (!inspectedId || !inspectedVertex) return null;
    return evaluateAllRulingsAtVertex(
      gameState.graph,
      gameState.colors,
      inspectedId
    );
  }, [gameState.graph, gameState.colors, inspectedId, inspectedVertex]);

  const totalDividedProfiles = gameState.graph.interiorIds.length;
  const adjudicatedProfiles = gameState.moveHistory.length;
  const remainingOpenProfiles = totalDividedProfiles - adjudicatedProfiles;
  const progressPct =
    totalDividedProfiles > 0
      ? Math.round((adjudicatedProfiles / totalDividedProfiles) * 100)
      : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-[#090d16] text-slate-100">
      <HeaderControls
        n={boardSize}
        seed={seed}
        showBadgesOnNodes={showBadgesOnNodes}
        showPossibleDictators={showPossibleDictators}
        possibleDictatorCount={dictatorAnalysis.activeCandidateVoterIds.length}
        onTogglePossibleDictators={() => setShowPossibleDictators((prev) => !prev)}
        appVersion={appVersion}
        hasUpdate={hasUpdate}
        latestVersion={latestVersion}
        onApplyUpdate={applyUpdate}
        onChangeBoardSize={(nextN) => startNewGame(nextN, seed)}
        onChangeSeed={(nextSeed) => startNewGame(boardSize, nextSeed)}
        onRandomizeSeed={() =>
          startNewGame(boardSize, generateRandomSeed())
        }
        onResetBoard={() => startNewGame(boardSize, seed)}
        onToggleBadges={() => setShowBadgesOnNodes((prev) => !prev)}
      />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-5 px-4 py-4 sm:px-6 lg:grid-cols-12">
        {/* Left / Center Column: Status Banner, Simplex Board & Ruling Chambers */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          {/* Active Step / Post-Mortem Banner */}
          {gameState.status === 'playing' ? (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-800/90 bg-slate-900/80 px-4 py-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    data-testid="active-role-badge"
                    className={`inline-flex items-center rounded-xl border px-3 py-1 font-mono text-xs font-bold ${CONSTITUTIONAL_ARCHITECT.badgeClass}`}
                  >
                    Constitutional Architect: {CONSTITUTIONAL_ARCHITECT.role}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      Precedent Step {gameState.turn} · Avoid Creating an{' '}
                      <span className="font-mono text-amber-300">
                        Arrovian Paradox Triad
                      </span>{' '}
                      <span className="font-mono text-xs text-slate-400">
                        (A ≻ C ≻ B ≻ A)
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {gameState.lastMove
                        ? `Precedent Anchor at Profile (${gameState.lastMove}) — ${gameState.legalMoves.size} Open Profile${
                            gameState.legalMoves.size === 1 ? '' : 's'
                          } reachable`
                        : `Opening Constitutional Step — all ${gameState.legalMoves.size} Divided Electorate Profiles are open`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    data-testid="locality-status-badge"
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold ${
                      gameState.isJumpTurn
                        ? 'border-purple-500/40 bg-purple-500/15 text-purple-200'
                        : 'border-sky-500/40 bg-sky-500/15 text-sky-200'
                    }`}
                  >
                    {gameState.isJumpTurn ? (
                      <>
                        <Compass className="h-3.5 w-3.5" />
                        <span>
                          {gameState.lastMove === null
                            ? 'Step 1: Open Divided Profiles'
                            : 'Deadlock Jump'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Footprints className="h-3.5 w-3.5" />
                        <span>Single-Voter Shift</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Constitutional Coherence Progress Bar */}
              <div
                data-testid="solo-survival-progress"
                className="flex flex-col gap-1 border-t border-slate-800/80 pt-2"
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-300">
                    Constitutional Coherence Progress:{' '}
                    <strong className="text-sky-300">
                      {adjudicatedProfiles} / {totalDividedProfiles}
                    </strong>{' '}
                    Divided Profiles Adjudicated ({progressPct}%)
                  </span>
                  <span className="text-slate-400">
                    {remainingOpenProfiles} Open Profiles Remaining
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <DictatorModal
              gameState={gameState}
              onPlayAgain={() => startNewGame(boardSize, seed)}
            />
          )}

          {/* Interactive SVG Barycentric Preference Simplex */}
          <LatticeBoard
            gameState={gameState}
            selectedVertexId={selectedVertexId}
            hoveredVertexId={hoveredVertexId}
            activeColor={activeColor}
            quickPlaceMode={quickPlaceMode}
            showBadgesOnNodes={showBadgesOnNodes}
            showImpossibilityWarnings={showImpossibilityWarnings}
            showPossibleDictators={showPossibleDictators}
            dictatorAnalysis={dictatorAnalysis}
            hoveredDictatorId={hoveredDictatorId}
            onSelectVertex={handleSelectVertex}
            onHoverVertex={setHoveredVertexId}
            onPickRadialColor={(vId, color) => {
              setActiveColor(color);
              handleCommitMove(vId, color);
            }}
            onCancelSelection={() => setSelectedVertexId(null)}
          />

          {/* Constitutional Ruling Chambers */}
          <ColorPicker
            activeColor={activeColor}
            selectedVertexId={selectedVertexId}
            inspectedVertexId={inspectedId}
            inspectedCoord={inspectedVertex?.coord ?? null}
            inspectedIsUnadjudicated={
              inspectedVertex !== null && inspectedColor === undefined
            }
            implications={inspectedImplications}
            quickPlaceMode={quickPlaceMode}
            showImpossibilityWarnings={showImpossibilityWarnings}
            disabled={gameState.status !== 'playing'}
            onSelectActiveColor={setActiveColor}
            onCommitMove={(color) => {
              if (selectedVertexId) {
                handleCommitMove(selectedVertexId, color);
              }
            }}
            onToggleQuickPlaceMode={() => {
              setQuickPlaceMode((prev) => !prev);
              setSelectedVertexId(null);
            }}
            onToggleWarnings={() =>
              setShowImpossibilityWarnings((prev) => !prev)
            }
          />
        </div>

        {/* Right Sidebar: Electorate Profile Inspector, Axioms & Constitutional Precedent Log */}
        <aside className="flex flex-col gap-4 lg:col-span-4">
          {/* Possible Dictators Radar Sidebar Panel */}
          {showPossibleDictators && (
            <PossibleDictatorsPanel
              n={boardSize}
              analysis={dictatorAnalysis}
              hoveredDictatorId={hoveredDictatorId}
              onHoverDictator={setHoveredDictatorId}
              onSelectTriggerVertex={handleSelectVertex}
              legalMoves={gameState.legalMoves}
            />
          )}

          {/* Electorate Profile & Pairwise Tally Inspector */}
          <InspectorPanel
            n={boardSize}
            totalProfiles={gameState.graph.vertexList.length}
            inspectedVertex={inspectedVertex}
            inspectedColor={inspectedColor}
          />

          {/* Arrow's Axioms & Sperner Invariant Summary */}
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-4 shadow-lg">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span>Axioms: Avoid the Arrovian Dictator</span>
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
              <li className="flex gap-2">
                <span className="font-mono font-bold text-indigo-400">1.</span>
                <span>
                  <strong>Pareto Unanimity Boundary:</strong> Each outer edge{' '}
                  <code className="font-mono text-slate-200">kᵢ = 0</code>{' '}
                  forbids the ruling of missing block{' '}
                  <code className="font-mono text-slate-200">Gᵢ</code> because
                  all <em>n</em> voters unanimously prefer the opposite ranking.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-bold text-indigo-400">2.</span>
                <span>
                  <strong>Single-Voter Shift &amp; Deadlock Jump:</strong> Each
                  step shifts a single voter between preference blocks adjacent
                  to the{' '}
                  <code className="font-mono text-amber-300">
                    Precedent Anchor
                  </code>
                  . If all 6 neighboring profiles are already adjudicated, a{' '}
                  <strong>Deadlock Jump</strong> unlocks any remaining Open
                  Profile.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono font-bold text-indigo-400">3.</span>
                <span>
                  <strong>Arrow&apos;s Impossibility Trap:</strong> Completing
                  any{' '}
                  <code className="font-mono text-amber-300">
                    Arrovian Paradox Triad
                  </code>{' '}
                  with all 3 rulings (<code className="font-mono">A≻C</code>,{' '}
                  <code className="font-mono">C≻B</code>,{' '}
                  <code className="font-mono">B≻A</code>) forces an intransitive
                  cycle and unmasks a local <strong>Pivotal Dictator</strong>.
                </span>
              </li>
            </ul>

            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5 font-mono text-[11px] text-slate-400">
              <span>Open Divided Profiles: {remainingOpenProfiles}</span>
              <span>Voter-Shift Triads: {gameState.graph.triangles.length}</span>
            </div>
          </div>

          {/* Constitutional Precedent Log */}
          <div className="flex flex-1 flex-col rounded-2xl border border-slate-800/90 bg-slate-900/75 p-4 shadow-lg">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                <ScrollText className="h-3.5 w-3.5 text-sky-400" />
                <span>
                  Constitutional Precedent Log ({gameState.moveHistory.length})
                </span>
              </h3>
              <span className="font-mono text-[11px] text-slate-400">
                Constitution Seed: {seed}
              </span>
            </div>

            {gameState.moveHistory.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                No precedents adjudicated yet. Select any Divided Electorate
                Profile in the interior to establish Precedent #1.
              </div>
            ) : (
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {[...gameState.moveHistory].reverse().map((m) => {
                  const cMeta = RULING_COLORS[m.color];
                  const supportVotes = m.coord[m.color];
                  const opposeVotes = boardSize - supportVotes;
                  return (
                    <div
                      key={m.turn}
                      className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-2.5 py-1.5 font-mono text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">#{m.turn}</span>
                        <span className="text-slate-200">
                          ({m.coord.join(',')})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cMeta.coalitionBlock}:{supportVotes}v{opposeVotes}
                        </span>
                        {m.wasJump && m.turn > 1 && (
                          <span className="rounded bg-purple-500/20 px-1 py-0.5 text-[9px] text-purple-300">
                            DEADLOCK JUMP
                          </span>
                        )}
                      </div>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-950"
                        style={{ backgroundColor: cMeta.hexFill }}
                      >
                        {cMeta.shortBadge}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
