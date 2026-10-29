import React, { useState, useEffect } from 'react';
import { Dices, RotateCcw, Eye, Triangle, Sparkles, Radar } from 'lucide-react';
import { BOARD_SIZES } from '../engine/barycentric';

export interface HeaderControlsProps {
  readonly n: number;
  readonly seed: string;
  readonly showBadgesOnNodes: boolean;
  readonly showPossibleDictators: boolean;
  readonly possibleDictatorCount: number;
  readonly onTogglePossibleDictators: () => void;
  readonly appVersion?: string;
  readonly hasUpdate?: boolean;
  readonly latestVersion?: string | null;
  readonly onApplyUpdate?: () => void;
  readonly onChangeBoardSize: (n: number) => void;
  readonly onChangeSeed: (seed: string) => void;
  readonly onRandomizeSeed: () => void;
  readonly onResetBoard: () => void;
  readonly onToggleBadges: () => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  n,
  seed,
  showBadgesOnNodes,
  showPossibleDictators,
  possibleDictatorCount,
  onTogglePossibleDictators,
  appVersion = 'v0.2.0',
  hasUpdate = false,
  latestVersion = null,
  onApplyUpdate,
  onChangeBoardSize,
  onChangeSeed,
  onRandomizeSeed,
  onResetBoard,
  onToggleBadges,
}) => {
  const [seedDraft, setSeedDraft] = useState(seed);

  useEffect(() => {
    setSeedDraft(seed);
  }, [seed]);

  const handleSeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = seedDraft.trim() || 'arrow-1951';
    setSeedDraft(cleaned);
    onChangeSeed(cleaned);
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand & Version Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 shadow-inner">
            <Triangle className="h-5 w-5 fill-indigo-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-slate-100 sm:text-xl">
                Arrovian Atropos
              </h1>
              <span
                data-testid="version-badge"
                className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-indigo-300"
              >
                {appVersion}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Arrow&apos;s Impossibility &amp; Sperner&apos;s Lemma ·{' '}
              <span className="font-mono text-slate-300">Single-Voter Shift</span>{' '}
              Constitutional Game
            </p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Live Upgrade Button when new source version is detected */}
          {hasUpdate && onApplyUpdate && (
            <button
              type="button"
              onClick={onApplyUpdate}
              data-testid="pwa-upgrade-button"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-yellow-100 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-400/80 transition-all hover:scale-105 active:scale-95 animate-pulse"
              title="A new version of Arrovian Atropos is available at the source! Click to update immediately."
            >
              <Sparkles className="h-3.5 w-3.5 text-slate-950" />
              <span>
                UPGRADE {latestVersion ? `(${latestVersion})` : 'NOW'}
              </span>
            </button>
          )}


          {/* Electorate Size Selector (n) */}
          <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300">
            <span className="font-medium text-slate-400">
              Electorate (n Voters):
            </span>
            <select
              aria-label="Board size n"
              value={n}
              onChange={(e) => onChangeBoardSize(Number(e.target.value))}
              className="cursor-pointer bg-transparent font-mono text-xs font-semibold text-slate-100 focus:outline-none"
            >
              {BOARD_SIZES.map((size) => {
                const interiorCount = ((size - 1) * (size - 2)) / 2;
                return (
                  <option
                    key={size}
                    value={size}
                    className="bg-slate-900 text-slate-100"
                  >
                    n = {size} Voters ({interiorCount} Open Profiles)
                  </option>
                );
              })}
            </select>
          </label>

          {/* Deterministic Constitution Seed Input */}
          <form
            onSubmit={handleSeedSubmit}
            className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs"
          >
            <span className="mr-1.5 font-medium text-slate-400">
              Constitution Seed:
            </span>
            <input
              type="text"
              aria-label="Board seed"
              value={seedDraft}
              onChange={(e) => setSeedDraft(e.target.value)}
              onBlur={handleSeedSubmit}
              className="w-24 bg-transparent font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none sm:w-28"
              placeholder="arrow-1951"
            />
            <button
              type="button"
              onClick={onRandomizeSeed}
              title="Generate random constitution seed"
              className="ml-1 rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-indigo-300"
            >
              <Dices className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Accessible Profile Rulings Toggle */}
          <button
            type="button"
            onClick={onToggleBadges}
            title="Toggle societal ruling labels (A≻C, B≻A, C≻B) inside preference profiles"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showBadgesOnNodes
                ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200'
                : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Profile Rulings</span>
          </button>

          {/* Live Possible Dictators Radar Toggle */}
          <button
            type="button"
            data-testid="toggle-possible-dictators"
            onClick={onTogglePossibleDictators}
            title="Toggle Possible Dictators Radar across the simplex board and sidebar"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              showPossibleDictators
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-200 shadow-sm'
                : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:text-slate-100'
            }`}
          >
            <Radar className="h-3.5 w-3.5 text-amber-400" />
            <span>Possible Dictators ({possibleDictatorCount}/{n})</span>
          </button>

          {/* Reset Current Constitution */}
          <button
            type="button"
            onClick={onResetBoard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-600 hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
