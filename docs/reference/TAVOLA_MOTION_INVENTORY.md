# Tavola motion inventory

Observed live 20 October 2026 using Playwright in installed Edge. See `evidence/measurements.json`, `tavola-*.png` and session WebM. Sampling reads computed transform, opacity, clip-path and geometry per requestAnimationFrame. It does not read source bundles.

## Evidence classification

**Measured** means recorded computed states. **Estimated** means timing inferred from sparse frames and is not an exact authored duration. **Unobserved** means this capture does not prove the behavior. Browser load and recording produced irregular frame intervals; do not interpret these samples as a performance benchmark.

| Interaction | Observation | Timing / limitation |
|---|---|---|
| Major route click | Peach navigation layer changes `clip-path: inset(...)`, leading edge moves before trailing edge; text stays unscaled. Route-specific content changes. | Measured changing clip geometry; route child entrance samples were partly hidden persistent DOM nodes, so exact whole-page exit/stagger is unobserved. |
| Back/forward | Same clipped-pill movement in both directions; main height changes with route content. | Estimated pill settling ~0.6–0.7s from history sample start, including action overhead. |
| Segmented chart tab | Revenue→Tickets changes pill clipping while SVG container remains; path geometry changes continuously in sampled frames. | Measured, but full path settling exceeded part of 1.5s sampling window. Exact morph duration unobserved. |
| New order modal opening | Dialog appears centered at final560 ×689px; transform uses slight scale and vertical displacement with small overshoot before neutral. | Measured scale1.0016 and y−0.98 near end. Approximate settle~1s from sampling start includes click overhead. |
| Modal Escape closing | Opacity falls1→.08, scale1→.9816, y0→11.04px, then dialog no longer occupies geometry. | Sampled close~0.2s after first changing frame; fully hidden by269ms from start. |
| Chart hover | Hover screenshot captured after pointer movement; no reliable tooltip-state extraction was made. | Presence and exact interpolation of magnetic point/crosshair are not asserted by this run. |
| Card hover | First Overview ticket hovered and screenshot saved. | Static screenshot alone does not prove hover transition duration or easing. |
| Initial load | Initial settled screenshot plus recorded session. | No pre-paint timeline instrumented; exact stagger unobserved. |
| Resize | Actual layouts sampled at1440,768,390px. Dock changes orientation and content reflows. | Exact breakpoint and resize-animation timing unobserved. |
| Scroll | Staff page scrolled650px; dock retains viewport relationship in screenshot. | No assertion of scroll-linked animation. |
| Utility controls | New-order button and Escape exercised. | Other utilities and all dropdowns not exhaustively tested. |

## Directional pill evidence

Forward history sample: initial inset right159px / left441px; by94ms right129.935px while left441.038px; by425ms right90px while left529.294px; final right90px / left538px around663ms. Backward sample reverses the edge ordering. This supports independent edge timing rather than stretching the text or scaling the whole tab.

## Nemo implementation contract

- Use a clipped colored layer based on actual anchor geometry, preserving text geometry and keyboard semantics.
- Animate outgoing route content before replacing its retained outlet; incoming header and panels can overlap. This is Nemo's deliberate choreography, not claimed exact Tavola behavior.
- Maintain the SVG chart container and interpolate values; offer accessible table and keyboard exploration.
- Modal close should return focus, Escape should work, and reduced motion must settle immediately.
- Rapid navigation must resolve the most recent destination and cancel obsolete timelines.

User-provided exit.18–.28s, entrance.45–.70s, stagger.035–.075s and power3.out are engineering starting points, not reference measurements. This audit does not promote those values to observed facts.
