import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { DEFAULT_APP_VERSION } from '../hooks/useAppUpdate';
import {
  BOARD_SIZES,
  createLatticeGraph,
  findAllPanchromaticTriangles,
  generateBoundaryColoring,
  latticeDistance,
  RulingColor,
  toVertexId,
} from '../engine/barycentric';
import {
  applyMove,
  computeLegalMoves,
  createInitialGameState,
} from '../engine/gameState';
import {
  analyzePossibleDictators,
  classifyPowerDynamics,
  computePairwiseTallies,
  computePivotalVoterIndex,
  computeVoterBlockPartitions,
  evaluateAllRulingsAtVertex,
  evaluateRulingImplication,
  extractParadoxTriadProof,
  formatVoterRange,
  getTriadPivotalVoter,
} from '../engine/arrowProof';
import { createSeededRNG } from '../engine/prng';

describe('Arrovian Atropos Engine & Sperner/Arrow Invariants (v0.2.0)', () => {
  describe('1. Barycentric Simplex Lattice Combinatorics (\\Delta^2_n)', () => {
    it.each(BOARD_SIZES)(
      'verifies exact vertex, interior, boundary, and elementary triangle counts for n = %i',
      (n) => {
        const graph = createLatticeGraph(n);

        const expectedTotalVertices = ((n + 1) * (n + 2)) / 2;
        const expectedInteriorVertices = ((n - 1) * (n - 2)) / 2;
        const expectedBoundaryVertices = 3 * n;
        const expectedTriangles = n * n;

        expect(graph.vertexList.length).toBe(expectedTotalVertices);
        expect(graph.vertices.size).toBe(expectedTotalVertices);
        expect(graph.interiorIds.length).toBe(expectedInteriorVertices);
        expect(graph.boundaryIds.length).toBe(expectedBoundaryVertices);
        expect(graph.triangles.length).toBe(expectedTriangles);

        // Every vertex (k0, k1, k2) satisfies k0 + k1 + k2 = n and 6-regular interior degree
        for (const v of graph.vertexList) {
          const [k0, k1, k2] = v.coord;
          expect(k0 + k1 + k2).toBe(n);
          if (v.isInterior) {
            expect(k0).toBeGreaterThanOrEqual(1);
            expect(k1).toBeGreaterThanOrEqual(1);
            expect(k2).toBeGreaterThanOrEqual(1);
            expect(v.neighbors.length).toBe(6);
          }
          for (const nId of v.neighbors) {
            const neighbor = graph.vertices.get(nId)!;
            expect(latticeDistance(v.coord, neighbor.coord)).toBe(1);
          }
        }
      }
    );
  });

  describe('2. Random Unanimity Boundary & Corner-Tip Non-Rainbow Safeguard', () => {
    it('guarantees zero panchromatic {0,1,2} triangles at Turn 0 across 500 random seeds', () => {
      const graph6 = createLatticeGraph(6);
      const graph4 = createLatticeGraph(4);

      for (let i = 0; i < 500; i++) {
        const seed = `sperner-test-seed-${i}`;
        const graph = i % 5 === 0 ? graph4 : graph6;
        const n = graph.n;
        const colors = generateBoundaryColoring(graph, seed);

        // All boundary vertices are pre-colored, and no interior vertices are colored
        expect(colors.size).toBe(3 * n);
        for (const id of graph.interiorIds) {
          expect(colors.has(id)).toBe(false);
        }

        // Corners must match canonical assignment: (n,0,0)->0, (0,n,0)->1, (0,0,n)->2
        expect(colors.get(toVertexId(n, 0, 0))).toBe(0);
        expect(colors.get(toVertexId(0, n, 0))).toBe(1);
        expect(colors.get(toVertexId(0, 0, n))).toBe(2);

        // Boundary Unanimity: k_i = 0 forbids color i
        for (const bId of graph.boundaryIds) {
          const v = graph.vertices.get(bId)!;
          const assigned = colors.get(bId);
          expect(assigned).toBeDefined();
          if (!v.isCorner) {
            expect(assigned).not.toBe(v.forbiddenColor);
          }
        }

        // Critical Invariant: Zero panchromatic triangles at Turn 0
        const turnZeroRainbows = findAllPanchromaticTriangles(graph, colors);
        expect(turnZeroRainbows.length).toBe(0);
      }
    });

    it('is 100% deterministic for identical seeds', () => {
      const graph = createLatticeGraph(8);
      const c1 = generateBoundaryColoring(graph, 'condorcet-1785');
      const c2 = generateBoundaryColoring(graph, 'condorcet-1785');
      expect(Array.from(c1.entries())).toEqual(Array.from(c2.entries()));
    });
  });

  describe('3. Single-Voter Shift (k = 1) Locality & Deadlock Jump', () => {
    it('restricts moves to uncolored interior neighbors of lastMove and triggers Deadlock Jump when surrounded', () => {
      const state0 = createInitialGameState(6, 'locality-test-seed');

      // Turn 1: all 10 interior vertices are legal and isJumpTurn is true
      expect(state0.turn).toBe(1);
      expect(state0.isJumpTurn).toBe(true);
      expect(state0.legalMoves.size).toBe(10);

      // Play at center interior vertex (2, 2, 2)
      const centerId = toVertexId(2, 2, 2);
      const state1 = applyMove(state0, centerId, 0);

      if (state1.status === 'playing') {
        expect(state1.turn).toBe(2);
        expect(state1.lastMove).toBe(centerId);
        expect(state1.isJumpTurn).toBe(false);

        // All 6 neighbors of (2, 2, 2) are interior and uncolored
        expect(state1.legalMoves.size).toBe(6);
        for (const legalId of state1.legalMoves) {
          const v = state1.graph.vertices.get(legalId)!;
          expect(latticeDistance([2, 2, 2], v.coord)).toBe(1);
        }

        // Attempting to play at a non-adjacent vertex (4, 1, 1) must throw
        const nonAdjacentId = toVertexId(4, 1, 1);
        expect(state1.legalMoves.has(nonAdjacentId)).toBe(false);
        expect(() => applyMove(state1, nonAdjacentId, 0)).toThrow(
          /Illegal move/
        );
      }

      // Verify Deadlock Jump Rule directly via computeLegalMoves when all neighbors of lastMove are colored
      const graph = state0.graph;
      const customColors = new Map(state0.colors);
      customColors.set(centerId, 0);
      const centerVertex = graph.vertices.get(centerId)!;
      for (const nId of centerVertex.neighbors) {
        customColors.set(nId, 0);
      }

      const jumpResult = computeLegalMoves(graph, customColors, centerId);
      expect(jumpResult.isJumpTurn).toBe(true);
      // Remaining uncolored interior vertices = 10 - 1 (center) - 6 (neighbors) = 3 corners of interior
      expect(jumpResult.legalMoves.size).toBe(3);
      expect(jumpResult.legalMoves.has(toVertexId(4, 1, 1))).toBe(true);
      expect(jumpResult.legalMoves.has(toVertexId(1, 4, 1))).toBe(true);
      expect(jumpResult.legalMoves.has(toVertexId(1, 1, 4))).toBe(true);
    });
  });

  describe("4. Sperner's Lemma Termination Guarantee (Zero Draws)", () => {
    it('terminates in an Arrovian Paradox Triad across 100 simulated random full games', () => {
      const rng = createSeededRNG('simulation-suite-2026');
      const allColors: readonly RulingColor[] = [0, 1, 2];

      for (let gameIdx = 0; gameIdx < 100; gameIdx++) {
        const n = gameIdx % 3 === 0 ? 5 : gameIdx % 3 === 1 ? 6 : 7;
        let state = createInitialGameState(n, `sim-game-${gameIdx}`);
        const maxPossibleMoves = state.graph.interiorIds.length;

        let stepCount = 0;
        while (state.status === 'playing' && stepCount <= maxPossibleMoves) {
          const legalArray = Array.from(state.legalMoves);
          expect(legalArray.length).toBeGreaterThan(0);

          const targetVertex = rng.pick(legalArray);
          const chosenColor = rng.pick(allColors);

          state = applyMove(state, targetVertex, chosenColor);
          stepCount++;
        }

        // Sperner's Lemma guarantee: Game MUST finish on or before coloring the final interior vertex
        expect(state.status).toBe('finished');
        expect(stepCount).toBeLessThanOrEqual(maxPossibleMoves);
        expect(state.losingTriangles.length).toBeGreaterThanOrEqual(1);

        // Verify that every reported losing triangle truly has all 3 rulings {0, 1, 2}
        // and that extractParadoxTriadProof identifies a valid pivotal voter d in {1..n}
        for (const tri of state.losingTriangles) {
          const triColors = new Set(
            tri.vertices.map((vId) => state.colors.get(vId))
          );
          expect(triColors.has(0)).toBe(true);
          expect(triColors.has(1)).toBe(true);
          expect(triColors.has(2)).toBe(true);

          const proof = extractParadoxTriadProof(
            state.graph,
            state.colors,
            tri
          );
          expect(proof).not.toBeNull();
          expect(proof!.pivotalVoterIndex).toBeGreaterThanOrEqual(1);
          expect(proof!.pivotalVoterIndex).toBeLessThanOrEqual(n);
          expect(proof!.cycleText).toBe('A ≻ C ≻ B ≻ A');
        }
      }
    });
  });

  describe('5. Dynamic Arrovian Selection Implications & Proof Engine (arrowProof.ts)', () => {
    it('computes accurate pairwise head-to-head tallies and power classifications', () => {
      // Profile (4, 1, 1) for n = 6:
      // A vs B: G0 + G2 = 5 vs G1 = 1
      // B vs C: G0 + G1 = 5 vs G2 = 1
      // C vs A: G1 + G2 = 2 vs G0 = 4
      const tallies = computePairwiseTallies([4, 1, 1]);
      expect(tallies[0].pairLabel).toBe('A vs B');
      expect(tallies[0].leftVotes).toBe(5);
      expect(tallies[0].rightVotes).toBe(1);
      expect(tallies[0].isUnanimous).toBe(false);

      expect(tallies[1].pairLabel).toBe('B vs C');
      expect(tallies[1].leftVotes).toBe(5);
      expect(tallies[1].rightVotes).toBe(1);

      expect(tallies[2].pairLabel).toBe('C vs A');
      expect(tallies[2].leftVotes).toBe(2);
      expect(tallies[2].rightVotes).toBe(4);

      // Power classifications:
      expect(classifyPowerDynamics(4, 2, 'G₀').classification).toBe(
        'Majority Rule'
      );
      expect(classifyPowerDynamics(3, 3, 'G₁').classification).toBe(
        'Split Tie-Break'
      );
      expect(classifyPowerDynamics(2, 4, 'G₂').classification).toBe(
        'Minority Override'
      );
      expect(classifyPowerDynamics(1, 5, 'G₁').classification).toBe(
        '1-Voter Dictator Override'
      );
      expect(classifyPowerDynamics(0, 6, 'G₀').classification).toBe(
        'Unanimous Pareto Violation'
      );
    });

    it('detects when a candidate ruling triggers an immediate Arrovian Paradox Triad and identifies the Pivotal Dictator Voter', () => {
      const graph = createLatticeGraph(6);
      const colors = generateBoundaryColoring(graph, 'arrow-1951');

      // Consider the interior upward triad: (3, 2, 1), (2, 3, 1), (2, 2, 2)
      colors.set(toVertexId(3, 2, 1), 0); // Ruling A > C
      colors.set(toVertexId(2, 3, 1), 1); // Ruling B > A

      // Now evaluate all 3 candidate rulings at (2, 2, 2):
      // Ruling 0 (A > C) or 1 (B > A) at (2, 2, 2) is locally transitive,
      // whereas Ruling 2 (C > B) completes the {0, 1, 2} triad!
      const allImps = evaluateAllRulingsAtVertex(
        graph,
        colors,
        toVertexId(2, 2, 2)
      );

      expect(allImps[0].isLocallyTransitive).toBe(true);
      expect(allImps[1].isLocallyTransitive).toBe(true);
      expect(allImps[2].isLocallyTransitive).toBe(false);
      expect(allImps[2].triggeredTriads.length).toBeGreaterThanOrEqual(1);
      // Between v^(0) = (3, 2, 1) and v^(1) = (2, 3, 1), k0 shifts between 3 and 2 -> Voter #3 is pivotal
      expect(allImps[2].pivotalDictatorVoter).toBe(3);

      // Direct check on computePivotalVoterIndex
      expect(computePivotalVoterIndex([3, 2, 1], [2, 3, 1])).toBe(3);
      expect(computePivotalVoterIndex([2, 2, 2], [2, 1, 3])).toBe(4);

      const imp0At411 = evaluateRulingImplication(
        graph,
        colors,
        toVertexId(4, 1, 1),
        0
      );
      expect(imp0At411.powerClassification).toBe('Majority Rule');
      expect(imp0At411.splitLabel).toBe('4 vs 2');
    });

    it('computes Voter-ID block partitions and explicit algebraic SWF constraints', () => {
      expect(formatVoterRange(1, 0)).toBe('∅');
      expect(formatVoterRange(1, 1)).toBe('{#1}');
      expect(formatVoterRange(2, 2)).toBe('{#2, #3}');
      expect(formatVoterRange(4, 3)).toBe('{#4..#6}');

      const partitions = computeVoterBlockPartitions([1, 2, 3]);
      expect(partitions[0].blockLabel).toBe('G₀');
      expect(partitions[0].rangeLabel).toBe('{#1}');
      expect(partitions[1].blockLabel).toBe('G₁');
      expect(partitions[1].rangeLabel).toBe('{#2, #3}');
      expect(partitions[2].blockLabel).toBe('G₂');
      expect(partitions[2].rangeLabel).toBe('{#4..#6}');

      const graph = createLatticeGraph(6);
      const colors = generateBoundaryColoring(graph, 'arrow-1951');
      const imp0At411 = evaluateRulingImplication(
        graph,
        colors,
        toVertexId(4, 1, 1),
        0
      );
      expect(imp0At411.voterRangeLabel).toBe('{#1..#4}');
      expect(imp0At411.swfOutputConstraint).toBe(
        'F(P) ∈ {A≻B≻C, A≻C≻B, B≻A≻C}'
      );
      expect(imp0At411.decisiveCoalitionFormula).toBe(
        'Forces D_G₀(A,C) → d ∈ {#1..#4}'
      );
    });

    it('analyzes Possible Dictators at Turn 0: n voter summaries, n^2 total triads, armed vs eliminated boundary triads', () => {
      const n = 6;
      const graph = createLatticeGraph(n);
      const colors = generateBoundaryColoring(graph, 'arrow-1951');
      const analysis = analyzePossibleDictators(graph, colors);

      expect(analysis.voterSummaries.length).toBe(n);

      // Verify each voter d has 1 <= d <= n
      analysis.voterSummaries.forEach((summary, idx) => {
        expect(summary.voterId).toBe(idx + 1);
      });

      // Total triads across all voters equals n^2 (36 for n=6)
      const sumTriads = analysis.voterSummaries.reduce(
        (sum, v) => sum + v.totalTriads,
        0
      );
      expect(sumTriads).toBe(n * n);

      // In the initial state, boundary edges have pre-colored pairs:
      // boundary-adjacent triads with 2 distinct boundary colors are 'armed'
      // boundary triads where both boundary vertices share the same color are 'eliminated'
      const armedTriads = Array.from(analysis.triadStates.values()).filter(
        (t) => t.status === 'armed'
      );
      const eliminatedTriads = Array.from(analysis.triadStates.values()).filter(
        (t) => t.status === 'eliminated'
      );
      expect(armedTriads.length).toBeGreaterThan(0);
      expect(eliminatedTriads.length).toBeGreaterThan(0);

      // For every armed triad at Turn 0, openVertexId is in the interior and missingRuling is valid
      for (const armed of armedTriads) {
        expect(armed.openVertexId).not.toBeNull();
        expect(armed.missingRuling).not.toBeNull();
        expect(graph.interiorIds).toContain(armed.openVertexId!);
      }
    });

    it('marks an interior triad armed when 2 vertices are colored with distinct rulings and updates vertexThreats', () => {
      const graph = createLatticeGraph(6);
      const colors = generateBoundaryColoring(graph, 'arrow-1951');

      // Consider an interior triad: e.g. (3, 2, 1), (2, 3, 1), (2, 2, 2)
      // (3,2,1) and (2,3,1) colored with 0 (A>C) and 1 (B>A)
      const vA = toVertexId(3, 2, 1);
      const vB = toVertexId(2, 3, 1);
      const vOpen = toVertexId(2, 2, 2);

      colors.set(vA, 0);
      colors.set(vB, 1);

      const analysis = analyzePossibleDictators(graph, colors);

      // Find the triad containing vA, vB, vOpen
      const targetTri = graph.triangles.find(
        (t) =>
          t.vertices.includes(vA) &&
          t.vertices.includes(vB) &&
          t.vertices.includes(vOpen)
      )!;
      expect(targetTri).toBeDefined();

      const tState = analysis.triadStates.get(targetTri.id)!;
      expect(tState).toBeDefined();
      expect(tState.status).toBe('armed');
      expect(tState.openVertexId).toBe(vOpen);
      expect(tState.missingRuling).toBe(2);
      expect(tState.pivotalVoterId).toBe(getTriadPivotalVoter(graph, targetTri));
      expect(tState.pivotalVoterId).toBe(3); // max(3, 2, 2) = 3

      // Check vertexThreats at vOpen
      const threat = analysis.vertexThreats.get(vOpen);
      expect(threat).toBeDefined();
      expect(threat?.safeRulings).not.toContain(2);
      expect(threat?.lethalRulings.get(2)).toContain(3);
    });
  });

  describe('6. Interactive SVG Simplex UI, Constitutional Architect Mode & Arrow Terminology (v0.2.0)', () => {
    it('renders the v0.2.0 badge, defaults to Constitutional Architect mode, and displays A≻C / B≻A / C≻B without leading numbers', () => {
      render(React.createElement(App));

      const badge = screen.getByTestId('version-badge');
      expect(badge.textContent).toBe(DEFAULT_APP_VERSION);

      // Defaults to Constitutional Architect
      expect(screen.getByTestId('active-role-badge').textContent).toContain(
        'Constitutional Architect'
      );
      expect(screen.getByTestId('solo-survival-progress')).toBeDefined();

      // Click interior profile (2,2,2) to open radial ruling picker
      const centerNode = screen.getByTestId('vertex-2,2,2');
      expect(centerNode.getAttribute('data-legal')).toBe('true');
      fireEvent.click(centerNode);

      // Radial option 1 should show B ≻ A and coalition split G₁: 2v4 Minority
      const radialOption1 = screen.getByTestId('radial-color-option-1');
      expect(radialOption1.textContent).toContain('B ≻ A');
      expect(radialOption1.textContent).toContain('G₁: 2v4 Minority');

      // Ruling chamber implication card should also be populated
      expect(screen.getByTestId('ruling-implication-1').textContent).toContain(
        'Minority Override'
      );
      expect(
        screen.getByTestId('swf-output-constraint-1').textContent
      ).toBe('F(P) ∈ {B≻C≻A, C≻B≻A, B≻A≻C}');
      expect(
        screen.getByTestId('swf-decisive-constraint-1').textContent
      ).toBe('Forces D_G₁(B,A) → d ∈ {#3, #4}');
      expect(
        screen.getByTestId('voter-block-range-0').textContent
      ).toContain('{#1, #2}');

      // Pairwise tally bars should be rendered in InspectorPanel
      expect(screen.getByTestId('pairwise-tally-A-vs-B')).toBeDefined();
      expect(screen.getByTestId('pairwise-tally-B-vs-C')).toBeDefined();
      expect(screen.getByTestId('pairwise-tally-C-vs-A')).toBeDefined();

      // Commit ruling 1 via radial option
      fireEvent.click(radialOption1);
      expect(
        screen.getByTestId('vertex-2,2,2').getAttribute('data-colored')
      ).toBe('1');

      // Active SWF constraint box is visible in InspectorPanel
      const activeConstraint = screen.getByTestId(
        'inspector-active-swf-constraint'
      );
      expect(activeConstraint).toBeDefined();
      expect(activeConstraint.textContent).toContain('d ∈ {#3, #4}');

      // Verify boundary-seed-button generates a new border seed and resets vertex-2,2,2 back to 'uncolored' at Step 1
      const seedBtn = screen.getByTestId('boundary-seed-button');
      const prevSeedText = seedBtn.textContent;
      fireEvent.click(seedBtn);
      expect(seedBtn.textContent).not.toBe(prevSeedText);
      expect(
        screen.getByTestId('vertex-2,2,2').getAttribute('data-colored')
      ).toBe('uncolored');
      expect(screen.getByTestId('locality-status-badge').textContent).toContain(
        'Step 1'
      );

      // Verify 2-Player Duel mode widget is removed
      expect(screen.queryByTestId('game-mode-duel')).toBeNull();
    });

    it('enlarges a profile node on hover and displays A≻C (without 0: prefix) + coordinate text', () => {
      render(React.createElement(App));

      const topCorner = screen.getByTestId('vertex-6,0,0');
      const initialRadius = Number(topCorner.getAttribute('data-radius'));
      expect(initialRadius).toBe(23);
      expect(topCorner.getAttribute('data-hovered')).toBe('false');

      // Hover over top corner (6,0,0)
      fireEvent.mouseEnter(topCorner);

      const hoveredNode = screen.getByTestId('vertex-6,0,0');
      const enlargedRadius = Number(hoveredNode.getAttribute('data-radius'));
      expect(hoveredNode.getAttribute('data-hovered')).toBe('true');
      expect(enlargedRadius).toBeGreaterThan(initialRadius);

      const hoveredLabel = screen.getByTestId('hovered-label-6,0,0');
      expect(hoveredLabel.textContent).toContain('A≻C');
      expect(hoveredLabel.textContent).not.toContain('0:A≻C');
      expect(hoveredLabel.textContent).toContain('(6,0,0)');

      // Unhover restores original radius
      fireEvent.mouseLeave(hoveredNode);
      expect(
        screen.getByTestId('vertex-6,0,0').getAttribute('data-radius')
      ).toBe(String(initialRadius));
    });

    it('detects when version.json updates at the source and triggers PWA update', async () => {
      let versionCounter = 1;
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => {
          const ver = versionCounter === 1 ? DEFAULT_APP_VERSION : 'v9.9.9';
          const build = `arrovian-atropos-${ver}`;
          return new Response(
            JSON.stringify({
              version: ver,
              buildVersion: build,
              timestamp: Date.now(),
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        });

      render(React.createElement(App));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled();
      });

      // Simulate source version bumping from DEFAULT_APP_VERSION -> v9.9.9 and window refocus
      versionCounter = 2;
      fireEvent(window, new Event('focus'));

      await waitFor(() => {
        expect(screen.getByTestId('version-badge').textContent).toBe('v9.9.9');
      });

      fetchSpy.mockRestore();
    });

    it('toggles the Possible Dictators radar panel and displays rows for Voters #1 through #6', () => {
      render(React.createElement(App));

      // Initially, possible-dictators-panel is not rendered in the sidebar
      expect(screen.queryByTestId('possible-dictators-panel')).toBeNull();

      const toggleBtn = screen.getByTestId('toggle-possible-dictators');
      expect(toggleBtn).toBeDefined();
      expect(toggleBtn.textContent).toContain('Possible Dictators');

      // Click toggle
      fireEvent.click(toggleBtn);

      // Panel is now visible
      const panel = screen.getByTestId('possible-dictators-panel');
      expect(panel).toBeDefined();
      expect(panel.textContent).toContain('Possible Dictators Radar');

      // Rows for Voters #1 through #6 are rendered
      for (let voterId = 1; voterId <= 6; voterId++) {
        const row = screen.getByTestId(`dictator-voter-row-${voterId}`);
        expect(row).toBeDefined();
        expect(row.textContent).toContain(`Voter #${voterId}`);
      }

      // Clicking again hides the panel
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('possible-dictators-panel')).toBeNull();
    });
  });
});
