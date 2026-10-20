# Tavola visual audit

Observed 20 October 2026, live public reference https://demo.codeandchill.store/tavola/#/overview. Browser: installed Microsoft Edge headless, Playwright. These are rendered DOM/computed-style measurements and screenshots, not extracted source code or reusable third-party assets. Screenshots remain evidence only.

## Geometry measured in CSS pixels

| Surface | 1440 × 900 | 768 × 1024 | 390 × 844 |
|---|---|---|---|
| Utility dock | x20, y174.5, 72 × 551 | x20, y236.5, 72 × 551 | x18, y768, 354 × 64 bottom dock |
| Top navigation | x347, y22, 695 × 49 | x108, y86, 644 × 49 | x0, y70, 390 × 49; horizontal track |
| Main content | x115, y97, width1302 | x108, y161, width644 | x14, y137, width362 |
| First analytical panel | x115, y199, 753 × 408 | x108, y371, 644 × 398 | x14, y363, 362 × 434 |
| Headline font / line | 37.44 / 38.94 | 28 / 29.12 | 28 / 29.12 |
| Document overflow | none | none | none |

Desktop primary/secondary panel balance is approximately 58:42, with an 18px gutter. The headline and unboxed KPI row share the horizontal summary region. At tablet width, navigation moves onto its own row and major content stacks. Mobile keeps a horizontally scrollable top route track and replaces the left utility dock with a bottom pill. Breakpoint thresholds were not binary-searched, so only these observed layouts are claimed.

## Measured visual system

- Body: Urbanist, system fallback; 16px, weight500, line-height23.2px. Headline weight600. Top tabs14.5px/21.025, weight600, padding10px 17px; segmented controls13.5px/19.575, weight600.
- Base background rgb(10,18,34), primary text rgb(238,242,251). Screenshot shows broad navy illumination strongest behind upper-left main panels, with darker right and lower edges.
- Main panel radius26px, padding18px. Layered translucent gradient: white alpha.13 at upper-left, .03 mid, .07 ending over rgba(12,20,40,.52). Glass blur26px and saturation1.65. Inset white rim and broad low-opacity dark exterior shadow.
- Dock radius999px, padding10px, gap6px, white-alpha.07 surface, 1px inset rim. Tabs white-alpha.06 surface and radius999px, 4px inset active pill.
- Active navigation peach gradient rgb(245,200,188) to rgb(234,169,153). Ready tiles mint rgb(195,233,218) to rgb(159,214,193), text rgb(16,41,31), radius22px, padding14–16px. Status meaning is reinforced by text.
- Icons generally22px in observed logo/controls; no claim that every icon shares that exact size.

## Page observations

Captured Overview, Orders, Floor, Reservations, Menu, Inventory, Staff, Reports and Settings. All maintain the same shell, typography rhythm, radii and glass material. Content differs substantially: order columns use tinted dense tickets; menu uses large real imagery; reports is chart-heavy; settings uses full-width ruled rows; reservations uses a wide date strip and timeline. Nemo should preserve this variety through productivity content, rather than identical small statistic-card grids.

## Evidence and reproduction

Run `node scripts/reference-audit.mjs` with installed Edge. Screenshots and raw JSON are under `docs/reference/evidence/`; `measurements.json` records computed values and sampled frames. Overview screenshots use full-page capture at each requested viewport; route captures use viewport screenshots. A WebM session recording was saved in that directory. Media belongs solely to reference evidence and is never an application asset.

## Adaptation decisions

Use measured spacing, panel proportions, typographic contrast and material hierarchy as a benchmark. Preserve Nemo identity and all productivity routes. Mobile need not reproduce the reference's exact utility count: Nemo's five-item navigation and overflow access should remain usable. A numerical similarity score would be misleading because the content and branding intentionally differ; none is reported.
