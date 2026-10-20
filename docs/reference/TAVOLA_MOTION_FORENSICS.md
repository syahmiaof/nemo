# Tavola Motion Forensics & High-Fidelity Interaction Report

> **Authoritative Forensic Investigation & Analysis**  
> **Source Material:** `Screen Recording 2026-10-20 133452.mp4` (Duration: 72.63s, Resolution: 1918×1078 @ 30fps, Bitrate: 8.77 Mbps), live target `https://demo.codeandchill.store/tavola/#/overview`, and empirical requestAnimationFrame probe measurements (`docs/reference/evidence/measurements.json`).

---

## 1. Executive Summary & Forensic Methodology

Tavola demonstrates a distinctive, tactile, "editorial luxury" motion language. It is not an arbitrary collection of flashy bounces, but a disciplined choreography governed by physical constraints:
- **Spatial Anchoring:** App chrome (top navigation capsule, left utility dock) remains firmly mounted and never unmounts or blinks during page changes.
- **Directional Elastic Indicator:** Tab selection does not stretch or warp text. Instead, an independent clipped background layer expands its leading edge in the direction of travel before pulling its trailing edge, creating an elastic organic feel while maintaining pixel-sharp typography.
- **Continuous SVG Morphing:** Dynamic chart switches (e.g. Revenue vs Tickets) do not destroy the DOM canvas. Path coordinates smoothly interpolate between bezier spline curves while axes and legends crossfade.
- **Asymmetric Dialog Lifecycle:** Modal openings utilize subtle scale (`0.96 -> 1.0016 -> 1.0000`) and vertical translation with a gentle ease-out overshoot (~200ms); closures drop opacity quickly (~180ms) and settle downwards without lingering artifacts.

### Evidence Classification Standard
- **Measured:** Derived from recorded computed styles (`clip-path`, `transform`, `opacity`, `getBoundingClientRect`) sampled across animation frames.
- **Estimated:** Inferred from timestamp intervals and video frame stepping.
- **Observed:** Visually verified in the 72.6s reference recording.

---

## 2. Comprehensive Forensic Motion Inventory

| # | Motion Pattern | Trigger | Animating Elements | Visual Progression | Measured / Estimated Timing | Easing & Physics |
|---|---|---|---|---|---|---|
| **1** | **Major Page Navigation** | User clicks top navigation tab or sidebar link | Main canvas content (`<main>`), page header, cards, charts | Outgoing canvas fades slightly and shifts upward by ~8px; incoming canvas slides up from +14px with opacity `0.35 -> 1.0` | Exit: ~180ms<br>Entrance: ~450–500ms | Exit: `power2.in`<br>Entrance: `power3.out` |
| **2** | **Elastic Tab Indicator** | Navigation click / history back & forward | Pill indicator layer behind tab label | **Direction-Sensitive:** Moving right expands `inset-right` first, then catches up `inset-left`. Moving left expands `inset-left` first, then pulls `inset-right`. Zero font distortion. | Leading edge: 340ms<br>Trailing edge: 460ms (stagger: 35ms) | `power3.out` with independent dual-axis tracking |
| **3** | **Card Stagger Entrance** | Page navigation settle | Glass cards, KPI pills, lists (`[data-enter]`) | Cascading entrance from +12px offset with sequential opacity reveal | Duration: 480ms per card<br>Stagger delay: 45ms per element | `power3.out` |
| **4** | **Chart Line Reveal & Morph** | Initial render & toggle between metrics | SVG path, gradient fill, grid lines | Bezier control points morph continuously (`d="M...C..."`). Area fill opacity tracks curve settlement. | Settle duration: 500–850ms | `power2.out` |
| **5** | **Chart Crosshair & Magnet Dot** | Pointer hover across SVG chart width | Vertical guideline, circular ping marker, floating tooltip | Guideline tracks `pointerX` immediately; circular data marker snaps magnetically to the nearest spline point on the curve. | Instant tracking (0ms delay), smooth tooltip interpolation (120ms) | Linear pointer tracking + magnetic snap |
| **6** | **Settings Nested Tab Switch** | Click on subtab (Appearance, Service, Data) | Secondary capsule pill & settings panel body | Secondary pill slides with elastic clip; active panel fades and glides horizontally (+6px). | Tab: 320ms<br>Panel: 240ms | `power2.out` |
| **7** | **Interactive Card Hover** | Pointer hover over actionable tickets/cards | Border gradient, surface luminosity, subtle y-lift | Border changes from `rgba(255,255,255,0.08)` to `0.22`; card lifts `-2px` with expanded shadow. | 180ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **8** | **Modal Dialog Lifecycle** | "New Order" / "Add Item" button click | Backdrop scrim, dialog surface | **Open:** Scrim fades in (0 -> 1); modal enters from `scale: 0.96, y: +8px` with micro-overshoot (`scale: 1.0016`).<br>**Close:** Drops opacity and translates downwards `+11px` in ~200ms. | Open: 260ms<br>Close: 180–200ms | Open: `back.out(1.2)`<br>Close: `power2.in` |
| **9** | **Calendar & Timeline Scrubber** | Date click or arrow navigation | Day capsules, current time marker line, reservation blocks | Active date circle snaps to new column; time indicator maintains current position; blocks crossfade. | 220ms | `power2.out` |
| **10** | **Responsive Viewport Reflow** | Window resize / mobile breakpoint switch | Top navigation vs bottom dock, multi-column grid to single-column | Fluid reflow without layout jumps; dock transitions to compact mobile bar. | Handled via CSS media queries & ResizeObserver | Smooth CSS transitions |

---

## 3. Video Timestamp Breakdown (`Screen Recording 2026-10-20 133452.mp4`)

- **00:00 – 00:02:** **Overview Initial State.** Main KPI cards ("$4,560", "79 Covers", "$57.72") displayed. Spline chart shows live evening curve vs dashed comparison line.
- **00:03 – 00:05:** **Navigation to Orders (`#/orders`).** Directional peach capsule glides from `Overview` to `Orders`. Kitchen Board Kanban cards enter with staggered vertical translation.
- **00:06 – 00:08:** **Navigation to Reservations (`#/reservations`).** Timeline calendar renders date selector pill strip (`Today 20`, `Wed 21`, etc.).
- **00:09 – 00:11:** **Navigation to Menu (`#/menu`) and Staff (`#/staff`).** Demonstrates rapid sequential tab navigation; pill indicator smoothly redirects trajectory without clipping glitches.
- **00:12 – 00:15:** **Scroll & Return to Overview.** Smooth vertical scroll reveals "Best sellers tonight", "Running low", and "Activity" cards. Progress bar fills animate cleanly.
- **00:16 – 00:19:** **Chart Interaction.** Toggling between `Revenue` and `Tickets` demonstrates SVG spline coordinate morphing without container rebuild.
- **00:20 – 00:23:** **Floor Plan Navigation (`#/floor`).** Table state indicators (Free, Seated, Eating, Bill) with interactive table cards and waitlist drawer.
- **00:24 – 00:27:** **Timeline Scrubber Interaction.** Red current-time vertical indicator with time pill badge ("7:42 PM").
- **00:30 – 00:36:** **Settings Exploration (`#/settings/service`, `#/settings/appearance`, `#/settings/data`).** Sub-navigation capsule bar with nested tabs.
- **00:37 – 00:50:** **Theme & Toggle Interactions.** Switching between Dark and Light appearance; theme preview cards with active selection outlines. Data export and reset buttons with tactile hover/active states.
- **00:51 – 01:12:** **Stress & Boundary Testing.** Rapid switching across views, verifying absence of layout shifts, memory leaks, or orphaned DOM elements.

---

## 4. Architectural Implementation Blueprint for Nemo

1. **Persistent Top Navigation Shell:** Top bar (`Header.tsx` + `TavolaTabs.tsx`) maintains DOM persistence across route changes.
2. **Direction-Sensitive Capsule (`TavolaTabs.tsx`):** Implements dual-edge physics where leading edge fires at `t=0` and trailing edge follows at `t=35ms`.
3. **Coordinated Page Transitions (`RouteTransition.tsx`):** Outgoing route fades and shifts `-8px` in 180ms before outlet replacement; incoming route fades in and glides `+14px -> 0px` with staggered `[data-enter]` section reveals.
4. **Interactive Spline Chart (`TavolaSplineChart.tsx`):** Catmull-Rom/Monotone cubic spline generation, magnetic hover point, interactive crosshair line, and animated numeric interpolation.
5. **Multi-Section Settings (`SettingsPage.tsx`):** Refactored into nested Tavola-style tabs (`Workspace Profile`, `Appearance`, `Preferences`, `Data & Backups`, `Demo Mode`) with smooth panel swapping.
6. **Isolated Demo Mode (`src/demo/`):** Full realistic dataset with rich projects, tasks, coursework, and spline metrics, switchable at any time without altering genuine user data.
