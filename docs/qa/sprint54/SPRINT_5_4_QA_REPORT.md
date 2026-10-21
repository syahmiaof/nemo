# Nemo Sprint 5.4 — Remediation & Acceptance QA

Tarikh: 2026-10-21. Semua pemeriksaan dalam laporan ini berjalan pada checkout tempatan `sprint54-astra-remediation`; deployment production dan Supabase tidak diubah.

## Perubahan yang boleh disemak

- Auth tidak lagi menyimpan kata laluan dalam `localStorage` atau mendedahkannya melalui panel akaun. Panel admin meminta kata laluan secara eksplisit dan tidak memaparkannya semula. Migration pembetulan membuang kata laluan default daripada aliran penciptaan ahli; ia belum dijalankan pada production dan tidak mereset akaun sedia ada.
- Outbox sync kini berada dalam IndexedDB workspace bersama rekod, dan write tempatan/outbox menggunakan transaksi yang sama. Mutasi mempunyai pemilik akaun; rekod lama tanpa pemilik dikarantin dan tidak dipush automatik. Kegagalan pull/push dilaporkan sebagai sync error dan tombstone diproses untuk jadual yang menyokong `is_deleted`.
- Calendar events boleh dibuka dan disunting melalui kalendar atau Quick Search; paparan jam menggunakan preference 12/24 jam.
- Route exit menunggu animasi panel selesai sebelum menukar kandungan. Navigasi pantas memilih route terkini; mengaktifkan reduced motion membersihkan opacity GSAP yang tertinggal. Overview chart tidak lagi diregang mengikut tinggi panel fokus.
- QA E2E dikemaskini supaya memeriksa copy Demo semasa, tab terakhir yang sebenar, dan opacity secara stabil.

## Pengesahan

| Pemeriksaan | Hasil |
|---|---|
| Unit Vitest | 115/115 lulus, 23 fail ujian |
| TypeScript | `npm run typecheck` lulus |
| Production build | Lulus; PWA cache 25 fail (~1.31 MB). Bundle utama ~1.05 MB belum dipecahkan dan menghasilkan amaran saiz Vite. |
| Motion E2E terpilih | 6/6 lulus desktop/mobile, termasuk reduced motion dan rapid navigation |
| Demo/isolation + responsive + keyboard E2E terpilih | 7/7 lulus desktop/mobile selepas selector/expectation lama dibaiki |
| Visual captures | 48 screenshot: 8 route × 3 tema × desktop/mobile; 0 page error. Matriks: `../artifacts/sprint54/visual-capture-results.json`. |
| Full Playwright | 50/50 lulus (25 desktop + 25 mobile), termasuk Ask Nemo, PWA offline dan responsive matrix. |

Screenshot disimpan dalam `docs/qa/artifacts/sprint54/`, dinamakan mengikut tema, desktop/mobile, dan route. `capture-visual-qa.mjs` menunggu kandungan route siap, intro ditutup, font siap, dan UI stabil sebelum mengambil gambar.

## Pembetulan bukti Sprint 5.3

Screenshot lama Sprint 5.3 diambil selepas `DOMContentLoaded` dengan jeda 180 ms. Semakan visual menunjukkan beberapa fail menangkap welcome overlay/intro dan tidak boleh dianggap bukti rupa halaman route. Screenshot Sprint 5.4 menggunakan penantian route/intro/font yang lebih tepat. Tuntutan angka lama 240 render/48 screenshot kekal sebagai rekod run terdahulu, tetapi screenshot itu tidak digunakan untuk penerimaan visual Sprint 5.4.

## Had remote dan tindakan sebelum release

- Antigravity melaporkan projek Supabase yang dikonfigurasi ialah production dan tiada staging/test-user berasingan. Pengesahan sync dibuat dengan fake IndexedDB dan Supabase mock; tiada row pengguna dibaca dan tiada panggilan tulis production dibuat.
- Antigravity melaporkan RLS aktif pada 14 jadual dan `is_deleted` pada 10 jadual sync. `workspace_assets` tiada `is_deleted`, jadi delete aset remote masih fizikal dan tidak boleh direplay sebagai tombstone offline tanpa migration schema.
- Sejarah migration lama mengandungi credential default. Nilainya tidak disalin ke laporan atau output. Sebelum release, owner perlu rotate credential yang terdedah dan revoke session berkaitan. Migration pembetulan belum diaplikasikan ke production.
- Build berjaya tetapi bundle utama besar. Pecahan kod ialah kerja susulan prestasi; tiada dakwaan frame-time/GPU benchmark dibuat.
