# Nemo motion refinement — release verification

Baseline: `6fee2f7` on `main`. The Tavola demo was used as a motion reference; Nemo's own navigation, data model, accessibility settings, and visual tokens remain the source of product behavior.

## Motion changes

- Route changes now stage heading letters, metrics, controls, and visible cards. Cards open from a center clip with a slight lift and scale; outgoing cards tighten before the outlet changes.
- The desktop navigation pill moves its two edges independently and clips a duplicate ink layer so the text color follows the pill boundary.
- Overview and Insights spline charts sweep left to right on entry and interpolate values on data changes. Insights donut and bars animate when live data arrives.
- Projects, Tasks, Goals, and Academics animate visible records after filter or collection changes. Calendar period changes move in the requested direction. Settings subsections animate on tab changes.
- OS and in-app reduced motion bypass these transitions. The visible record animation is capped and off-screen items are left alone.

## Checks on the final source

- `npm run typecheck` — passed.
- `npm test` — 101 passed.
- `npm run build` — passed; Vite still reports its existing large-chunk advisory (main JS about 1.03 MB before gzip).
- `BASE_URL=http://127.0.0.1:4173 npx playwright test` — 40 passed across desktop Chrome and Pixel 7 profiles, including offline PWA, functional journeys, route transitions, mobile layout, and reduced motion.
- Browser inspection of the production build at desktop and narrow mobile viewport: Overview, Projects, project filter, chart, navigation, title wrapping, and mobile card layout checked visually.

The old end-to-end setup assumed the launch overlay would not replay after hard navigation. A shared test helper now dismisses that intentional overlay and onboarding through the UI before functional checks. Stale labels and the Today Focus auto-backfill expectation were updated to match current product behavior.
