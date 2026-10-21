# Sprint 6.1 — Performance Before / After

## Method and limits

The before sample used a disposable Chromium build at base commit `b6aa78dd04377c5c7215c7317a6525036cc03413`; the after sample used the local production build on the same machine. This is a targeted browser observation, not a lab benchmark or an iPhone measurement. The transition draw windows are not strictly comparable because the old implementation's 400 ms timer interrupted its 1.7 s tween.

## Observed evidence

| Check | Before | After |
|---|---:|---:|
| Mobile nav position at 390×844 | `relative`; bottom 5328.25px | WebKit emulation `fixed`; top 774px, bottom 838px, height 64px |
| Idle canvas calls in sampled window | 0 calls in 1.8s | 0 calls in 1s |
| Reduced-motion canvas calls | Not sampled | 0 calls; quote changes immediately |
| Quote transition canvas calls | 3,948 `arc`, 3,948 `fill`, 7 `clearRect`, 4 `getImageData` in the observed interrupted window | 12,480 `arc`, 120 `fill`, 26 `clearRect`, 2 `getImageData` over a completed morph |
| Long tasks in observed transition | One 101ms long task | Not recorded in the current browser test |

The different transition durations make the raw draw totals unsuitable for claiming a percentage speedup. The code-level fix removes the chart's per-frame React updates; zero idle draws and two cached glyph raster reads per completed quote transition are verified. A matched CPU-throttled A/B trace remains outstanding.

## Root causes and changes

- Chart animation rebuilt all SVG paths and rerendered React on each GSAP tick; replaced with data-derived geometry plus a one-time SVG reveal.
- Clock timer updated `AppShell`; isolated its state in `HeaderClock`.
- Particle sampling ran per transition; added a 12-entry glyph sample cache and bounded particles. Drawing now groups particles by palette and processes one contiguous pass.
- Quote transition completion timer did not match tween duration; completion now follows GSAP's actual `onComplete` and lifecycle cleanup.

The existing main JavaScript bundle remains approximately 1,078 kB minified / 310 kB gzip; Vite emits its existing chunk-size warning. Bundle splitting was outside this motion repair and remains a separate performance opportunity.

The app-wide responsive browser suite initially found a tablet header overflow and a 320px demo-header chip overflow. Both were fixed; the four affected desktop/mobile responsive cases then passed. The full suite was not repeated after those fixes.
