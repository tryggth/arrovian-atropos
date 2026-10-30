# SPEC: Arrovian Atropos PWA (Progressive Web App)

- **Document Version**: `0.3.0`
- **Target Agent**: `agy` (Google Antigravity CLI)
- **Source of Truth Notebook**: `Hidden Dictator Game` (`notebooks/2b675003-edce-43bf-91cd-5d0ee2c33f77`)

---

## 1. Executive Summary & Player Narrative ("The Constitutional Architect's Briefing")

**Arrovian Atropos** is an interactive, offline-capable Progressive Web App (PWA) that unifies **Burke & Teng's (2008) combinatorial game *Atropos*** with **Tanaka's / Sperner's topological proof of Arrow's Impossibility Theorem**.

### 1.1 The Player's Mental Model & Narrative Briefing (`BriefingBanner.tsx`)
To ensure a first-time player immediately understands **who they are**, **what the board represents**, **why voters share ballots in 3 blocs**, and **why they must issue rulings**, the app features a clear, collapsible **"Constitutional Architect's Briefing"** card at the top of the workspace (plus a `? Briefing / Story` toggle button in `HeaderControls.tsx`):
1. **Your Role — The Constitutional Architect**:
   - You are drafting the **Constitution ($F$)** for a **6-Senator Council** (`V1 · Ada` through `V6 · Kenneth`) voting on 3 rival candidates: `● Atlas (A)`, `■ Boreas (B)`, and `▲ Cybele (C)`.
2. **What Each Node Is — A "What-If" Election Scenario $(k_0, k_1, k_2)$**:
   - The Senators do **not** have fixed ballots for the whole game. Instead, every circle $(k_0, k_1, k_2)$ on the triangular map is a **different possible election** where the 6 Senators split into **3 Voting Blocs (Factions)**:
     - **Bloc $G_0$ ($k_0$ Senators)**: Vote `●A ≻ ■B ≻ ▲C`
     - **Bloc $G_1$ ($k_1$ Senators)**: Vote `■B ≻ ▲C ≻ ●A`
     - **Bloc $G_2$ ($k_2$ Senators)**: Vote `▲C ≻ ●A ≻ ■B`
   - Because there are 6 Senators and only 3 Voting Blocs, Senators in the same bloc cast identical ballots at that node.
3. **Why the Border Is Pre-Colored — The Unanimity Rule**:
   - On the outer edges of the triangle, one bloc has **0 Senators** ($k_i = 0$). That means **all 6 Senators unanimously agree** on one pair of candidates (e.g., when $k_0 = 0$, all 6 Senators rank `▲C ≻ ●A`). A valid Constitution cannot violate a 6–0 unanimous vote, so the border elections are already settled.
4. **Why You Must Rule on the Interior — Breaking the Circular Tie**:
   - On every open interior node, all 3 blocs have at least 1 Senator, creating a **Rock-Paper-Scissors circular tie** (`●A ≻ ■B ≻ ▲C ≻ ●A`).
   - Clicking an open node and choosing one of the 3 **Rulings** (`●A ≻ ▲C`, `■B ≻ ●A`, or `▲C ≻ ■B`) cuts one link of the cycle, sides with that voting bloc, and crowns a winner for that election.
5. **How You Move & Why Arrow's Theorem Traps You**:
   - Each step moves to a **neighboring election** where **5 Senators keep the exact same ballot and just 1 Senator switches blocs** (**Single-Voter Shift**).
   - If you ever place all 3 different rulings around a single unit triangle (**Arrovian Paradox Triad**), your Constitution has contradicted itself across a 1-Senator shift—allowing **1 single Senator** to override the other 5 unchanging Senators and unmasking them as the **Hidden Dictator**!
   - By **Arrow's Impossibility Theorem** (and Sperner's Lemma), adjudicating 100% of the open elections without a Dictator is **mathematically impossible**. Your challenge: *How many elections can you adjudicate before the theorem corners you?*

### 1.2 Concrete 3-Candidate & 6-Voter Senate Visualization (`v0.3.0`)
To make it immediately obvious **WHO** the 3 candidates and $n=6$ voters are, **WHAT** circular deadlock is occurring at the selected node, **WHY** the Architect must rule, and **WHICH** voter is the Dictator:
1. **Concrete 3-Candidate System (Shape + Color + Name + Cycle-Breaking Meaning)**:
   - **Candidate A (`● Atlas` — Crimson Circle `#f43f5e`)**: Championed by Faction $G_0$ (`●A ≻ ■B ≻ ▲C`). Ruling `●A ≻ ▲C` breaks the cycle (`Cuts ▲C≻●A → ●A (Atlas) Wins`).
   - **Candidate B (`■ Boreas` — Emerald Square `#10b981`)**: Championed by Faction $G_1$ (`■B ≻ ▲C ≻ ●A`). Ruling `■B ≻ ●A` breaks the cycle (`Cuts ●A≻■B → ■B (Boreas) Wins`).
   - **Candidate C (`▲ Cybele` — Indigo Triangle `#6366f1`)**: Championed by Faction $G_2$ (`▲C ≻ ●A ≻ ■B`). Ruling `▲C ≻ ■B` breaks the cycle (`Cuts ■B≻▲C → ▲C (Cybele) Wins`).
   - Colored lattice nodes and radial choice pills render the geometric shape (`●`, `■`, `▲`) alongside the pairwise ruling.
2. **On-Board 6-Voter Senate Roster & 3-Bloc Faction Grouping (`VoterRosterBar.tsx` + `App.tsx`)**:
   - **Section 2.1 — Fixing the Initial / Unselected Roster State (`activeCoord === null`)**:
     - When `hoveredVertexId === null && selectedVertexId === null && gameState.lastMove === null`, `App.tsx` passes `activeCoord = null` (no silent `(2, 2, 2)` fallback).
     - `VoterRosterBar.tsx` displays the 6 Senators (`V1 · Ada` … `V6 · Kenneth`) with their live Possible Dictator Status (`⚠️ ARMED DICTATOR`, `🔍 SUSPECT`, `✅ CLEARED`) and a clear prompt: *"Hover or click any election node (k₀, k₁, k₂) below to inspect how the 6 Senators split into the 3 Voting Blocs (G₀, G₁, G₂) in that scenario."*
   - **Section 2.2 — Grouping Senators by the 3 Voting Blocs ($G_0, G_1, G_2$) When a Node Is Inspected**:
     - When `activeCoord = [k₀, k₁, k₂]` is active, `VoterRosterBar.tsx` visually groups the 6 Senators into **3 explicit Voting Bloc containers** (`Bloc G₀: k₀ Senators · ●A ≻ ■B ≻ ▲C`, `Bloc G₁: k₁ Senators · ■B ≻ ▲C ≻ ●A`, `Bloc G₂: k₂ Senators · ▲C ≻ ●A ≻ ■B`), showing `"0 Senators in this bloc"` when $k_i = 0$ on a border node.
     - Preserves individual Senator badges (`⚡ Flipped Ballot` when stepping from `lastMove`, and `👑 DICTATOR UNMASKED` / `⚠️ ARMED DICTATOR` / `🔍 SUSPECT` / `✅ CLEARED`).
3. **"Why You Must Rule" Election Deadlock Case Prompt (`ColorPicker.tsx`)**:
   - Displays a 2-line **"Election Deadlock Case"** summary banner above the 3 ruling cards when inspecting an open interior node (`The Problem` + `Your Job as Constitutional Architect`), and shows **Crowned Winner** + **Voters Empowered** (`Sides with V1 (1 voter) over V2–V6 (5 voters)`) on each Ruling Card and Radial Option.

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
