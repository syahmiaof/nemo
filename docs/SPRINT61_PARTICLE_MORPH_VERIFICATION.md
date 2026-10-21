# Sprint 6.1 — Particle Morph Verification

The quote card keeps the real quote as accessible DOM text. On a transition, the renderer waits for fonts, samples the rendered source and target glyphs into cached pixel coordinates, builds a bounded correspondence buffer, and runs a 1.7-second GSAP tween through shimmer, breakup, orbital swirl, and reformation. It then clears the canvas and reveals the destination DOM quote. A hidden/offscreen card, pointer hover/focus, hidden document, or reduced-motion preference suspends or bypasses particle work. Cleanup kills the active tween.

The sampler uses a 12-entry LRU-style insertion cache, a DPR cap of 2, and 340 particles under 480 CSS pixels / 520 otherwise. A complete desktop browser morph recorded 12,480 arcs, 120 fills, 2 glyph `getImageData` reads, and 26 clears. After completion, the one-second idle window recorded zero calls. Reduced-motion testing also recorded zero calls while the quote advanced.

Evidence: [`quote-morph.webm`](evidence/sprint61/quote-morph.webm), [`quote-idle.png`](evidence/sprint61/quote-idle.png), [`quote-complete.png`](evidence/sprint61/quote-complete.png). The video is a real Playwright browser recording (12.52 seconds, 800×450); extracted frames show the orbiting particle cloud before it reforms. Quote contents remain drawn from the existing collection; the existing quote data tests still pass.

Limitations: the captured clip is downscaled by Playwright and is not a physical-device recording. Theme-specific visual captures for Midnight, Daylight, and Aurora, 50-cycle memory profiling, and an iPhone Safari run are still required before calling this acceptance complete.
