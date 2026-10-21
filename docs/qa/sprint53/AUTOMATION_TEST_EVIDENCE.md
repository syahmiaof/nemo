# Automation Test Evidence

Tarikh: 2026-10-21. Semua local checks guna checkout HEAD yang dicatat dalam executive report.

| Check | Keputusan | Nota |
|---|---|---|
| `npm test` | 101/101 passed | 19 test files/suites; Dexie teardown menghasilkan warning connection delete, bukan test failure. |
| `npm run typecheck` | Passed | TypeScript noEmit. |
| `npm run build` | Passed | Vite build; 2,005 modules; PWA 25 entries (~1301.53 KiB); main JS 1,038.45 kB (~297.43 gzip), warning >500kB chunk. |
| `BASE_URL=http://127.0.0.1:4174 npx playwright test` | 34/40 passed, 6 failed | 2 old assertions × desktop/mobile: `.workspace-status`/literal old Demo banner, dan test mahu End memfokus “Demo Mode”. UI semasa banner copy berlainan, End fokus `About & Notice`; manual probes mengesahkan UI current. |
| Visual matrix | 240 renders | 8 routes × 3 tema × 10 size. Zero overflow/offscreen/page error. 48 screenshots disimpan. |
| Cross-browser mobile smoke | 24/24 routes | Chromium/Firefox/WebKit pada 390×844; zero console errors dan overflow. WebKit `innerWidth` effective 384 untuk beberapa route. |
| Production read-only browser smoke | 8/8 route render | No JS/console error, failed request, atau non-GET/HEAD/OPTIONS request. Bukan auth/sync test. |
| Drawer/avatar/backup/Ask Nemo probe | Partial flows pass | Escape/focus restore; upload/replace/persist/remove; backup JSON export; 5 intent counts; unknown prompt suggestions. |

## Skrip dan output

Dalam `docs/qa/artifacts/sprint53/`: `capture.mjs`, `cross-browser-smoke.mjs`, `production-smoke.mjs`, `functional-probe.mjs`, `interaction-audit.mjs`, `visual-interaction-matrix.json`. Output tambahan dalam subfolder `artifacts/`: `cross-browser-smoke-results.json`, `functional-probe-results.json`, `interaction-results.json`, disposable demo backup.

Ujian lama yang gagal bukan dikecualikan daripada kiraan. Test source perlu dikemas kini selepas owner meluluskan repair QA harness; 34/40 ialah keputusan sebenar, bukan 40/40.
