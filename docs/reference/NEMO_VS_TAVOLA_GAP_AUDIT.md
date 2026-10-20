# Nemo vs. Tavola: Comprehensive Visual & Motion Gap Audit

**Date:** 20 October 2026  
**Auditor:** Principal Creative Technologist & Visual Quality Director  
**Subject:** Empirical comparison between live benchmark ([Tavola Reference](https://demo.codeandchill.store/tavola/#/overview)) and Nemo (`visual-recovery-checkpoint`).  
**Evidence Sources:** High-resolution video recordings (`Screen Recording 2026-10-20 133452.mp4` & `Screen Recording 2026-10-20 140535.mp4`), frame stepping at 30fps, Playwright DOM/computed-style measurements (`docs/reference/evidence/measurements.json`), and live side-by-side browser rendering at 1440×900, 1024×768, and 390×844.

---

## 1. Executive Summary & Quality Verdict

Previous iterations succeeded at compiling TypeScript, passing unit tests, and establishing baseline routes. However, visual evaluation revealed critical acceptance gaps:
1. **Typographic & Atmospheric Identity:** Tavola feels like an expensive, editorial workstation due to its custom geometric grotesque font (**Urbanist**), deliberate letter-spacing (`-0.03em`), and rich dark navy luminosity. Nemo previously fell back to generic browser sans-serifs with flat dark blue surfaces.
2. **Top Navigation Pill Geometry & Clipping:** The dual-layer text clipping technique used in `TavolaTabs.tsx` caused the active capsule to squish, overflow vertically, and clip letters on wider tabs (`Insights`, `Academics`), while lacking proper track constraint at narrower viewports.
3. **Overview Information Density & Hierarchy:** Tavola pairs an analytical spline chart with a **2-column grid of tactile pastel ticket cards** ("On the pass") that fill vertical space purposefully. Nemo rendered a single stack of 3 stretched horizontal bars, leaving awkward negative space and feeling sparse.
4. **Motion Coordination vs Abrupt Swapping:** Tavola maintains persistent chrome while animating incoming canvas elements via staggered physical entrances (`power3.out`). Nemo previously suffered from uncoordinated unmounts and sudden jumps.

---

## 2. Comparative Matrix: Tavola vs. Nemo

| Surface / Feature | Tavola Reference (Observed & Measured) | Nemo Current State (Observed Failure) | Root Cause | Priority | Proposed Repair |
|---|---|---|---|---|---|
| **Typography System** | `Urbanist`, weights 500/600/750. Tight letter-spacing (`-0.03em`), proportional numbers, crisp kerning. | Generic `Inter` / system-ui fallback. Proportions feel standard SaaS admin. | Missing web font import & editorial scale tokens. | **P0** | Load `Urbanist` (Google Fonts), configure tracking `-0.025em` to `-0.035em`, and calibrate numeric weights. |
| **Top Navigation Tabs** | Radius 999px pill track with 4px inset. Elastic peach capsule (`#f5c8bc` -> `#eaa999`) tracks active tab. Zero text wobble or overflow. | Capsule squished text, clipped right-edge tabs (`Insights`), and bulged vertically beyond track border. | `clip-path: inset()` calculations desynchronized from DOM box; duplicate text layers with mismatched font weights. | **P0** | Transition to single-layer absolute floating pill with exact bounding client rect GSAP tweening (`x`, `width`). Ensure track padding & `overflow: hidden`. |
| **Header Chrome & Tools** | Brand mark + live clock chip (`🟢 7:42 PM`) + message button + notification bell with count badge (`3`) + user photo. | Minimal: `+` button, theme icon, single initial circle avatar. | Incomplete header utility suite. | **P1** | Add live session / sync status pill, clean icon buttons, and refined avatar frame matching Tavola's right utility cluster. |
| **Primary Chart (Momentum)** | Hero value ($4,560, 58px) + dynamic toggle (Revenue/Tickets) + Catmull-Rom cubic bezier spline + hover crosshair & magnetic data snap. | Static curve, low amplitude, flat line to zero, no interactive spline morphing, awkward text toggle. | Simplified SVG generator without Catmull-Rom interpolation or GSAP path morphing. | **P0** | Implement monotonic Catmull-Rom cubic spline generator, interactive dataset toggle with animated path tweening, and magnetic cursor snap. |
| **Today's Focus / Tickets** | Dense 2-column grid of tactile pastel tickets (Mint, Peach, Butter Yellow) with item lists, timers, and circular checkmarks. | 3 stretched horizontal bars in a single column, creating massive vertical dead space. | Rigid single-column flex layout lacking ticket-card internal anatomy. | **P0** | Reconstruct into a multi-card responsive grid featuring status-driven pastel fills (`#c3e9da`, `#ffd4c7`, `#fae392`), clean time badges, and tactile circular completion buttons. |
| **Secondary Analytics Gauge** | `The room` radial donut chart (54% filled) with colored legend dots and bottom status badge. | Missing on Overview. | Not implemented in previous passes. | **P1** | Introduce a high-contrast circular progress / focus balance gauge next to the projects section. |
| **Active Projects Showcase** | Clean cards with typographic badges, rich dark glass surfaces, and subtle progress bars. | Flat cards with generic styling. | Basic Tailwind classes without layered glass borders or drop shadow depth. | **P1** | Elevate project cards with subtle gradient borders (`border-white/10`), hover lifts (`-2px`), and mint milestone progress indicators. |
| **Page Transitions** | Persistent shell; outgoing page fades (`power2.in`, 180ms); incoming page glides `+14px -> 0px` with staggered `[data-enter]` elements (`power3.out`, 450ms). | Page changes swap instantly or jump abruptly without synchronized stagger. | Missing unified GSAP route orchestrator. | **P0** | Enhance `RouteTransition.tsx` with GSAP context, automatic cleanup, and staggered entrance of child sections. |

---

## 3. Deep Dive by Domain Route

### A. Overview Page
- **Tavola Benchmark:** The overview is an editorial masterpiece. It balances high-level metrics with operational immediacy. Every pixel is intentional: 58:42 split between the chart and the kitchen pass.
- **Nemo Gap:** The current Overview feels like a skeleton with three colored bars on the right and an underpopulated chart on the left.
- **Remediation Plan:**
  - Build a 58:42 primary split.
  - Left panel: Spline chart with "Velocity (7d)" vs "Completion rate", interactive switcher, 58px hero counter, Catmull-Rom curve with area gradient.
  - Right panel: "Today's Focus" formatted as tactile high-contrast tickets with priority color coding (Urgent = Peach, High = Mint, Normal = Soft Yellow).
  - Bottom row: Radial Weekly Progress Gauge + Active Projects cards + Academic Deadlines.

### B. Tasks & Projects (Orders / Kitchen Board analogue)
- **Tavola Benchmark:** Kanban columns ("New", "In Progress", "Ready") with vivid status chips, draggable cards, and order detail drawers.
- **Nemo Gap:** Nemo has functional tasks and projects, but the list view is visually flat and monotone.
- **Remediation Plan:**
  - Ensure task priority and project status badges use Tavola's pastel palette (`#c3e9da`, `#ffd4c7`, `#fae392`).
  - Introduce tactile hover states and circular completion rings.

### C. Calendar (Reservations Timeline analogue)
- **Tavola Benchmark:** Top date strip (`Today 20`, `Wed 21`, `Thu 22`) with red live-time scrubber and horizontal timeline blocks.
- **Nemo Gap:** Calendar works functionally but lacks the date scrubber pill styling and time-block elevation.
- **Remediation Plan:**
  - Style the day selector strip as rounded glass pills with active peach indicator.
  - Ensure time grid uses subtle borders and glowing current-time indicator.

### D. Insights (Reports analogue)
- **Tavola Benchmark:** Dense analytical charts, category breakdown bars, and summary comparison pills.
- **Nemo Gap:** Basic charts without interactive tooltips or animated number counters.
- **Remediation Plan:**
  - Upgrade Insights charts to match `TavolaSplineChart` standards with SVG bezier curves and animated statistics.

### E. Settings
- **Tavola Benchmark:** Nested horizontal capsule tabs (`Workspace Profile`, `Appearance`, `Preferences`, `Data & Backups`), full-width glass rows with tactile toggle switches.
- **Nemo Gap:** Settings currently has subtabs, but needs the identical glass border treatment and smooth tab switching.
- **Remediation Plan:**
  - Align nested subtabs with `TavolaTabs` architecture and provide immediate visual feedback.

---

## 4. Verification & Acceptance Criteria
1. **Side-by-Side Fidelity:** At 1440×900, Nemo Overview matches Tavola's density, typography rhythm, and glassmorphism hierarchy.
2. **Motion Smoothness:** Zero layout shifts, zero text clipping during tab navigation, and smooth 60fps SVG chart morphing.
3. **Data Integrity:** 100% preservation of Nemo's local Dexie IndexedDB schemas, demo mode toggle, and real task management features.
4. **Test Suite:** `npm run typecheck`, `npm test` (all 20 tests pass), and `npm run build` succeed with zero errors.
