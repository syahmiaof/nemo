# Spark V2 — visual acceptance

Status: **local review candidate; production acceptance withheld**. The owner requested direct local testing and waived further recording. Open `http://localhost:5173/overview`, scroll to Spark of focus, then move the mouse outside the card. Hover/focus intentionally pauses the effect. Next also works when automatic rotation is paused; move the pointer away after clicking to see it run.

## Before

The old Canvas forced at least 110 pixels of height into the smaller actual quote region, used approximate text wrapping and faded the DOM over 300 ms. Its shared circular destination field compressed the sentence into a central ring. The scene read more like a spinner than enchanted typography. The final DOM replacement lacked a fully covered target mask. On mobile, a global CSS opacity override also kept the source text visible over the Canvas.

The real baseline frames in `evidence/sprint62/baseline-desktop` show these limitations.

## Prototypes

| Evaluation | A: dust vortex | B: luminous ink |
|---|---|---|
| Movement | Wider horizontal loops | Shallower, coherent ribbon |
| Typographic continuity | Real source/target glyph coordinates | Same real glyph correspondence |
| Readability | More distraction in the short region | Calmer fracture and contour-first reformation |
| Nemo fit | More theatrical | More suitable for a small productivity card |
| Decision | Retained as internal code option only | Selected; no user-facing selector |

Both were rendered and inspected in the actual app. Their earlier phase captures are retained in `ink-1440-phases` and `vortex-1440-phases`. Final optimization replaces individual tile-image draws with compound mask clipping and groups the dust paths; the chosen ribbon field remains unchanged.

## What the final effect demonstrates

- A restrained light travels through the source contours.
- The source glyph coverage erodes progressively; particles originate at its glyph tiles.
- Fine ivory/peach/mint dust follows a coherent ribbon current.
- Assigned destination tiles become visible as particles approach their destinations.
- The full destination mask is present before the DOM quote returns.
- No CSS text fade is used for the morph; old text is hidden while the Canvas owns the presentation.
- Existing card dimensions, borders, spacing, dataset and layout remain unchanged.

The exact-timestamp phase script pauses the actual GSAP timeline for inspection. These are real browser frames, not fabricated animation renders, but paused screenshots alone do not establish smoothness. The owner's live local evaluation takes precedence over an agent's artistic rating.

## Acceptance boundaries

No claim of perfect fantasy-film quality or exact matching to an external reference is made. The true typography transformation is implemented, and the final source/target alignment is visibly much stronger than the baseline. Mobile frame timing and Windows WebKit remain qualifications, detailed in the performance report. No Vercel deployment or push to main is part of this work.
