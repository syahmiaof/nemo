# Spark of Focus V2 — technical notes

Scope: the quote card, its renderer, sampler and rotation hook. No schema, Supabase, authentication, navigation, dashboard layout or global CSS changes belong to this branch's Spark commit.

## Glyph geometry

`rasterizeQuote` waits for the local font through the renderer, clones the real paragraph inside the same layout context, then reads character `Range` boxes. These boxes supply browser wrapping, kerning positions and letter spacing. Coordinates are normalized for a transformed ancestor. The font family, weight, size, line height and text color come from computed styles. Font bounding-box ascent/descent determine the baseline. Curly quotation marks are included.

The hidden clone is removed synchronously. A detached Canvas retains the colored alpha mask at DPR capped at 2. Contour/interior tiles partition the covered glyph pixels; the cell size grows until the budget is met. Budgets: 650 desktop, 400 tablet, 240 mobile. Tile ownership ensures a population mismatch cannot double-paint a source/destination tile.

An LRU cache holds at most 12 geometries. Its key includes text, region dimensions, DPR, budget, font, letter spacing, line height, maximum width and color. Resizing clears the cache. Unmount releases it. No font extraction occurs inside the frame loop.

## Correspondence and field

Morton ordering preserves spatial neighborhoods. Stratified expansion maps the smaller population onto the larger one, retaining exactly one owner per glyph tile. Deterministic seeds control the release wave, contour-first arrival, depth, radius and palette.

Each particle follows a continuous quintic interpolation between its source and destination with a sinusoidal displacement envelope. Both ends have zero field displacement and approach zero velocity. Prototype A uses a broader vortex; final prototype B uses a shallow ribbon current. Neither collapses all particles onto a shared circle. Fine points use ivory, peach, mint and cool blue; Daylight uses darker equivalents.

## Erosion and reformation

Source coverage erodes with each fragment's release progress. Dust begins at the same glyph coordinates. At arrival, destination coverage grows from those particles' assigned glyph tiles. It is a spatial mask reconstruction, not a DOM fade. A particle changes form from glyph coverage to a fine point and back into destination coverage; it is not a conserved physical simulation of individual font pixels.

The final renderer clips each complete glyph mask using a compound tile path: at most two image draws per frame, rather than hundreds of individual tile images. Dust is grouped into 16 palette/opacity paths; four trail and four halo paths are also batched. These bounded temporary paths are discarded each frame. Particle buffers are allocated once per transition; coordinate scratch arrays are reused.

## Timeline and handoff

One GSAP timeline animates one progress value over 2 seconds, with no per-frame React state updates. Phase markers are `living`, `fracture`, `dissolve`, `orbital`, `summoning`, `settlement`. The existing 5.2-second timer leaves approximately 3.2 seconds of readable idle time after a completed automatic transition.

The source mask is painted before hiding the accessible DOM quote. The destination mask is fully assembled before the completion callback updates the DOM. The Canvas remains decorative (`aria-hidden`). There is no live-region announcement every cycle. The idle Canvas backing store shrinks to 1×1 and no quote renderer loop remains active.

A quote-local inline opacity rule is necessary because an existing global mobile selector forces classes containing `opacity-0` to be visible. This fixes the source/destination overlap without changing shared CSS.

## Lifecycle and interruptions

- GSAP context owns the asynchronously created timeline; cleanup kills it.
- Visibility, hover, keyboard focus and IntersectionObserver pause the timeline.
- Touch pointer entry does not latch mouse hover pause.
- Manual Next runs one transition even while automatic rotation is paused; overlapping Next clicks are ignored.
- Automatic timer ticks cannot replace an in-flight manual destination.
- Resize completes to a readable quote and remeasures on the next transition.
- Reduced Motion displays the next DOM quote without starting a particle timeline.
- A mobile renderer taking over 14 ms on more than 30% of at least 16 sampled frames falls back to static subsequent quotes. This measures rendering work, not browser scheduling delays, so it is not a guarantee against every source of device jank.

## Known boundaries

The supplied English dataset uses Latin text. Drawing characters at browser-measured positions is not a general shaping engine for Arabic, complex scripts, emoji sequences or arbitrary ligatures. Such future content needs a separate shaping/bitmap strategy. DPR is deliberately capped at 2 for cost. WebKit's full-page frame scheduling on this Windows host prevented a trustworthy Safari acceptance result; native iPhone validation is still required.
