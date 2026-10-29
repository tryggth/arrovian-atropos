# GEMINI.md — Arrovian Atropos PWA Architectural & Mathematical Rules

## 1. Project Identity & Pedagogical Mission
**Arrovian Atropos** is an offline-capable Progressive Web App (PWA) unifying **Burke & Teng's (2008) PSPACE-complete combinatorial game *Atropos*** with **Tanaka's / Sperner's topological proof of Arrow's Impossibility Theorem**.
- **Source of Truth Notebook**: `Hidden Dictator Game` (`2b675003-edce-43bf-91cd-5d0ee2c33f77`), synced locally in `@SPEC.md`.
- **Semantic Versioning**: Follow strict milestone discipline (`v0.1.0` -> `v0.2.0` -> `v0.3.0` -> `v0.4.0+`). Keep `package.json` version and the UI version badge synchronized with the active milestone (currently **`v0.2.0`**).

---

## 2. Core Mathematical & Game-Theoretic Invariants

1. **Barycentric Simplex Lattice $\Delta^2_n$ (Electorate Preference Space)**:
   - Electorate size $n \in \{4, 5, 6, 7, 8, 10, 12\}$ (default $n = 6$); engine supports any integer $n \in [4, 12]$.
   - Every Preference Profile is an integer triple $(k_0, k_1, k_2) \in \mathbb{Z}_{\ge 0}^3$ satisfying $k_0 + k_1 + k_2 = n$.
   - **Total profiles**: $\frac{(n+1)(n+2)}{2}$.
   - **Divided Electorate Profiles (playable interior, $k_0 \ge 1, k_1 \ge 1, k_2 \ge 1$)**: $\frac{(n-1)(n-2)}{2}$.
   - **Pareto Boundary Profiles** (at least one $k_i = 0$): $3n$.
   - **Voter-Shift Triads (elementary triangles)**: $n^2$ total ($\Delta$ upward and $\nabla$ downward).
   - **Single-Voter Shift Adjacency (6-Regular)**: $d(u, v) = 1 \iff \sum_{i=0}^2 |k_i - k'_i| = 2$.

2. **Arrovian Interpretation & Pairwise Rulings (Mandatory UI Lexicon)**:
   - Block $G_0$ ($k_0$ voters): $A \succ B \succ C$
   - Block $G_1$ ($k_1$ voters): $B \succ C \succ A$
   - Block $G_2$ ($k_2$ voters): $C \succ A \succ B$
   - **Ruling `A ≻ C` (`0`, Crimson)**: Empowers $G_0$ ($k_0$ vs $n-k_0$). Forbidden on Pareto boundary $k_0 = 0$. Node badge: `A≻C` (no `0:` prefix).
   - **Ruling `B ≻ A` (`1`, Emerald)**: Empowers $G_1$ ($k_1$ vs $n-k_1$). Forbidden on Pareto boundary $k_1 = 0$. Node badge: `B≻A` (no `1:` prefix).
   - **Ruling `C ≻ B` (`2`, Indigo)**: Empowers $G_2$ ($k_2$ vs $n-k_2$). Forbidden on Pareto boundary $k_2 = 0$. Node badge: `C≻B` (no `2:` prefix).

3. **Random Unanimity (Pareto) Boundary Pre-Coloring & Corner-Tip Safeguard**:
   - Unanimous Electorate Corners are fixed: $(n, 0, 0) \mapsto 0$ (`A≻C`), $(0, n, 0) \mapsto 1$ (`B≻A`), $(0, 0, n) \mapsto 2$ (`C≻B`).
   - Pareto Boundary Edges $k_i = 0$ forbid Ruling $i$ and randomly select from the two remaining rulings using a deterministic seeded PRNG (`src/engine/prng.ts`).
   - **Corner-Tip Non-Rainbow Safeguard (Critical Invariant)**:
     - Top tip $((n-1, 1, 0), (n-1, 0, 1)) \in \{(0, 0), (0, 2), (1, 0)\}$ (excludes $(1, 2)$).
     - Bottom-Left tip $((1, n-1, 0), (0, n-1, 1)) \in \{(1, 1), (1, 2), (0, 1)\}$ (excludes $(0, 2)$).
     - Bottom-Right tip $((1, 0, n-1), (0, 1, n-1)) \in \{(2, 2), (2, 1), (0, 2)\}$ (excludes $(0, 1)$).
     - Guarantees **zero** Arrovian Paradox Triads $\{0, 1, 2\}$ exist at Turn 0.

4. **Game Modes, Locality ($k = 1$ Single-Voter Shift + Deadlock Jump) & Termination**:
   - **Default Mode — Solo Constitutional Puzzle (`'solo'`)**: A single *Constitutional Architect* adjudicates Divided Electorate Profiles step-by-step via Single-Voter Shifts ($k=1$ + Deadlock Jump), maximizing `Adjudicated Profiles / Total Divided Profiles` before Arrow's Impossibility Theorem inevitably traps the constitution.
   - **Secondary Mode — 2-Player Duel (`'duel'`)**: *Constitutional Architect* (Player 1) and *Social Choice Skeptic* (Player 2) alternate turns.
   - **Arrovian Paradox Triad Termination**: Immediately after adjudicating a profile $v$, if any incident Voter-Shift Triad has all three rulings $\{A \succ C, B \succ A, C \succ B\}$, the constitution collapses into an intransitive Condorcet cycle $A \succ C \succ B \succ A$ and unmasks a Pivotal Dictator Voter $d \in \{1 \dots n\}$.

---

## 3. Directory Layout, UI & PWA Auto-Update Rules
- **Stack**: Vite + React 19 + TypeScript (strict mode) + Tailwind CSS + `vite-plugin-pwa` + Vitest.
- **Hover Node Enlargement**: Hovering over any profile on the SVG lattice must bring that profile to the top of the SVG render order and enlarge both its circle and internal typography so its ruling (`A≻C`, `B≻A`, `C≻B`) and coordinate `(k₀,k₁,k₂)` are clearly legible across all electorate sizes $n \in \{4..12\}$.
- **Source-Driven PWA Auto-Update & Automatic Version Bumping**:
  - `scripts/bump-version.js` and `.githooks/pre-commit` (`git config core.hooksPath .githooks`) automatically increment the patch version in `package.json` and regenerate `public/version.json` on every commit.
  - `update-sw-version.js` and `vite.config.ts` generate `public/version.json` from `package.json` (`version`, `buildVersion`, `commitSha`, `buildNumber`, `timestamp`).
  - `vite.config.ts` sets `base: process.env.GITHUB_PAGES === 'true' ? '/arrovian-atropos/' : '/'` and configures `vite-plugin-pwa` (`scope: base`, `start_url: base`) for GitHub Pages deployment via `.github/workflows/deploy.yml`.
  - `src/hooks/useAppUpdate.ts` polls `./version.json?t=...` (`cache: 'no-store'`) and checks Service Worker registration on load, every 20s, and on window `focus`/`online`. When a new source version is detected, the local PWA automatically clears outdated caches, sends `SKIP_WAITING`, and reloads.
- **Layout**:
  ```text
  src/
    engine/
      barycentric.ts    # Coordinate math, adjacency, Voter-Shift Triads, Random Unanimity boundaries
      prng.ts           # Deterministic seeded PRNG (xmur3 + mulberry32)
      gameState.ts      # Solo Puzzle & 2P Duel state reducer, Single-Voter Shift + Deadlock Jump, termination
      arrowProof.ts     # Coalition vote splits, Power classifications, Local Transitivity & Pivotal Voter d
      ai.ts             # (v0.3.0) Heuristic Safe-Move AI & Minimax/Nimber (*) AI
    hooks/
      useAppUpdate.ts   # Live version.json polling & Service Worker auto-update hook
    components/
      LatticeBoard.tsx  # Interactive SVG simplex with Pareto labels, hover magnification & Pill Radial Popover
      ColorPicker.tsx   # Constitutional Ruling Chambers with live coalition & transitivity implications
      HeaderControls.tsx# Mode selector (Solo/Duel), Electorate (n), Constitution Seed, Reset, v0.2.0 badge
      InspectorPanel.tsx# Electorate Profile & Pairwise Tally Inspector with visual vote bars
      DictatorModal.tsx # "Dictator & Cycle Unmasked" mathematical post-mortem panel
    __tests__/
      engine.test.ts    # Unit tests for combinatorics, Turn 0 safeguard, Solo/Duel modes, arrowProof, UI
  ```

---

## 4. Mandatory Verification Commands & Crostini Environment
Before completing any task or version milestone, run both commands and ensure zero errors and zero warnings:
```bash
npm test
npm run build
```

### Chromebook Crostini Networking Rule
- This workspace runs inside a **Chromebook Crostini container** (`eth0` IP: `100.115.92.203`).
- Vite's `server.host` and `preview.host` are configured with `host: true` (`--host`) so the server binds to `0.0.0.0`.
- Whenever providing dev or preview server instructions to the user, **always check `hostname -I` and provide the exact Crostini IP URL**:
  - Dev Server: `http://100.115.92.203:5173/` (or `http://penguin.linux.test:5173/`)
  - Preview Server: `http://100.115.92.203:4173/`

---

## 5. Two-Tier Model Routing & Escalation Protocol (`Gemini-4-Argon-High` + `Gemini-3.8-Flash-High`)

This project enforces a strict **2-level sub-agent routing architecture** using only two model tiers:
- **Default Lead Agent**: `Gemini-4-Argon-High` (parent session / `Model: "inherit"`)
- **Worker Sub-Agent**: `Gemini-3.8-Flash-High` (`Model: "flash"` via `.agents/agents/flash-worker.md`)

### Tier Responsibilities
1. **Tier 1 (`Gemini-4-Argon-High` — Default Parent Session)**:
   - Reserved for `/plan` architectural design, core mathematical and social-choice proof algorithms (`src/engine/`), decomposing work into isolated verifiable units, and reviewing diffs.
2. **Tier 2 (`Gemini-3.8-Flash-High` via `flash-worker` sub-agent)**:
   - Default target for all component wiring (`src/components/`), Arrow's Theorem UI lexicon updates, Tailwind CSS styling, SVG layout adjustments, boilerplate, and Vitest test generation via `invoke_subagent` (`TypeName: "flash-worker"`, `Model: "flash"`).

### Mandatory Correctness Gate & Automatic Escalation
1. **Scoped Delegation & Verification Gate**:
   - Every `invoke_subagent` call to `flash-worker` **MUST** explicitly specify:
     a) The **exact files** to create or edit (strict file scope).
     b) The **mandatory verification command** to run before returning (`npx tsc --noEmit && npx vitest run`).
2. **Single-Retry Cap & Immediate Escalation**:
   - `flash-worker` (`Gemini-3.8-Flash-High`) is permitted **at most 1 self-fix retry** if its verification gate fails.
   - If `flash-worker` fails its verification gate after 1 retry, **immediately escalate** the task to `Gemini-4-Argon-High` (either by re-invoking with `Model: "inherit"` or completing the fix directly in the parent `Gemini-4-Argon-High` session).
