import React from 'react';
import {
  BarycentricCoord,
  CANDIDATES,
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
  readonly activeCoord: BarycentricCoord;
  readonly activeCoordLabel: string;
  readonly lastMoveCoord: BarycentricCoord | null;
  readonly dictatorAnalysis: PossibleDictatorsAnalysis;
  readonly hoveredDictatorId: number | null;
  readonly onHoverDictator: (voterId: number | null) => void;
}

const CANDIDATE_KEYS: readonly RulingColor[] = [0, 1, 2];

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

export const VoterRosterBar: React.FC<VoterRosterBarProps> = ({
  activeCoord,
  activeCoordLabel,
  lastMoveCoord,
  dictatorAnalysis,
  hoveredDictatorId,
  onHoverDictator,
}) => {
  const seats = buildElectorateRosterAtProfile(
    activeCoord,
    lastMoveCoord,
    dictatorAnalysis
  );
  const flipped = computeFlippedVoterBetweenProfiles(
    lastMoveCoord,
    activeCoord
  );

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
              Profile ({activeCoord.join(', ')}) · {activeCoordLabel}
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

      {/* Voter Cards Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {seats.map((seat) => {
          const isHovered = hoveredDictatorId === seat.voterId;
          return (
            <div
              key={seat.voterId}
              data-testid={`voter-card-${seat.voterId}`}
              data-faction={seat.blockLabel}
              data-dictator-status={seat.dictatorStatus}
              onMouseEnter={() => onHoverDictator(seat.voterId)}
              onMouseLeave={() => onHoverDictator(null)}
              className={`group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/75 p-2.5 transition-all ${
                isHovered
                  ? 'ring-2 ring-sky-400 bg-slate-900 shadow-lg'
                  : 'hover:border-slate-700 hover:bg-slate-900/60'
              } ${seat.isFlippedFromLastMove ? 'ring-1 ring-amber-400/60' : ''}`}
              style={{ borderLeftColor: seat.hexColor, borderLeftWidth: 4 }}
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-1">
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
                  <div className="mt-1.5">
                    <span
                      data-testid={`flipped-voter-badge-${seat.voterId}`}
                      className="inline-flex items-center gap-1 rounded bg-amber-400 px-1.5 py-0.5 font-mono text-[9.5px] font-black text-slate-950 shadow"
                    >
                      ⚡ Flipped Ballot
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2.5 border-t border-slate-800/80 pt-1.5">
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
    </div>
  );
};
