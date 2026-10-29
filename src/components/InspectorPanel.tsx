import React from 'react';
import {
  LatticeVertex,
  RULING_COLORS,
  RulingColor,
} from '../engine/barycentric';
import { computePairwiseTallies } from '../engine/arrowProof';
import { Info, Scale } from 'lucide-react';

export interface InspectorPanelProps {
  readonly n: number;
  readonly totalProfiles: number;
  readonly inspectedVertex: LatticeVertex | null;
  readonly inspectedColor: RulingColor | undefined;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  n,
  totalProfiles,
  inspectedVertex,
  inspectedColor,
}) => {
  const tallies = inspectedVertex
    ? computePairwiseTallies(inspectedVertex.coord)
    : null;

  const getProfileTypeLabel = (v: LatticeVertex): string => {
    if (v.isCorner) {
      return 'Unanimous Electorate Corner';
    }
    if (v.isBoundary && v.forbiddenColor !== null) {
      const forbiddenMeta = RULING_COLORS[v.forbiddenColor];
      return `Pareto Boundary Profile (No ${forbiddenMeta.coalitionBlock} Voters · k_${v.forbiddenColor} = 0)`;
    }
    return 'Divided Electorate Profile';
  };

  return (
    <div
      data-testid="electorate-inspector-panel"
      className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-4 shadow-lg"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Info className="h-3.5 w-3.5 text-indigo-400" />
          <span>Electorate Profile &amp; Pairwise Tally Inspector</span>
        </h3>
        <span className="font-mono text-xs text-slate-400">
          n = {n} ({totalProfiles} profiles)
        </span>
      </div>

      {inspectedVertex && tallies ? (
        <div className="space-y-3 text-xs">
          {/* Profile Coordinate & Adjudication Status */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
            <div>
              <div className="font-mono text-sm font-bold text-slate-100">
                Preference Profile ({inspectedVertex.coord.join(', ')})
              </div>
              <div className="text-[11px] text-slate-400">
                {getProfileTypeLabel(inspectedVertex)}
              </div>
            </div>
            {inspectedColor !== undefined ? (
              <span
                className="rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-slate-950"
                style={{
                  backgroundColor: RULING_COLORS[inspectedColor].hexFill,
                }}
              >
                {RULING_COLORS[inspectedColor].shortBadge}
              </span>
            ) : (
              <span className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-sky-300">
                Unadjudicated
              </span>
            )}
          </div>

          {/* 3 Condorcet Voter Coalition Blocks */}
          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-2">
              <div className="font-bold text-rose-400">
                G₀: k₀ = {inspectedVertex.coord[0]}
              </div>
              <div className="text-slate-400">A ≻ B ≻ C</div>
            </div>
            <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-2">
              <div className="font-bold text-emerald-400">
                G₁: k₁ = {inspectedVertex.coord[1]}
              </div>
              <div className="text-slate-400">B ≻ C ≻ A</div>
            </div>
            <div className="rounded-lg border border-slate-800/90 bg-slate-950/60 p-2">
              <div className="font-bold text-indigo-400">
                G₂: k₂ = {inspectedVertex.coord[2]}
              </div>
              <div className="text-slate-400">C ≻ A ≻ B</div>
            </div>
          </div>

          {/* Pairwise Vote Tally Bars (A vs B, B vs C, C vs A) */}
          <div className="space-y-2 rounded-xl border border-slate-800/90 bg-slate-950/60 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-sky-400" />
                <span>Pairwise Head-to-Head Vote Tallies</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {n} Voters Total
              </span>
            </div>

            {tallies.map((t) => {
              const leftPct = n > 0 ? Math.round((t.leftVotes / n) * 100) : 50;
              return (
                <div
                  key={t.pairLabel}
                  data-testid={`pairwise-tally-${t.pairLabel.replace(/\s+/g, '-')}`}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-200">
                      <strong>{t.leftOption}</strong>: {t.leftVotes}{' '}
                      <span className="text-[10px] text-slate-400">
                        ({t.leftBlocksLabel})
                      </span>
                    </span>
                    <span className="font-bold text-slate-400">
                      {t.pairLabel}
                    </span>
                    <span className="text-slate-200">
                      <strong>{t.rightOption}</strong>: {t.rightVotes}{' '}
                      <span className="text-[10px] text-slate-400">
                        ({t.rightBlocksLabel})
                      </span>
                    </span>
                  </div>

                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="bg-sky-400 transition-all"
                      style={{ width: `${leftPct}%` }}
                    />
                    <div
                      className="bg-indigo-500/80 transition-all"
                      style={{ width: `${100 - leftPct}%` }}
                    />
                  </div>

                  {t.isUnanimous && t.unanimousWinner && (
                    <div className="flex items-center justify-between font-mono text-[10px] text-amber-300">
                      <span>Unanimous {t.unanimousWinner}</span>
                      {t.paretoForbiddenRuling !== null && (
                        <span>
                          Pareto Forbids{' '}
                          {RULING_COLORS[t.paretoForbiddenRuling].ruling}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Hover over or select any preference profile on the simplex to inspect
          its Condorcet voter coalitions (k₀, k₁, k₂) and pairwise vote tallies.
        </p>
      )}
    </div>
  );
};
