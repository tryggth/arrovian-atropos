import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { getVoterName } from '../engine/barycentric';

export interface BriefingBannerProps {
  readonly n: number;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

export const BriefingBanner: React.FC<BriefingBannerProps> = ({
  n,
  isOpen,
  onToggle,
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="briefing-banner"
      className="rounded-2xl border border-indigo-500/40 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md"
    >
      {/* Header Row */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/40 bg-indigo-500/20 text-indigo-300">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              The Constitutional Architect&apos;s Briefing
            </h2>
            <p className="text-xs text-indigo-300/80">
              5-Step Mental Model: How the {n}-Senator Council &amp; Arrow&apos;s Impossibility Trap Work
            </p>
          </div>
        </div>
        <button
          type="button"
          data-testid="dismiss-briefing-button"
          onClick={onToggle}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-slate-100"
        >
          <X className="h-3.5 w-3.5" />
          <span>Hide Briefing</span>
        </button>
      </div>

      {/* 5-Step Mental Model Grid */}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-5">
        {/* Step 1 */}
        <div
          data-testid="briefing-step-1"
          className="flex flex-col gap-1.5 rounded-xl border border-indigo-500/20 bg-slate-950/60 p-3"
        >
          <div className="font-mono text-xs font-bold text-indigo-300">
            1. Your Role
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Writing the Constitution (F) for {n} Friends / Senators (V1 · Ada .. V{n} · {getVoterName(n)}) Picking Dinner among 3 options: ● Pizza (A), ■ Tacos (B), and ▲ Sushi (C).
          </p>
        </div>

        {/* Step 2 */}
        <div
          data-testid="briefing-step-2"
          className="flex flex-col gap-1.5 rounded-xl border border-indigo-500/20 bg-slate-950/60 p-3"
        >
          <div className="font-mono text-xs font-bold text-indigo-300">
            2. What a Node (k₀, k₁, k₂) Is
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            A &quot;What-If&quot; Dinner Split (Election Scenario) where the {n} Friends split into 3 Dinner Teams (Team Pizza / Bloc G₀: k₀, Team Tacos / Bloc G₁: k₁, Team Sushi / Bloc G₂: k₂)—which is why Friends in the same team cast identical ballots at that node.
          </p>
        </div>

        {/* Step 3 */}
        <div
          data-testid="briefing-step-3"
          className="flex flex-col gap-1.5 rounded-xl border border-indigo-500/20 bg-slate-950/60 p-3"
        >
          <div className="font-mono text-xs font-bold text-indigo-300">
            3. Why the Border Is Pre-Colored (Pareto Unanimity)
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            On the outer edges (kᵢ = 0), one team has 0 friends (0 on Team Sushi, 0 on Team Pizza, 0 on Team Tacos), so all {n} unanimously prefer one option over another and the eliminated option cannot win (Pareto Unanimity).
          </p>
        </div>

        {/* Step 4 */}
        <div
          data-testid="briefing-step-4"
          className="flex flex-col gap-1.5 rounded-xl border border-indigo-500/20 bg-slate-950/60 p-3"
        >
          <div className="font-mono text-xs font-bold text-indigo-300">
            4. Why You Must Rule on the Interior (3-Way Tie-Breaker)
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Every interior split has a 3-way Rock-Paper-Scissors circular tie (● Pizza ≻ ■ Tacos ≻ ▲ Sushi ≻ ● Pizza). Your ruling cuts one link of the cycle and crowns a winner (● Pizza (A) Wins, ■ Tacos (B) Wins, or ▲ Sushi (C) Wins).
          </p>
        </div>

        {/* Step 5 */}
        <div
          data-testid="briefing-step-5"
          className="flex flex-col gap-1.5 rounded-xl border border-indigo-500/20 bg-slate-950/60 p-3"
        >
          <div className="font-mono text-xs font-bold text-indigo-300">
            5. The 1-Friend Shift &amp; Hidden Dictator Trap
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Each step moves 1 Friend between Dinner Teams while the other {n - 1} stay put. Surrounding any unit triangle with all 3 winners (Pizza, Tacos, Sushi) lets 1 single Friend flip the group&apos;s dinner choice against the other {n - 1}—unmasking the Hidden Dictator! By Arrow&apos;s Theorem, 100% completion is impossible; see how many elections you can adjudicate before the theorem corners you.
          </p>
        </div>
      </div>
    </div>
  );
};
