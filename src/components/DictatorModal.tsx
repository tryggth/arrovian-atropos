import React from 'react';
import { getVoterLabel, RULING_COLORS } from '../engine/barycentric';
import { extractParadoxTriadProof } from '../engine/arrowProof';
import { GameState } from '../engine/gameState';
import { Crown, RotateCcw, ShieldAlert } from 'lucide-react';

export interface DictatorModalProps {
  readonly gameState: GameState;
  readonly onPlayAgain: () => void;
}

export const DictatorModal: React.FC<DictatorModalProps> = ({
  gameState,
  onPlayAgain,
}) => {
  if (gameState.status !== 'finished') {
    return null;
  }

  const primaryTriangle = gameState.losingTriangles[0] ?? null;
  const proof = primaryTriangle
    ? extractParadoxTriadProof(
        gameState.graph,
        gameState.colors,
        primaryTriangle
      )
    : null;

  const totalDivided = gameState.graph.interiorIds.length;
  const adjudicatedCount = gameState.moveHistory.length;
  const survivalPct =
    totalDivided > 0 ? Math.round((adjudicatedCount / totalDivided) * 100) : 0;

  return (
    <div
      data-testid="game-over-banner"
      className="flex flex-col gap-3.5 rounded-2xl border border-amber-500/50 bg-amber-500/10 px-5 py-4 shadow-xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/20 text-amber-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-amber-200">
                Dictator &amp; Cycle Unmasked · Arrow’s Impossibility Triggered!
              </h2>
              <span className="rounded-md border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-rose-200">
                Adjudicated {adjudicatedCount} / {totalDivided} Divided Profiles ({survivalPct}%)
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-300">
              On Precedent Step #{gameState.turn} at Preference Profile{' '}
              <span className="font-mono font-semibold text-slate-100">
                ({gameState.lastMove})
              </span>
              , the constitutional ruling completed an{' '}
              <span className="font-semibold text-amber-300">
                Arrovian Paradox Triad
              </span>{' '}
              with intransitive societal cycle{' '}
              <span className="font-mono font-bold text-amber-200">
                A ≻ C ≻ B ≻ A
              </span>
              .
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onPlayAgain}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow transition-colors hover:bg-amber-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Play Again</span>
        </button>
      </div>

      {/* Mathematical Post-Mortem Breakdown: 3 Triad Profiles + Pivotal Dictator Voter #d */}
      {proof && (
        <div
          data-testid="dictator-postmortem-card"
          className="rounded-xl border border-slate-800/90 bg-slate-950/85 p-3.5 text-xs"
        >
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <span
                data-testid="pivotal-dictator-badge"
                className="font-mono font-bold text-amber-300"
              >
                👑 Pivotal Dictator Unmasked: Voter #{proof.pivotalVoterIndex} ({getVoterLabel(proof.pivotalVoterIndex)})
              </span>
            </div>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-200">
              Intransitive Cycle: {proof.cycleText}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {([0, 2, 1] as const).map((rulingCode) => {
              const member = proof.membersByRuling[rulingCode];
              const meta = RULING_COLORS[rulingCode];
              return (
                <div
                  key={rulingCode}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-2 font-mono"
                >
                  <div>
                    <div className="text-[11px] font-bold text-slate-100">
                      Profile ({member.coord.join(', ')})
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {member.coalitionBlock}: {member.supportVotes} vs{' '}
                      {member.opposeVotes}
                    </div>
                  </div>
                  <span
                    className="rounded px-2 py-0.5 text-[11px] font-black text-slate-950"
                    style={{ backgroundColor: meta.hexFill }}
                  >
                    {meta.ruling}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-2.5 text-[11px] leading-relaxed text-slate-300">
            {proof.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
