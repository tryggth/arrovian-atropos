import React from 'react';
import {
  BarycentricCoord,
  RULING_COLORS,
  RulingColor,
  VertexId,
} from '../engine/barycentric';
import { RulingImplication, SWF_OUTPUT_CONSTRAINTS } from '../engine/arrowProof';
import {
  AlertTriangle,
  CheckCircle2,
  MousePointerClick,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export interface ColorPickerProps {
  readonly activeColor: RulingColor;
  readonly selectedVertexId: VertexId | null;
  readonly inspectedVertexId: VertexId | null;
  readonly inspectedCoord: BarycentricCoord | null;
  readonly inspectedIsUnadjudicated: boolean;
  readonly implications: Record<RulingColor, RulingImplication> | null;
  readonly quickPlaceMode: boolean;
  readonly showImpossibilityWarnings: boolean;
  readonly disabled: boolean;
  readonly onSelectActiveColor: (color: RulingColor) => void;
  readonly onCommitMove: (color: RulingColor) => void;
  readonly onToggleQuickPlaceMode: () => void;
  readonly onToggleWarnings: () => void;
}

const COLOR_LIST: readonly RulingColor[] = [0, 1, 2];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  activeColor,
  selectedVertexId,
  inspectedVertexId,
  inspectedCoord,
  inspectedIsUnadjudicated,
  implications,
  quickPlaceMode,
  showImpossibilityWarnings,
  disabled,
  onSelectActiveColor,
  onCommitMove,
  onToggleQuickPlaceMode,
  onToggleWarnings,
}) => {
  return (
    <section
      aria-label="Constitutional Ruling Chambers"
      className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-4 shadow-xl backdrop-blur-sm"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Constitutional Ruling Chambers (Pairwise Social Choice under IIA)
          </h2>
          <p className="text-xs text-slate-400">
            {selectedVertexId
              ? `Preference Profile (${selectedVertexId}) selected — adjudicate a pairwise ruling below or on the radial ring`
              : inspectedCoord
                ? `Inspecting Preference Profile (${inspectedCoord.join(', ')}) — live coalition & transitivity implications shown below`
                : quickPlaceMode
                  ? '1-Click Adjudication: select a active societal ruling below, then click any highlighted Open Profile'
                  : 'Radial Adjudication: click any highlighted Open Profile on the simplex, then choose its societal ruling'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="toggle-impossibility-warnings"
            onClick={onToggleWarnings}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              showImpossibilityWarnings
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle live Local Transitivity & Arrovian Cycle warnings when inspecting a profile"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>
              Cycle Warnings: {showImpossibilityWarnings ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleQuickPlaceMode}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              quickPlaceMode
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle between Radial Popover selection and 1-Click active ruling adjudication"
          >
            {quickPlaceMode ? (
              <>
                <MousePointerClick className="h-3.5 w-3.5" />
                <span>1-Click Adjudication: ON</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Radial Ring Picker: ON</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {COLOR_LIST.map((c) => {
          const meta = RULING_COLORS[c];
          const isSelected = activeColor === c;
          const imp = implications ? implications[c] : null;
          const warnsCycle =
            showImpossibilityWarnings &&
            inspectedIsUnadjudicated &&
            imp !== null &&
            !imp.isLocallyTransitive;

          const handleClick = () => {
            onSelectActiveColor(c);
            if (selectedVertexId && !disabled) {
              onCommitMove(c);
            }
          };

          return (
            <button
              key={c}
              type="button"
              disabled={disabled}
              onClick={handleClick}
              data-testid={`color-picker-btn-${c}`}
              className={`group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                disabled
                  ? 'cursor-not-allowed border-slate-800 bg-slate-900/40 opacity-50'
                  : warnsCycle
                    ? 'border-amber-500/60 bg-slate-900/80 hover:border-amber-400'
                    : isSelected
                      ? 'border-slate-200/80 bg-slate-800/95 shadow-lg ring-2 ring-indigo-400/40'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-11 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black text-slate-950 shadow-sm"
                    style={{
                      backgroundColor: meta.hexFill,
                      boxShadow: `0 0 12px ${meta.hexFill}66`,
                    }}
                  >
                    {meta.shortBadge}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-slate-100">
                        Ruling {meta.ruling}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      Empowers {meta.coalitionBlock} ({meta.coalitionRanking})
                    </span>
                  </div>
                </div>

                {selectedVertexId && !disabled ? (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-950">
                    Rule
                  </span>
                ) : isSelected ? (
                  <span className="rounded-md border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                    Active
                  </span>
                ) : null}
              </div>

              {/* Dynamic Arrovian Selection Implication for the Inspected/Selected Profile */}
              {imp && inspectedVertexId ? (
                <div
                  data-testid={`ruling-implication-${c}`}
                  className="mt-2.5 space-y-1.5 border-t border-slate-800/90 pt-2 text-[11px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-mono font-semibold text-slate-200">
                      Empowers {imp.coalitionBlock} {imp.voterRangeLabel} ({imp.splitLabel})
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                        imp.powerClassification === 'Majority Rule'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : imp.powerClassification === 'Split Tie-Break'
                            ? 'bg-sky-500/20 text-sky-300'
                            : imp.powerClassification ===
                                '1-Voter Dictator Override'
                              ? 'bg-rose-500/25 text-rose-200'
                              : imp.powerClassification ===
                                  'Unanimous Pareto Violation'
                                ? 'bg-rose-900/50 text-rose-300'
                                : 'bg-amber-500/20 text-amber-200'
                      }`}
                    >
                      {imp.powerClassification}
                    </span>
                  </div>

                  <div className="space-y-0.5 rounded-md border border-slate-800/90 bg-slate-950/75 px-2 py-1.5 font-mono text-[10px]">
                    <div
                      data-testid={`swf-output-constraint-${c}`}
                      className="text-slate-200"
                    >
                      {imp.swfOutputConstraint}
                    </div>
                    <div
                      data-testid={`swf-decisive-constraint-${c}`}
                      className="text-indigo-300"
                    >
                      {imp.decisiveCoalitionFormula}
                    </div>
                  </div>

                  {showImpossibilityWarnings && inspectedIsUnadjudicated && (
                    <div
                      className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-semibold ${
                        imp.isLocallyTransitive
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-200'
                      }`}
                    >
                      {imp.isLocallyTransitive ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                          <span>Locally Transitive</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />
                          <span>
                            Triggers Arrovian Cycle · Unmasks Voter #
                            {imp.pivotalDictatorVoter} as Dictator
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 space-y-1 border-t border-slate-800/80 pt-1.5 text-[11px] text-slate-400">
                  <div className="font-mono text-[10px] text-indigo-300">
                    {SWF_OUTPUT_CONSTRAINTS[c].outputSet}
                  </div>
                  <div>{meta.unanimousConstraint}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
