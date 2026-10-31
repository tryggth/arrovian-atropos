# SPEC: Arrovian Atropos PWA (Progressive Web App)

- **Document Version**: `0.4.1`
- **Target Agent**: `agy` (Google Antigravity CLI)
- **Source of Truth Notebook**: `Hidden Dictator Game` (`notebooks/2b675003-edce-43bf-91cd-5d0ee2c33f77`)

---

## 1. Executive Summary & High-Affordance Mental Model ("6 Friends Picking Dinner + 3-Way Tug-of-War")

**Arrovian Atropos** is an interactive, offline-capable Progressive Web App (PWA) that unifies **Burke & Teng's (2008) combinatorial game *Atropos*** with **Tanaka's / Sperner's topological proof of Arrow's Impossibility Theorem** using an immediately intuitive everyday mental model alongside formal Social Choice mathematics.

### 1.1 Why "6 Friends Picking Dinner + 3-Way Tug-of-War" (`BriefingBanner.tsx`)
Users immediately grasp:
1. **6 Friends (`V1 · Ada` through `V6 · Kenneth`) trying to pick 1 dinner winner** among 3 options:
   - 🔴 **● Pizza (`A`)** — Crimson Circle (`#f43f5e`)
   - 🟢 **■ Tacos (`B`)** — Emerald Square (`#10b981`)
   - 🔵 **▲ Sushi (`C`)** — Indigo Triangle (`#6366f1`)
2. **A 3-Way Tug-of-War Triangle Map**:
   - **Top Corner `(6, 0, 0)`**: All 6 friends want **● Pizza (`A`)** 1st $\implies$ **● Pizza (`A`) Wins!**
   - **Bottom-Left Corner `(0, 6, 0)`**: All 6 friends want **■ Tacos (`B`)** 1st $\implies$ **■ Tacos (`B`) Wins!**
   - **Bottom-Right Corner `(0, 0, 6)`**: All 6 friends want **▲ Sushi (`C`)** 1st $\implies$ **▲ Sushi (`C`) Wins!**
   - Moving 1 step toward a corner literally means **1 friend switches their vote toward that corner's dinner team**.

### 1.2 The 3 Dinner Teams (`VoterRosterBar.tsx` — Why Friends Share Rankings)
At any node $(k_0, k_1, k_2)$, the 6 friends split into the **3 Rock-Paper-Scissors Dinner Teams**:
- 🔴 **Team Pizza ($G_0$, $k_0$ friends)**: Rank `● Pizza ≻ ■ Tacos ≻ ▲ Sushi` ($A \succ B \succ C$). Ruling `● A≻C` crowns **● Pizza (`A`) Wins**.
- 🟢 **Team Tacos ($G_1$, $k_1$ friends)**: Rank `■ Tacos ≻ ▲ Sushi ≻ ● Pizza` ($B \succ C \succ A$). Ruling `■ B≻A` crowns **■ Tacos (`B`) Wins**.
- 🔵 **Team Sushi ($G_2$, $k_2$ friends)**: Rank `▲ Sushi ≻ ● Pizza ≻ ■ Tacos` ($C \succ A \succ B$). Ruling `▲ C≻B` crowns **▲ Sushi (`C`) Wins**.
- When `activeCoord === null` (initial idle state), `VoterRosterBar.tsx` shows the 6 friends with their live Dictator Radar status (`⚠️ ARMED DICTATOR`, `🔍 SUSPECT`, `✅ CLEARED`) and prompts the player to hover or click any node $(k_0, k_1, k_2)$.
- When `activeCoord = [k₀, k₁, k₂]` is active, `VoterRosterBar.tsx` groups the 6 friends into the **3 Dinner Team containers** (`Team Pizza (Bloc G₀)`, `Team Tacos (Bloc G₁)`, `Team Sushi (Bloc G₂)`), showing `"0 Friends on this team"` when $k_i = 0$.

### 1.3 Why the Outer Border Eliminates One Option (Unanimity in Plain English)
- **Bottom Edge ($k_0 = 0$, 0 friends on Team Pizza)**: Every friend is on Team Tacos or Team Sushi, so **all 6 friends prefer ▲ Sushi (`C`) over ● Pizza (`A`)**. Therefore **● Pizza (`A`) is eliminated** on the bottom edge (Unanimity forbids `0: A ≻ C`).
- **Right Edge ($k_1 = 0$, 0 friends on Team Tacos)**: All 6 friends prefer **● Pizza (`A`) over ■ Tacos (`B`)**, so **■ Tacos (`B`) is eliminated** on the right edge (Unanimity forbids `1: B ≻ A`).
- **Left Edge ($k_2 = 0$, 0 friends on Team Sushi)**: All 6 friends prefer **■ Tacos (`B`) over ▲ Sushi (`C`)**, so **▲ Sushi (`C`) is eliminated** on the left edge (Unanimity forbids `2: C ≻ B`).

### 1.4 The Explicit Two-Beat Turn Logic ("Step 1: The What-If Shift" + "Step 2: Pick the Tie-Breaker Winner") (`v0.4.1`)
To prevent any confusion about *why* the player steps toward a corner AND independently picks a winning team, every turn is explicitly presented as a **2-Step Cause-and-Effect Prompt** (`describeVoterShift(prevCoord, nextCoord)`) whenever a legal node is hovered or clicked:
1. **Step 1 (The Input Shift — How the Vote Changed)**:
   - **On the opening move (or a Deadlock Jump)**:
     `Step 1: 6 Friends split (k₀, k₁, k₂) across Pizza, Tacos & Sushi (3-Way Tie)`
   - **On any adjacent step ($k = 1$ from `lastMove`)**:
     `Step 1: Friend #d (Name) switched Team X → Team Y · Split (k₀, k₁, k₂)` (5 friends kept the exact same vote; still a 3-way tie!).
2. **Step 2 (The Output Decision — Your Tie-Breaker Choice)**:
   - `Step 2: Now pick who wins this 3-way tie:`
   - Explicitly notes that even though 1 friend switched teams (`Team Pizza` / `Team Tacos` / `Team Sushi`), the group is still in a 3-way Rock-Paper-Scissors tie and you can pick *any* of the 3 winners to avoid creating a 3-winner Dictator Triangle.
3. **Section 2.1 — Two-Step Header Callout on Radial Popover (`LatticeBoard.tsx`) & `ColorPicker.tsx`**:
   - When a legal node `selectedVertex` is clicked on `LatticeBoard.tsx`, renders a floating SVG header pill (`data-testid="radial-two-step-callout"`) directly above the radial ring displaying `Step 1` (`radial-step-1-text`) and `Step 2` (`radial-step-2-text`).
   - Mirrors this exact `Step 1` / `Step 2` banner (`data-testid="two-step-tiebreaker-banner"`) at the top of `ColorPicker.tsx` whenever a node is selected or hovered.

---

## 2. Complete Arrow's Theorem Terminology Standard (Mandatory UI Lexicon)

All UI copy, badges, tooltips, radial popovers, and panels MUST use **Social Choice / Arrow's Impossibility Theorem terminology** rather than raw graph-theory or generic color jargon:

| Legacy / Graph Term | Mandatory Arrow's Theorem UI Term |
| :--- | :--- |
| `Voters (n)` / `playable nodes` | **Electorate ($n$ Voters)** · **Open Preference Profiles** |
| `Seed` | **Boundary Seed** (Click to Randomize Border & Restart) |
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
| `Simplex Vertex Telemetry` | **Electorate Profile & SWF Constraint Inspector** |

### 2.1 One-Click Boundary Seed Button (Randomize Border & Restart)
- The **Seed** determines the deterministic pseudo-random pre-coloring of the outer Unanimity/Pareto boundary edges.
- In `HeaderControls.tsx`, the **Seed** control is a **single-click interactive button** (`🎲 Border Seed: {seed} · New Border`):
  - Clicking anywhere on the Seed button immediately generates a fresh random seed, randomizes the Unanimity boundary pre-coloring, and restarts the game at Step 1.
  - The separate **Reset** button restarts the current game from Step 1 while keeping the *same* boundary seed.

---

## 3. Arrovian Selection Implications & Algebraic Constraints on $F$

When a user clicks or hovers over a profile $v = (k_0, k_1, k_2)$, the **Radial Selection Popover**, the **Constitutional Ruling Chambers**, and the **Electorate Profile & SWF Constraint Inspector** dynamically compute and display the **exact Arrovian implications and algebraic constraints on the Social Welfare Function $F: \mathcal{L}(A)^n \to \mathcal{L}(A)$**.

### 3.1 Ordered Electorate Voter-ID Partition at Profile $(k_0, k_1, k_2)$
At profile $v = (k_0, k_1, k_2)$ with $k_0 + k_1 + k_2 = n$, the ordered electorate $V = \{\#1, \#2, \dots, \#n\}$ is partitioned into three contiguous voter blocks:
- **Block $G_0(v) = \{\#1, \dots, \#k_0\}$** ($\emptyset$ if $k_0 = 0$): votes $A \succ B \succ C$ *(only voters ranking $A \succ C$)*.
- **Block $G_1(v) = \{\#(k_0 + 1), \dots, \#(k_0 + k_1)\}$** ($\emptyset$ if $k_1 = 0$): votes $B \succ C \succ A$ *(only voters ranking $B \succ A$)*.
- **Block $G_2(v) = \{\#(k_0 + k_1 + 1), \dots, \#n\}$** ($\emptyset$ if $k_2 = 0$): votes $C \succ A \succ B$ *(only voters ranking $C \succ B$)*.
- The right-hand **Electorate Profile & SWF Constraint Inspector** displays the exact voter ID range for each block (e.g., `G₀: {#1}`, `G₁: {#2, #3}`, `G₂: {#4..#6}`).

### 3.2 Coalition & Majority/Minority Implication at Profile $(k_0, k_1, k_2)$
- **Ruling `A ≻ C` (Rose/Crimson)**:
  - **Supporting Coalition**: Block $G_0(v)$ ($k_0$ voters) vs. Opposing $G_1 \cup G_2$ ($n - k_0$ voters).
  - **Arrovian Implication Badge**:
    - If $k_0 > n - k_0$: `Majority Rule (${k_0} vs ${n - k_0})`
    - If $k_0 === n - k_0$: `Split Tie-Break (${k_0} vs ${n - k_0})`
    - If $k_0 === 1$: `1-Voter Dictator Override (1 vs ${n - 1})`
    - If $1 < k_0 < n - k_0$: `Minority Override (${k_0} vs ${n - k_0})`
- **Ruling `B ≻ A` (Emerald)**:
  - **Supporting Coalition**: Block $G_1(v)$ ($k_1$ voters) vs. Opposing $G_0 \cup G_2$ ($n - k_1$ voters).
- **Ruling `C ≻ B` (Indigo)**:
  - **Supporting Coalition**: Block $G_2(v)$ ($k_2$ voters) vs. Opposing $G_0 \cup G_1$ ($n - k_2$ voters).

### 3.3 Explicit Constraints on the Social Welfare Function $F$
Coloring a profile $v = (k_0, k_1, k_2)$ with ruling $c \in \{0, 1, 2\}$ places two explicit mathematical constraints on $F$, displayed on the **Ruling Cards (`ColorPicker.tsx`)** and in the **Inspector Panel**:
1. **Pointwise Output Constraint on $F(P(v)) \in \mathcal{L}(\{A, B, C\})$ (Out of $3! = 6$ Strict Rankings)**:
   - **Ruling $A \succ C$ (`0`)**: Constrains $F(P(v)) \in \{A \succ B \succ C,\; A \succ C \succ B,\; B \succ A \succ C\}$ (eliminates the 3 rankings where $C \succ A$).
   - **Ruling $B \succ A$ (`1`)**: Constrains $F(P(v)) \in \{B \succ C \succ A,\; C \succ B \succ A,\; B \succ A \succ C\}$ (Tanaka disjoint partition: $F(P(v)) \in \{B \succ C \succ A,\; C \succ B \succ A\}$).
   - **Ruling $C \succ B$ (`2`)**: Constrains $F(P(v)) \in \{C \succ A \succ B,\; C \succ B \succ A,\; A \succ C \succ B\}$ (Tanaka disjoint partition: pins $F(P(v)) = C \succ A \succ B$).
2. **IIA Decisive Coalition & Dictator Constraint ($D_G(x, y)$)**:
   - **Ruling $A \succ C$ (`0`)**: Forces $D_{G_0(v)}(A, C) \to d \in \{\#1 \dots \#k_0\}$.
   - **Ruling $B \succ A$ (`1`)**: Forces $D_{G_1(v)}(B, A) \to d \in \{\#(k_0+1) \dots \#(k_0+k_1)\}$.
   - **Ruling $C \succ B$ (`2`)**: Forces $D_{G_2(v)}(C, B) \to d \in \{\#(k_0+k_1+1) \dots \#n\}$.

### 3.4 Local Transitivity / Dictator Implication Preview
For the selected (or hovered) legal profile $v = (k_0, k_1, k_2)$, evaluate each candidate ruling $c \in \{0, 1, 2\}$ against the (up to 6) incident Voter-Shift Triads:
1. **Case 1 — Locally Transitive (Safe Precedent)**: No incident triad completes $\{A \succ C, B \succ A, C \succ B\}$.
2. **Case 2 — Triggers Arrovian Impossibility (Fatal Cycle / Dictator)**: Completing ruling $c$ at $v$ forms $m \ge 1$ panchromatic Arrovian Paradox Triads with already-adjudicated neighbors, immediately creating the cycle $A \succ C \succ B \succ A$ and unmasking a **Pivotal Dictator Voter $d$**.

---

## 4. "The Dictator Reveal" & Live "Possible Dictators" Radar (`arrowProof.ts`)

### 4.1 Post-Mortem When an Arrovian Paradox Triad Is Completed
When an Arrovian Paradox Triad $\{v^{(0)}, v^{(1)}, v^{(2)}\}$ is formed (ending the puzzle):
1. **Intransitive Condorcet Cycle Breakdown**:
   - Display the 3 adjacent profiles $v^{(0)}$ (ruled `A ≻ C`), $v^{(1)}$ (ruled `B ≻ A`), and $v^{(2)}$ (ruled `C ≻ B`), showing how a single-voter shift between them traps society in $A \succ C \succ B \succ A$.
2. **Pivotal Dictator Voter Extraction ($d$)**:
   - Identify the exact **Voter Index $d = \max_{u \in \tau} k_0(u) \in \{1, \dots, n\}$** whose individual preference shift reversed the entire society's ranking between $A$ and $C$.

### 4.2 Live "Possible Dictators" Toggle & Radar (At Any Stage of Play)
At any stage before a paradox triad is completed, Sperner's Lemma guarantees that the remaining uncolored interior profiles still harbor at least one unavoidable Pivotal Dictator $d \in \{1, \dots, n\}$.
- **Header Toggle Button (`Possible Dictators`)**:
  - A toggle button in `HeaderControls.tsx` (`showPossibleDictators`) that turns on the **Possible Dictators Radar** across the board and sidebar.
- **Triad & Voter Classification at Any Intermediate State**:
  - Every Voter-Shift Triad $\tau$ has a canonical associated **Pivotal Voter Index $d(\tau) = \max_{u \in \tau} k_0(u) \in \{1, \dots, n\}$**.
  - At any board state, each triad $\tau$ is classified into:
    1. **Eliminated Triad (`'eliminated'`, Safe / Monochrome-Locked)**: $\tau$ already has $\ge 2$ vertices with the *same* ruling, so $\tau$ can *never* become a `{0, 1, 2}` Paradox Triad.
    2. **Armed Triad (`'armed'`, Imminent Dictator Trap)**: $\tau$ has exactly $2$ adjudicated vertices with *distinct* rulings and $1$ unadjudicated interior vertex. If the open vertex receives the missing 3rd ruling, Voter $d(\tau)$ is immediately unmasked as the Dictator.
    3. **Latent Triad (`'latent'`, Open)**: $\tau$ has $0$ or $1$ adjudicated vertices; Voter $d(\tau)$ can still be unmasked here in $2+$ moves.
    4. **Paradox Triad (`'paradox'`)**: All 3 vertices of $\tau$ have distinct rulings `{0, 1, 2}`.
  - For every unadjudicated interior vertex $v$, compute its **Safe Ruling Set** $S(v) \subseteq \{0, 1, 2\}$:
    - **Unconstrained ($|S(v)| = 3$)**: All 3 rulings are currently locally transitive.
    - **Constrained ($|S(v)| \in \{1, 2\}$)**: 1 or 2 rulings immediately unmask a dictator.
    - **Inevitable Dictator Trap ($|S(v)| = 0$)**: All 3 rulings $\{0, 1, 2\}$ at $v$ complete an Armed Triad!
- **Visualizing Possible Dictators When Toggled ON**:
  1. **On `LatticeBoard.tsx`**:
     - **Eliminated Triads** are dimmed so only viable dictator regions remain prominent.
     - **Armed Triads** are outlined in dashed amber/rose and display their candidate dictator label `d=#k` at the triad centroid.
     - **Constrained & Trap Profiles ($|S(v)| < 3$)**: Display color-coded threat pips around the uncolored node showing which rulings are blocked, or a pulsing `TRAP` badge if $|S(v)| = 0$.
     - Hovering a specific `Voter #d` in the sidebar highlights all viable/armed triads on the lattice belonging to Voter `#d`.
  2. **In Sidebar (`PossibleDictatorsPanel.tsx`)**:
     - Displays all $n$ voters (`Voter #1` … `Voter #n`) with their live status badge (`ARMED`, `VIABLE`, `CLEARED`, `UNMASKED`), armed/latent triad counts, and open trigger profiles.

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
