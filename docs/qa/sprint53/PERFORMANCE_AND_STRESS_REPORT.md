# Performance & Stress Report

## Ukuran yang tersedia

- Production bundle dan fresh local build memberi nama asset sama: JS `index-BIT30_--.js`, CSS `index-SVtoDDHB.css`.
- Build berjaya, 2,005 modules. Main JS 1,038.45 kB uncompressed (297.43 kB gzip); Vite memberi amaran chunk melebihi 500 kB.
- PWA precache: 25 entries, ~1301.53 KiB.
- Route/viewport/theme matrix 240 render, tiada overflow/control-offscreen/page error. Ini layout smoke, bukan load-time benchmark.
- Production 8 route smoke render pada mobile emulation; failed request/console errors kosong.

## Tidak diuji

Brief meminta 100/1,000/5,000/10,000 tasks dengan related records, initial load/navigation/filter/chart/calendar timings, memory growth, frame drops, throttled network dan offline/reconnect. Semua ini **NOT TESTED**; tidak ada benchmark fixture/profiler yang dijalankan dalam audit read-only ini. Cloud stress production sengaja dielakkan.

## Risiko dan langkah ukuran

- Bundle utama besar untuk mobile cold start. Pecahkan route-level features/chart/admin settings dengan dynamic import; ukur LCP/INP dan transfer gzip pada throttling sebelum merge.
- Blur glass dan aurora gradient besar mungkin mahal untuk compositing; capture Chrome Performance trace di phone kelas rendah dan banding reduced motion.
- Siapkan seed generator lokal di IndexedDB profile temporary untuk 100–10k tasks dan linked records. Jalankan filter/sort/calendar render dengan 3 warm-up + 10 measurement; laporkan median/p95, memory snapshots dan DOM node count.
- Benchmark service worker cold/offline/reconnect hanya di local/staging; pastikan stale cache dan pending queue correctness.

Tiada claim tentang 60fps, memory leak atau load time dibuat tanpa ukuran.
