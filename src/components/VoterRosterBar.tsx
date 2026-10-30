import React from 'react';
import {
  BarycentricCoord,
  CANDIDATES,
  getVoterLabel,
  RULING_COLORS,
  RulingColor,
} from '../engine/barycentric';
import {
  buildElectorateRosterAtProfile,
  computeFlippedVoterBetweenProfiles,
  PossibleDictatorsAnalysis,
  VoterDictatorStatus,
} from '../engine/arrowProof';

export interface VoterRosterBarProps {
  readonly n: number;
  readonly activeCoord: BarycentricCoord | null;
  readonly activeCoordLabel: string;
  readonly lastMoveCoord: BarycentricCoord | null;
  readonly dictatorAnalysis: PossibleDictatorsAnalysis;
  readonly hoveredDictatorId: number | null;
  readonly onHoverDictator: (voterId: number | null) => void;
}

const CANDIDATE_KEYS: readonly RulingColor[] = [0, 1, 2];
const BLOCS: readonly RulingColor[] = [0, 1, 2];

function getDictatorBadgeClass(status: VoterDictatorStatus): string {
  switch (status) {
    case 'unmasked':
      return 'border-rose-500/60 bg-rose-500/25 text-rose-200 font-black animate-pulse';
    case 'armed':
      return 'border-amber-500/60 bg-amber-500/20 text-amber-200 font-bold';
    case 'viable':
      return 'border-sky-500/40 bg-sky-500/15 text-sky-200 font-semibold';
    case 'cleared':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 font-medium';
  }
}

function getDictatorBadgeText(status: VoterDictatorStatus): string {
  switch (status) {
    case 'unmasked':
      return '👑 DICTATOR UNMASKED';
    case 'armed':
      return '⚠️ ARMED DICTATOR';
    case 'cleared':
      return '✅ CLEARED';
    case 'viable':
      return '🔍 SUSPECT';
  }
}

export const VoterRosterBar: React.FC<VoterRosterBarProps> = ({
  n,
  activeCoord,
  activeCoordLabel,
  lastMoveCoord,
  dictatorAnalysis,
  hoveredDictatorId,
  onHoverDictator,
}) => {
  const flipped = activeCoord
    ? computeFlippedVoterBetweenProfiles(lastMoveCoord, activeCoord)
    : null;

  return (
    <div
      data-testid="voter-roster-bar"
      className="rounded-2xl border border-slate-800/90 bg-slate-900/85 p-3.5 shadow-xl backdrop-blur-sm"
    >
      {/* Top Row: 3-Candidate Legend, Active Profile & Single-Voter Flip Callout */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {CANDIDATE_KEYS.map((c) => {
            const cand = CANDIDATES[c];
            const rulingMeta = RULING_COLORS[c];
            return (
              <div
                key={c}
                data-testid={`candidate-pill-${c}`}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono shadow-sm"
                style={{
                  borderColor: `${cand.hexColor}60`,
                  backgroundColor: `${cand.hexColor}15`,
                  color: cand.hexColor,
                }}
              >
                <span className="font-bold">{cand.fullLabel}</span>
                <span className="text-[10px] text-slate-300">
                  Faction {rulingMeta.coalitionBlock}: {rulingMeta.shapedCoalitionRanking}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            data-testid="active-roster-profile-badge"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 font-mono text-xs text-slate-200"
          >
            <span className="font-semibold text-sky-300">
              {activeCoord === null
                ? `Awaiting Scenario Selection · ${activeCoordLabel}`
                : `Profile (${activeCoord.join(', ')}) · ${activeCoordLabel}`}
            </span>
          </div>

          {flipped !== null && (
            <div
              data-testid="flipped-voter-callout"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-1 font-mono text-xs font-bold text-amber-200 animate-pulse"
            >
              <span>⚡ {flipped.summary}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Roster Body */}
      {activeCoord === null ? (
        /* Branch 1: Idle Initial State (no profile selected/hovered) */
        <div className="flex flex-col gap-3">
          <div
            data-testid="roster-idle-prompt"
            className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-center text-xs text-indigo-200"
          >
            Hover or click any election node (k₀, k₁, k₂) below to inspect how the {n} Senators split into the 3 Voting Blocs (G₀, G₁, G₂) in that scenario.
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {dictatorAnalysis.voterSummaries.map((v) => {
              const isHovered = hoveredDictatorId === v.voterId;
              return (
                <div
                  key={v.voterId}
                  data-testid={`voter-card-${v.voterId}`}
                  data-faction="none"
                  data-dictator-status={v.status}
                  onMouseEnter={() => onHoverDictator(v.voterId)}
                  onMouseLeave={() => onHoverDictator(null)}
                  className={`group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/75 p-2.5 transition-all ${
                    isHovered
                      ? 'ring-2 ring-sky-400 bg-slate-900 shadow-lg'
                      : 'hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                  style={{ borderLeftColor: '#64748b', borderLeftWidth: 4 }}
                >
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-slate-100">
                        {getVoterLabel(v.voterId)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Select a node (k₀, k₁, k₂) to view bloc ballot
                    </div>
                  </div>

                  <div className="mt-2.5 border-t border-slate-800/80 pt-1.5">
                    <span
                      data-testid={`voter-dictator-badge-${v.voterId}`}
                      className={`inline-block w-full text-center rounded border px-1.5 py-0.5 font-mono text-[9.5px] ${getDictatorBadgeClass(
                        v.status
                      )}`}
                    >
                      {getDictatorBadgeText(v.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Branch 2: Active Scenario Profile — Grouped by Voting Blocs */
        (() => {
          const seats = buildElectorateRosterAtProfile(
            activeCoord,
            lastMoveCoord,
            dictatorAnalysis
          );

          return (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {BLOCS.map((b) => {
                const meta = RULING_COLORS[b];
                const blocCount = activeCoord[b];
                const blocSeats = seats.filter((s) => s.blockIndex === b);

                return (
                  <div
                    key={b}
                    data-testid={`voting-bloc-container-${b}`}
                    className="flex flex-col rounded-xl border bg-slate-950/70 p-2.5 shadow-md"
                    style={{ borderColor: `${meta.hexFill}50` }}
                  >
                    {/* Bloc Header */}
                    <div
                      data-testid={`voting-bloc-header-${b}`}
                      className="mb-2 flex flex-col gap-1 border-b pb-2"
                      style={{ borderColor: `${meta.hexFill}30` }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="font-mono text-xs font-bold"
                          style={{ color: meta.hexFill }}
                        >
                          Bloc {meta.coalitionBlock}: {blocCount} Senator{blocCount === 1 ? '' : 's'} · {meta.shapedCoalitionRanking}
                        </span>
                      </div>
                      <div>
                        <span
                          className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${meta.hexFill}20`,
                            color: meta.hexFill,
                          }}
                        >
                          Supports Ruling {meta.shapedRuling}
                        </span>
                      </div>
                    </div>

                    {/* Bloc Body: Empty or List of Senators */}
                    {blocSeats.length === 0 ? (
                      <div
                        data-testid={`empty-bloc-${b}`}
                        className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-800/80 p-3 text-center font-mono text-xs text-slate-500"
                      >
                        0 Senators in this bloc
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {blocSeats.map((seat) => {
                          const isHovered = hoveredDictatorId === seat.voterId;
                          return (
                            <div
                              key={seat.voterId}
                              data-testid={`voter-card-${seat.voterId}`}
                              data-faction={seat.blockLabel}
                              data-dictator-status={seat.dictatorStatus}
                              onMouseEnter={() => onHoverDictator(seat.voterId)}
                              onMouseLeave={() => onHoverDictator(null)}
                              className={`group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-2 transition-all ${
                                isHovered
                                  ? 'ring-2 ring-sky-400 bg-slate-900 shadow-lg'
                                  : 'hover:border-slate-700 hover:bg-slate-900/60'
                              } ${seat.isFlippedFromLastMove ? 'ring-1 ring-amber-400/60' : ''}`}
                              style={{ borderLeftColor: seat.hexColor, borderLeftWidth: 4 }}
                            >
                              <div>
                                <div className="mb-1 flex items-center justify-between gap-1">
                                  <span className="font-mono text-xs font-bold text-slate-100">
                                    {seat.fullLabel}
                                  </span>
                                  <span
                                    className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                                    style={{
                                      backgroundColor: `${seat.hexColor}25`,
                                      color: seat.hexColor,
                                    }}
                                  >
                                    {seat.blockLabel}
                                  </span>
                                </div>

                                <div className="font-mono text-[11px] font-semibold text-slate-200">
                                  {seat.shapedRanking}
                                </div>

                                {seat.isFlippedFromLastMove && (
                                  <div className="mt-1">
                                    <span
                                      data-testid={`flipped-voter-badge-${seat.voterId}`}
                                      className="inline-flex items-center gap-1 rounded bg-amber-400 px-1.5 py-0.5 font-mono text-[9.5px] font-black text-slate-950 shadow"
                                    >
                                      ⚡ Flipped Ballot
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 border-t border-slate-800/80 pt-1.5">
                                <span
                                  data-testid={`voter-dictator-badge-${seat.voterId}`}
                                  className={`inline-block w-full text-center rounded border px-1.5 py-0.5 font-mono text-[9.5px] ${getDictatorBadgeClass(
                                    seat.dictatorStatus
                                  )}`}
                                >
                                  {seat.dictatorBadgeText}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()
      )}
    </div>
  );
};
