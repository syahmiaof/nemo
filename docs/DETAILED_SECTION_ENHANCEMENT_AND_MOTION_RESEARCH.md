# Nemo: Detailed Section-by-Section Analysis & Motion Architecture Research

This report documents a comprehensive analysis of every section in the **Nemo** personal productivity suite, demystifying all metrics for maximum user-friendliness, and synthesizing research on top GitHub animation libraries to elevate Nemo's signature motion design.

---

## Part 1: Section-by-Section Analysis & Friendly Demystification

Goal: **"Bila sekali pandang dah tahu term tu untuk apa — user-friendly, zero over-engineering."**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         NEMO APP ECOSYSTEM                               │
├───────────────┬───────────────────────────────┬──────────────────────────┤
│ Section       │ Purpose (What it does)        │ Plain-Language Labels    │
├───────────────┼───────────────────────────────┼──────────────────────────┤
│ 1. Overview   │ Daily executive dashboard     │ Done this week, Pending  │
│ 2. Tasks      │ Unified execution backlog     │ Today, Upcoming, Done    │
│ 3. Academics  │ Higher-ed coursework & units  │ Coursework, Deadlines    │
│ 4. Calendar   │ Unified temporal projection   │ Month, Week, Daily Agenda│
│ 5. Projects   │ High-level initiatives        │ Active, Milestones       │
│ 6. Goals      │ Long-term North Stars         │ Target Dates, Progress   │
│ 7. Insights   │ Local performance telemetry   │ Completion Velocity      │
│ 8. Settings   │ Local config, sync & backup   │ Account, Appearance, Data│
│ 9. Ask Nemo   │ On-device private assistant   │ Quick Intent Actions     │
└───────────────┴───────────────────────────────┴──────────────────────────┘
```

---

### 1. Overview (`/`)
* **Core Purpose**: The command center for the day. Gives instant situational awareness without cognitive overload.
* **Key Components**:
  - **Spark of Focus V2**: Fluid particle-morphing inspirational quote that keeps motivation fresh without distraction.
  - **Today's Focus (Max 3 Slots)**: Essential 3 tasks pinned for today to prevent burnout.
  - **Weekly Momentum Card**:
    - *Before*: Obscure labels like "Finished: 4", "Open: 6", "Study: 1". Users wondered: *"Open what? Open tabs? Open bugs?"*
    - *Now*: Clean, friendly terms:
      - **Done this week**: Tasks completed within the current 7-day cycle.
      - **Tasks pending**: To-dos currently remaining on your plate.
      - **Active projects**: Projects actively underway with open milestones.
      - **Coursework**: Upcoming study assignments and academic deadlines.
* **Enhancement Opportunity**:
  - Add micro-celebratory confetti when all 3 Today's Focus slots are checked off.

---

### 2. Tasks (`/tasks`)
* **Core Purpose**: Fast, low-friction task triage and daily execution.
* **Filter Views**:
  - `Today`: Due today or scheduled for today.
  - `Upcoming`: Scheduled for the next 7 days.
  - `Overdue`: Past due date requiring prompt attention.
  - `Done`: Completed tasks kept for reference.
* **Signature Motion**:
  - Celebratory checkmark spring morph and gentle row exit when completing an item.
  - Smooth sliding priority badges (`high`, `medium`, `low`).

---

### 3. Academics (`/academics`)
* **Core Purpose**: Academic semester tracking, subject syllabi, and assignment submission deadlines.
* **Terminology Demystification**:
  - *Semester*: Current study term (e.g., "Semester 1 2026").
  - *Subject*: Course or module (e.g., "CS101 - Algorithms").
  - *Assignment*: Homework, quiz, mid-term, or project with submission status (`pending`, `submitted`, `graded`).
* **Signature Motion**:
  - Staggered card entrance for assignment checklists and progress meters that fill smoothly.

---

### 4. Calendar (`/calendar`)
* **Core Purpose**: Unified timeline projection merging tasks, assignment deadlines, milestone dates, and standalone calendar events.
* **Zero Duplication**:
  - Tasks with due dates appear automatically without cloning records.
* **Views**:
  - Desktop: Month grid and Week timeline.
  - Mobile: Clean vertical agenda day-by-day feed.

---

### 5. Projects (`/projects`)
* **Core Purpose**: High-level initiative planning with milestone checkpoints.
* **Key Features**:
  - Visual cover cards, custom colors, and linked milestones.
  - Task progress derivation (calculated live from attached tasks).

---

### 6. Goals (`/goals`)
* **Core Purpose**: Long-term life targets and quarterly milestones (e.g., "Run a Half Marathon", "Learn Swift").
* **Key Features**:
  - Visual timeline tracks progress toward completion.
  - Milestone references without redundant data cloning.

---

### 7. Insights (`/insights`)
* **Core Purpose**: 100% client-side privacy-first productivity analytics.
* **Metrics Explained**:
  - *Task Completion Velocity*: Average completed tasks per day over 7 and 30-day rolling windows.
  - *Workload Balance*: Ratio of academic vs project vs ad-hoc tasks.
  - *Day-of-Week Distribution*: Reveals which days are most productive.

---

### 8. Settings (`/settings`)
* **Core Purpose**: Personalization, cloud sync toggle, and local workspace backups.
* **Mobile Enhancements Added**:
  - Horizontal swipeable capsule tab rail: `Account & Sync`, `Appearance`, `Workspace Data`, `Admin`.
  - Instant theme switching: `Midnight Navy`, `Ember Dark`, `Aurora Light`, and `Nordic Slate`.

---

### 9. Ask Nemo (`Ctrl+K` / Drawer)
* **Core Purpose**: 100% private, on-device assistant for quick queries (e.g., "What is due tomorrow?", "Add task Buy Milk").
* **Mobile Enhancements Added**:
  - Native notch & Dynamic Island safe area padding (`env(safe-area-inset-top)`).
  - 42x42px accessible tap target close button.

---

## Part 2: GitHub Motion Libraries Research & Recommendations

The user requested research on top GitHub motion and particle animation libraries to power Nemo's future animations without compromising the 60fps local-first benchmark.

### Comparison Matrix of Top Animation Libraries

| Library | GitHub Stars | Bundle Size (Gzip) | Performance / FPS | React Integration | Best Use Case in Nemo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GSAP 3** *(Current)* | 19k+ | ~28 kB core | ⭐⭐⭐⭐⭐ (60-120fps) | `@gsap/react` `useGSAP` | **Core Signature Engine**: Page transitions, particle morphing, scroll in/out, SVG paths |
| **Motion One / Motion** | 25k+ | ~3.8 kB (tiny!) | ⭐⭐⭐⭐⭐ (WAAPI native) | `motion/react` | **Lightweight Micro-interactions**: Buttons, pills, simple layout transitions |
| **Lenis (studio-freight)** | 10k+ | ~4.2 kB | ⭐⭐⭐⭐⭐ (virtual scroll) | Native hook | **Smooth Momentum Scrolling**: Butter-smooth inertial scrolling for desktop and tablet |
| **tsparticles / Canvas** | 14k+ | ~12 kB (modular) | ⭐⭐⭐⭐ (WebGL/Canvas) | `@tsparticles/react` | **Theme Aurora Starfield**: Floating dust, aurora starfield, galaxy particles |
| **Lucide Animated Icons** | Community | ~0.5 kB / icon | ⭐⭐⭐⭐⭐ (SVG CSS/WAAPI)| Native SVG | **Nav & Action Micro-states**: Checkmark bounce, bell ring, sync spinner |
| **OGL / Three.js** | 99k+ (Three) / 5k (OGL)| 140 kB+ (Heavy!) | ⭐⭐⭐ (Battery drain on mobile) | `@react-three/fiber` | ⚠️ **Not Recommended**: Too heavy for a fast, snappy productivity app |

### Strategic Recommendation for Nemo:
1. **Retain GSAP 3 as Master Director**:
   - GSAP provides unparalleled precision for timeline sequencing, SVG path morphing (`particleMorph.ts`), and bi-directional ScrollTrigger.
   - It is already fully integrated with clean memory management via `useGSAP`.
2. **Adopt Motion One / Native WAAPI for Small UI Elements**:
   - Use CSS variables + Web Animations API (WAAPI) for bottom nav pills and button presses to offload animations directly to the browser compositor thread.
3. **Keep Canvas Lightweight & Pure for Backgrounds**:
   - As implemented in `src/design/AuroraStarfield.tsx`, using native 2D Canvas with zero external dependencies yields a 60fps starfield with **0 kB added library weight**.
