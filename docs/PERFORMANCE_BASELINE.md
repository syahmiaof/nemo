# Nemo — Performance Baseline Measurement Report

**Sprint:** Sprint 3 — Performance, Accessibility & Cross-Browser Hardening  
**Date:** 2026-10-20  
**Lead Engineer:** Principal Performance Engineer  
**Branch:** `sprint3-performance-a11y`  
**Test URL:** Production Preview `http://localhost:4173/` (Vite PWA, Minified + Precached)

---

## 1. Test Environment & Measurement Methodology

- **Host OS:** Windows (win32, x64)
- **Node Runtime:** v24.13.0
- **Automated Engine:** Playwright v1.64.1 (Chromium Engine v1248)
- **Viewport:** 1440 × 900 (Desktop), deviceScaleFactor: 1
- **Network Mode:** Local production preview server via `vite preview --port 4173`
- **Methodology:**
  - Automated repeatable execution via [`scripts/benchmark_baseline.cjs`](file:///C:/Users/USER/Desktop/nemo/scripts/benchmark_baseline.cjs).
  - W3C Performance Timeline (`navigation`, `paint`, `longtask` observer).
  - Native `performance.memory` heap telemetry.
  - High-resolution `performance.now()` frame-bound latency measurements.

---

## 2. Baseline Asset Bundle Distribution

```
dist/registerSW.js                0.13 kB
dist/manifest.webmanifest         0.40 kB
dist/index.html                   1.32 kB │ gzip:   0.69 kB
dist/assets/index-DMywoRCB.css   66.77 kB │ gzip:  14.20 kB
dist/assets/index-q9LfsSv_.js   675.31 kB │ gzip: 204.83 kB
Total Precache: 16 entries (755.63 KiB)
```

> [!NOTE]
> The single JavaScript chunk (`index-*.js`) is 675.31 kB uncompressed (204.83 kB gzip) due to eager route imports in `src/app/routes.tsx`. Route-level code splitting via `React.lazy()` offers an immediate opportunity to split non-critical route chunks.

---

## 3. Initial Application Loading & Paint Timings

| Metric | Measured Baseline | Target Standard | Status |
|---|---|---|---|
| **Time to First Byte (TTFB)** | 5.80 ms | < 50 ms | **EXCELLENT** |
| **DOMContentLoaded (DCL)** | 327.90 ms | < 800 ms | **EXCELLENT** |
| **Window Load Complete** | 332.70 ms | < 1200 ms | **EXCELLENT** |
| **First Paint (FP)** | 344.00 ms | < 800 ms | **EXCELLENT** |
| **First Contentful Paint (FCP)** | 480.00 ms | < 1000 ms | **EXCELLENT** |
| **Initial JS Heap Memory** | 9.54 MB | < 30 MB | **EXCELLENT** |
| **Max Heap Ceiling** | 3,585.82 MB | N/A | Normal V8 profile |

---

## 4. Route Navigation Response Times

Measured across consecutive transitions in a populated workspace (18 projects, 150 tasks):

| Route Transition | Latency (ms) | Target | Notes |
|---|---|---|---|
| **Overview $\to$ Tasks** | 208.28 ms | < 300 ms | Includes rendering task list & tag filters |
| **Tasks $\to$ Projects** | 155.01 ms | < 300 ms | Project card grid with local canvas covers |
| **Projects $\to$ Calendar** | 184.57 ms | < 300 ms | Month grid with projected deadline chips |
| **Calendar $\to$ Academics** | 208.86 ms | < 300 ms | Semesters, subjects, assignment cards |
| **Academics $\to$ Goals** | 346.96 ms | < 300 ms | Goal progress recalculation across milestones |
| **Goals $\to$ Insights** | 286.77 ms | < 300 ms | Spline bezier interpolation & yearly aggregator |
| **Insights $\to$ Settings** | 253.72 ms | < 300 ms | Settings sub-tabs and system info panels |
| **Settings $\to$ Overview** | 260.47 ms | < 300 ms | Overview donut, 3 focus cards, spline chart |

---

## 5. Interaction & Component Latencies

| User Action | Latency (ms) | Observation |
|---|---|---|
| **Calendar Month Switch** | 584.64 ms | Date generation and projection filtering runs synchronously on main thread |
| **Insights Metric Switch** | 520.33 ms | Spline path recalculation and morphing tween |
| **QuickAdd Modal Open** | 211.93 ms | Backdrop blur rendering and initial focus trap |
| **QuickAdd Modal Close** | 151.06 ms | GSAP exit tween and focus restoration |

---

## 6. IndexedDB Engine Speed

Measured on realistic dataset (18 projects, 150 tasks):

- **Tasks table `.getAll()`:** 3.1 ms
- **Projects table `.getAll()`:** 3.1 ms
- **Read Throughput:** Extremely fast in-process SQLite/LevelDB backed storage.

---

## 7. Main-Thread Long Tasks (>50ms)

During initial load and 8 sequential route navigations:
- **Total Long Tasks Detected:** 3
- **Task 1:** 51.0 ms (Initial bundle script execution)
- **Task 2:** 65.0 ms (Academics to Goals route transition and progress derivation)
- **Task 3:** 132.0 ms (Overview spline path calculation and DOM mounting)

---

## 8. Identified Bottlenecks for Sprint 3 Optimization
1. **Route Code Splitting:** `routes.tsx` currently imports all page components statically into one monolithic 675 kB chunk.
2. **Calendar Projections Memoization:** Calendar month navigation (584 ms) re-filters all tasks and assignments across the entire range without memoizing the active month's date boundaries.
3. **Insights Chart Spline Calculation:** Metric switching (520 ms) recalculates and interpolates Catmull-Rom control points inline during render.
4. **Virtualization / Pagination Preparedness:** As datasets grow from 150 to 5,000+ tasks in stress testing, rendering thousands of DOM nodes will degrade frame rates unless paginated or virtualized.
