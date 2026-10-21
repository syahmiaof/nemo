# Nemo Sprint 6: Spark of Focus & Profile Quick Menu Implementation Report

## Executive Summary
This document details the production engineering and delivery of **Nemo Sprint 6: Enchanted Typography & Overview Experience**, along with the **Header Profile Quick Menu** and desktop navigation refinement.

---

## Architecture & Component Breakdown

### 1. `ProfileQuickMenu.tsx` (`src/components/ui/ProfileQuickMenu.tsx`)
- **Avatar Sizing & Ring**: 42px avatar button with responsive sizing, subtle double glass border ring, and live status pip (`bg-accent-mint` for up-to-date/signed-in, pulsating amber for syncing).
- **Glass Popover Architecture**: Clicking the avatar opens an accessible, non-disruptive dropdown popover (`role="dialog"`) with `backdrop-blur-xl`.
- **Integrated Capabilities**:
  - **Cloud Sync Trigger**: Directly connects to `useSync()` hook to trigger immediate synchronization with cloud storage.
  - **Inline Name Editor**: Enables modifying and saving the workspace `displayName` locally in Dexie `db.settings`.
  - **Instant Photo Upload**: Includes a concealed file picker allowing users to upload a new avatar image immediately.
  - **Atmosphere Switcher**: One-tap toggles between **Night (Midnight)**, **Day (Daylight)**, and **Aurora** themes.
  - **Full Settings Deep-Link**: Seamlessly routes to `/settings` if complete system customization is needed.

### 2. Header Layout Refinement (`src/app/AppShell.tsx`)
- The desktop top header `+` (Quick Add) button is hidden on medium+ viewports (`className="icon-button md:hidden"`) to eliminate duplication with the primary `TavolaDock` `+` trigger.
- Retained exclusively on mobile devices (`max-width: 767px`) where dock is replaced with bottom navigation.

### 3. Responsive 7/5 Grid (`src/features/overview/OverviewPage.tsx` & `src/index.css`)
- **Desktop (12-Column Grid)**:
  - Left column (7 fractions): `Your momentum` (Spline chart and 7-day metric comparison).
  - Right column (5 fractions): A dedicated vertical stack containing:
    1. `Today's focus` (up to 3 active priority tasks).
    2. `Spark of focus` (`<SparkOfFocusCard />`).
- **CSS Grid Rule**:
  ```css
  .overview-primary {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 18px;
    align-items: start;
  }
  .overview-right-stack {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
  }
  ```
- **Tablet / Mobile Breakdown**: Seamlessly stacks into single column below 1000px without horizontal overflow.

### 4. Motivational Quotes Engine (`src/features/overview/data/motivationalQuotes.ts`)
- 100 curated original quotes across 10 distinct categories:
  - Focus (1–10)
  - Discipline (11–20)
  - Execution (21–30)
  - Time (31–40)
  - Study (41–50)
  - Creativity & Building (51–60)
  - Resilience (61–70)
  - Clarity (71–80)
  - Momentum (81–90)
  - Mindset (91–100)
- Stored as static zero-network TypeScript definitions with stable IDs and category tags.

### 5. Rotation Hook (`src/features/overview/hooks/useRotatingQuotes.ts`)
- Configured to 5200ms active view interval.
- Employs a Fisher-Yates deck shuffle that cycles through all 100 quotes before reshuffling, ensuring that the first quote of a new cycle never duplicates the last quote of the previous cycle.
- Automatically halts rotation when tab is hidden (`document.hidden`), when user manually toggles Pause, or when `prefers-reduced-motion` is active.

### 6. Canvas Stardust Particle Engine (`src/features/overview/motion/`)
- `particleSampler.ts`: Offscreen canvas text glyph rasterization with alpha mask thresholding (`alpha > 130`).
- `particleMorph.ts`: Cubic Bézier orbital swirl interpolation, theme-tailored luminous stardust palettes, and GPU/CPU-optimized rendering.
- `ParticleTextCanvas.tsx`: Canvas component running during the 1.7s transformation with clean DOM handoff.
