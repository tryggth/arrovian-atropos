import React from 'react';
import { VertexId } from '../engine/barycentric';
import {
  PossibleDictatorsAnalysis,
  VoterDictatorStatus,
} from '../engine/arrowProof';
import { Radar, AlertTriangle, ShieldCheck, Crosshair } from 'lucide-react';

export interface PossibleDictatorsPanelProps {
  readonly n: number;
  readonly analysis: PossibleDictatorsAnalysis;
  readonly hoveredDictatorId: number | null;
  readonly onHoverDictator: (voterId: number | null) => void;
  readonly onSelectTriggerVertex?: (vertexId: VertexId) => void;
  readonly legalMoves?: ReadonlySet<VertexId>;
}

function getStatusBadge(status: VoterDictatorStatus) {
  switch (status) {
    case 'unmasked':
      return (
        <span className="rounded-full border border-rose-500/50 bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-black text-rose-200">
          UNMASKED
        </span>
      );
    case 'armed':
      return (
        <span className="rounded-full border border-amber-500/50 bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-black text-amber-300 animate-pulse">
          ARMED (1 Move)
        </span>
      );
    case 'viable':
      return (
        <span className="rounded-full border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300">
          VIABLE
        </span>
      );
    case 'cleared':
      return (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
          CLEARED
        </span>
      );
  }
}

export const PossibleDictatorsPanel: React.FC<PossibleDictatorsPanelProps> = ({
  n,
  analysis,
  hoveredDictatorId,
  onHoverDictator,
  onSelectTriggerVertex,
  legalMoves,
}) => {
  return (
    <div
      data-testid="possible-dictators-panel"
      className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-200">
          <Radar className="h-4 w-4 text-amber-400" />
          <span>Possible Dictators Radar (Voters #1 … #{n})</span>
        </h3>
        <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
          {analysis.activeCandidateVoterIds.length} / {n} Active
        </span>
      </div>

      {/* Summary Row */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2">
          <div className="flex items-center justify-center gap-1 text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px] font-semibold uppercase">Armed</span>
          </div>
          <div className="text-xs font-black text-amber-200">
            Armed (1 Move): {analysis.armedVoterIds.length}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2">
          <div className="flex items-center justify-center gap-1 text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            <span className="text-[10px] font-semibold uppercase">Cleared</span>
          </div>
          <div className="text-xs font-black text-emerald-200">
            Cleared (Safe): {analysis.clearedVoterIds.length}
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2">
          <div className="flex items-center justify-center gap-1 text-rose-400">
            <Crosshair className="h-3 w-3" />
            <span className="text-[10px] font-semibold uppercase">Traps</span>
          </div>
          <div className="text-xs font-black text-rose-200">
            Trap Profiles (0 Safe): {analysis.trapVertexIds.length}
          </div>
        </div>
      </div>

      {/* Voters List */}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {analysis.voterSummaries.map((v) => {
          const isHovered = hoveredDictatorId === v.voterId;
          return (
            <div
              key={v.voterId}
              data-testid={`dictator-voter-row-${v.voterId}`}
              data-status={v.status}
              onMouseEnter={() => onHoverDictator(v.voterId)}
              onMouseLeave={() => onHoverDictator(null)}
              className={`flex flex-col gap-1 rounded-xl border p-2.5 transition-all ${
                isHovered
                  ? 'border-sky-400/80 bg-sky-950/40 shadow-md ring-1 ring-sky-400/50'
                  : v.status === 'armed'
                    ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70'
                    : v.status === 'cleared'
                      ? 'border-slate-800/80 bg-slate-950/40 opacity-75 hover:opacity-100'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-100">
                    Voter #{v.voterId}
                  </span>
                  <span className="font-mono text-[10.5px] text-slate-400">
                    {v.armedTriads.length} armed · {v.latentTriads.length} latent · {v.eliminatedCount}/{v.totalTriads} cleared
                  </span>
                </div>
                <div>{getStatusBadge(v.status)}</div>
              </div>

              {v.triggerVertexIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 font-mono text-[10.5px] text-amber-300">
                  <span className="text-slate-400">Trigger Profiles:</span>
                  {v.triggerVertexIds.map((vId, idx) => {
                    const isLegal = legalMoves ? legalMoves.has(vId) : true;
                    return (
                      <span key={vId}>
                        {idx > 0 && ' '}
                        <button
                          type="button"
                          onClick={() => onSelectTriggerVertex?.(vId)}
                          className={`rounded px-1.5 py-0.5 font-bold transition-colors ${
                            isLegal
                              ? 'border border-amber-500/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/40'
                              : 'border border-slate-700 bg-slate-800 text-slate-400'
                          }`}
                          title={
                            isLegal
                              ? `Legal move! Click to select profile (${vId})`
                              : `Profile (${vId})`
                          }
                        >
                          ({vId})
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
