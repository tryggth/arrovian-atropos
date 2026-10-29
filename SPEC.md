# SPEC: Arrovian Atropos PWA (Progressive Web App)

- **Document Version**: `0.2.1`
- **Target Agent**: `agy` (Google Antigravity CLI)
- **Source of Truth Notebook**: `Hidden Dictator Game` (`notebooks/2b675003-edce-43bf-91cd-5d0ee2c33f77`)

---

## 1. Executive Summary & Pedagogical Mission

**Arrovian Atropos** is an interactive, offline-capable Progressive Web App (PWA) that unifies **Burke & Teng's (2008) combinatorial game *Atropos*** with **Tanaka's / Sperner's topological proof of Arrow's Impossibility Theorem**.

### 1.1 Why a Solo Puzzle Mode + Optional 2-Player / Skeptic Mode?
- **The Core Arrovian Insight**: By Arrow's Impossibility Theorem (and Sperner's Lemma), if a **single Constitutional Architect** tries to adjudicate every divided preference profile on the board while respecting **Unanimity (Pareto)** on the boundary and **Independence of Irrelevant Alternatives (IIA)** locally, **it is mathematically impossible to complete the constitution without creating an intransitive Condorcet cycle / unmasking a Pivotal Dictator**.
- **Primary Mode — Solo Puzzle Mode ("The Constitutional Architect's Dilemma")**:
  - The user acts as a single **Constitutional Architect** stepping from profile to profile via **Single-Voter Shifts ($k=1$)**, trying to adjudicate as many divided preference profiles as possible without triggering a Condorcet Paradox or unmasking a Hidden Dictator.
  - Because Arrow's Theorem guarantees the puzzle has **no complete solution** (0% survival rate at 100% completion), the player experiences Arrow's Impossibility Theorem firsthand as safe rulings narrow down until a final profile forces a Dictator/Paradox under all 3 choices.
- **Secondary Mode — "Duel: Architect vs. Skeptic"**:
  - Because completion without a paradox is impossible, two players (or 1 Player vs. Skeptic AI in `v0.3.0`) can also play the adversarial impartial game where each turn forces the *other* agent into the inescapable Arrovian trap.

---

## 2. Complete Arrow's Theorem Terminology Standard (Mandatory UI Lexicon)

All UI copy, badges, tooltips, radial popovers, and panels MUST use **Social Choice / Arrow's Impossibility Theorem terminology** rather than raw graph-theory or generic color jargon:

| Legacy / Graph Term | Mandatory Arrow's Theorem UI Term |
| :--- | :--- |
| `Voters (n)` / `playable nodes` | **Electorate ($n$ Voters)** · **Open Preference Profiles** |
| `Seed` | **Constitution Seed** (Pre-colored Unanimity Boundary) |
| `Node` / `Vertex (k₀, k₁, k₂)` | **Preference Profile $(k_0, k_1, k_2)$** |
| `Interior Node` / `Uncolored` | **Divided Electorate Profile** · **Unadjudicated** |
| `Boundary Node (kᵢ = 0)` | **Pareto Boundary Profile** (One voter block absent; unanimous pair) |
| `Corner Node` | **Unanimous Electorate Corner** (All $n$ voters identical) |
| `Color 0` / `Crimson` / `0:A≻C` | **Ruling `A ≻ C`** · **Empowers $G_0$ ($k_0$ vs $n-k_0$)** |
| `Color 1` / `Emerald` / `1:B≻A` | **Ruling `B ≻ A`** · **Empowers $G_1$ ($k_1$ vs $n-k_1$)** |
| `Color 2` / `Indigo` / `2:C≻B` | **Ruling `C ≻ B`** · **Empowers $G_2$ ($k_2$ vs $n-k_2$)** |
| `k = 1 Adjacency` | **Single-Voter Shift** (1 voter changes preference block) |
| `Jump Rule Active` | **Deadlock Jump** (All adjacent shifts adjudicated; pick any open profile) |
| `Elementary Triangle (\Delta / \nabla)` | **Voter-Shift Triad** (3 profiles differing by 1 voter) |
| `Rainbow Triangle {0, 1, 2}` | **Arrovian Paradox Triad** ($A \succ C \succ B \succ A$ Cycle & Pivotal Dictator) |
| `Move Log` | **Constitutional Precedent Log** |
| `Simplex Vertex Telemetry` | **Electorate Profile & Pairwise Tally Inspector** |

---

## 3. Arrovian Selection Implications on Radial Popover & Ruling Palette (`v0.2.0` Core Feature)

When a user clicks an unadjudicated profile $v = (k_0, k_1, k_2)$, the **Radial Selection Popover** on the lattice board and the **Constitutional Ruling Chambers** below the board dynamically compute and display the **exact Arrovian implications** of choosing each of the 3 rulings at that specific profile $(k_0, k_1, k_2)$:

### 3.1 Coalition & Majority/Minority Implication at Profile $(k_0, k_1, k_2)$
At profile $v = (k_0, k_1, k_2)$ with $k_0 + k_1 + k_2 = n$:
- **Ruling `A ≻ C` (Rose/Crimson)**:
  - **Supporting Coalition**: Block $G_0$ ($A \succ B \succ C$) with **$k_0$ voters**.
  - **Opposing Coalition**: Blocks $G_1 \cup G_2$ (who both rank $C \succ A$) with **$n - k_0$ voters**.
  - **Arrovian Implication Badge**:
    - If $k_0 > n - k_0$: `Majority Rule (${k_0} vs ${n - k_0})`
    - If $k_0 === n - k_0$: `Split Tie-Break (${k_0} vs ${n - k_0})`
    - If $k_0 === 1$: `1-Voter Dictator Override (1 vs ${n - 1})`
    - If $1 < k_0 < n - k_0$: `Minority Override (${k_0} vs ${n - k_0})`
- **Ruling `B ≻ A` (Emerald)**:
  - **Supporting Coalition**: Block $G_1$ ($B \succ C \succ A$) with **$k_1$ voters** vs. Opposing $G_0 \cup G_2$ with **$n - k_1$ voters**.
- **Ruling `C ≻ B` (Indigo)**:
  - **Supporting Coalition**: Block $G_2$ ($C \succ A \succ B$) with **$k_2$ voters** vs. Opposing $G_0 \cup G_1$ with **$n - k_2$ voters**.

### 3.2 Local Transitivity / Dictator Implication Preview
For the selected (or hovered) legal profile $v = (k_0, k_1, k_2)$, evaluate each candidate ruling $c \in \{0, 1, 2\}$ against the (up to 6) incident Voter-Shift Triads:
1. **Case 1 — Locally Transitive (Safe Precedent)**: No incident triad completes $\{A \succ C, B \succ A, C \succ B\}$.
2. **Case 2 — Triggers Arrovian Impossibility (Fatal Cycle / Dictator)**: Completing ruling $c$ at $v$ forms $m \ge 1$ panchromatic Arrovian Paradox Triads with already-adjudicated neighbors, immediately creating the cycle $A \succ C \succ B \succ A$ and unmasking a **Pivotal Dictator Voter $d$**.

---

## 4. "The Dictator Reveal" Mathematical Post-Mortem (`arrowProof.ts` & `DictatorModal.tsx`)

When an Arrovian Paradox Triad $\{v^{(0)}, v^{(1)}, v^{(2)}\}$ is formed (ending the puzzle or duel):
1. **Intransitive Condorcet Cycle Breakdown**:
   - Display the 3 adjacent profiles $v^{(0)}$ (ruled `A ≻ C`), $v^{(1)}$ (ruled `B ≻ A`), and $v^{(2)}$ (ruled `C ≻ B`), showing how a single-voter shift between them traps society in $A \succ C \succ B \succ A$.
2. **Pivotal Dictator Voter Extraction ($d$)**:
   - Along the edge between $v^{(0)}$ (`A ≻ C`) and $v^{(1)}$ (`B ≻ A`, where transitivity with $v^{(2)}$'s `C ≻ B` requires `C ≻ A`), only **one single voter** moved between Condorcet blocks:
   - Identify the exact **Voter Index $d \in \{1, \dots, n\}$** whose individual preference shift reversed the entire society's ranking between $A$ and $C$.

---

## 5. GitHub Repository, CI/CD & Automatic PWA Version-Bump Architecture

To match the established `agy` deployment pattern used across sibling PWA projects (`triarch`, `rummikube`, `bourbakimesh`, `hex`):
1. **GitHub Repository & GitHub Pages Hosting**:
   - Hosted in a dedicated GitHub repository (`arrovian-atropos`) and deployed automatically to GitHub Pages via GitHub Actions (`actions/deploy-pages`).
   - Vite `base` path and PWA manifest (`scope` and `start_url`) dynamically match the GitHub Pages base path (`/arrovian-atropos/`) in production builds while remaining `/` in local dev/test.
2. **Automatic Version Bumping on Every Push / Commit**:
   - Every pushed commit automatically increments the app's version via `.githooks/pre-commit` + `scripts/bump-version.js` and CI build stamping in `update-sw-version.js` (`public/version.json` & `package.json` sync).
   - Installed PWA clients poll `version.json` (with `cache: 'no-store'`) and listen to Service Worker updates via `useAppUpdate.ts`, surfacing the prominent `UPGRADE` button in `HeaderControls` (or auto-updating) whenever a newer version is deployed to GitHub Pages.
3. **GitHub Actions CI/CD Pipeline (`.github/workflows/deploy.yml`)**:
   - Triggers on push to `main` (and `workflow_dispatch`).
   - Runs strict TypeScript verification (`npx tsc --noEmit`), full Unit & Integration Test suites (`npm test`), builds the production PWA bundle (`npm run build`) with the bumped version metadata, and deploys the artifact to GitHub Pages.

---

## 6. Versioned Implementation Roadmap

- **Milestone `v0.1.0` — Core Playable Arrovian Atropos PWA** *(Completed)*
  - Triangulated simplex lattice $\Delta^2_n$, seeded Random Unanimity boundary with corner-tip safeguard, $k=1$ locality + Jump Rule, PWA service worker.
- **Milestone `v0.2.0` / `v0.2.1` — Solo Constitutional Puzzle Mode, Full Arrow Lexicon, Implication Engine & GitHub Pages CI/CD** *(Current Target)*
  - Solo Constitutional Puzzle Mode (Default) + 2-Player Duel Toggle.
  - Full Arrow's Theorem Terminology Overhaul.
  - Arrovian Implication Radial Picker & Palette.
  - Live Pairwise Tally Inspector & Dictator Reveal Post-Mortem.
  - GitHub Repo, Auto-Version-Bump on Push & GitHub Pages CI/CD Deployment.
- **Milestone `v0.3.0` — Skeptic AI Opponent, Undo/Scrubber & Shareable URLs**
  - Heuristic & Minimax/Nimber ($*$) Skeptic AI, move history timeline scrubber, URL state sharing.
- **Milestone `v0.4.0+` — Voting Rule Sandbox & Sibling Games**
  - Auto-color the board by Plurality, Borda, or Dictator $\pi_d$; *Star of Arrow* (10-Cell Pentagram Game) and *Oracle Bisection Game*.
