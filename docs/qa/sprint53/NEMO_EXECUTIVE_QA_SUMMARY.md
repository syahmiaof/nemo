# Nemo Sprint 5.3 — Ringkasan QA Eksekutif

Tarikh audit: 21 Oktober 2026 · HEAD: `12ae8006dc882aafe3b36fe42df9a2526595dd09` · branch `main` · working tree bersih pada permulaan audit.

## Keputusan

**CRITICAL — DATA/SECURITY RISKS.** Build production semasa mendedahkan credential fallback di client bundle dan menyimpan password secara plaintext di `localStorage`. Semakan kod juga mengesan queue sync tanpa pemilik akaun, tombstone delete tidak diproses semasa pull, serta laluan sync yang boleh melaporkan kejayaan walaupun operasi bulk gagal. Ini penemuan audit kod dan pengesahan bundle; tiada cubaan login, sync atau mutation ke Supabase production dibuat.

## Liputan dan bukti

- 8 route utama: Overview, Projects, Tasks, Calendar, Academics, Goals, Insights, Settings.
- 240 render checks untuk 8 route × 3 tema × 10 viewport, 320×640 hingga 1920×1080; tiada horizontal overflow, control di luar viewport atau page error dalam matriks. Skrip tidak menggunakan 320×568 tepat yang diminta; 320×640 ialah viewport terkecil yang direkodkan.
- 48 screenshot: setiap route pada 390px dan 1440px dalam Midnight, Daylight dan Aurora. Fail berada di `../artifacts/sprint53/` relatif repo.
- Ujian ringkas mobile 390×844 pada Chromium, Firefox dan WebKit: 24/24 route renders lulus tanpa console error; WebKit melaporkan lebar layout efektif 384px pada sesetengah route kerana scrollbar/viewport behavior.
- Unit: 101/101 lulus. Typecheck lulus. Production build lulus.
- E2E penuh Chromium desktop/mobile: 34/40 lulus. Enam gagal ialah assertion lama terhadap label Demo banner dan tab terakhir “Demo Mode”; UI semasa menunjukkan banner baharu dan tab “About & Notice”. Manual probe mengesahkan kedua-dua tingkah laku UI semasa. Ini hutang test, bukan enam bug produk.
- Production read-only smoke 8/8 route render; tiada JS/console error, failed request atau HTTP method selain GET/HEAD/OPTIONS dikesan.
- 1,275 instance control diinventori merentas snapshots 390px (131 signature unik). Inventori automatik belum klik setiap signature; interaksi coverage penuh tidak dicapai.

## Penemuan disahkan

12 temuan dalam register: 1 P0, 4 P1, 7 P2. Tiada P3.

- P0: credential fallback dan password plaintext berada dalam kod/browser storage yang dihantar ke klien.
- P1: sync queue tidak terikat pada user; deletion remote tidak direplikasi ketika pull; error pada bulk upload boleh diabaikan; enqueue outbox berlaku selepas transaksi data dan error ditelan.
- P2: klik event Calendar tiada kesan; Clock Format disimpan tetapi paparan masa tidak berubah; Quick Search tidak membawa ID rekod ke route; privacy copy bercanggah dengan Cloud Sync; Ask Nemo hanya faham intent terpilih; exit animation route boleh dibatalkan oleh cleanup React; Overview mempunyai ketidakseimbangan komposisi desktop.

## Penilaian produk

Skor ialah penilaian editorial berdasarkan screenshot semasa, source review dan smoke; bukan metrik automatik: desktop 7/10, mobile 7/10, CSS 7/10, GSAP 6/10, konsistensi tema 7/10, hierarchy 7/10. Responsif dan tema asas kemas, tetapi interaksi data/cloud dan ketepatan motion perlukan perhatian. GPU/frame-time sebenar, screen reader, physical phones, offline/reconnect, multi-device sync dan workload 100–10,000 rekod belum diuji.

## 10 kerja pertama

| # | Masalah | Kesan | Bukti | Saiz |
|---|---|---|---|---|
| 1 | Buang credential fallback client-side; tamatkan/rotate credential | Akaun boleh diambil alih | `src/features/auth/AuthContext.tsx`, bundle production sepadan dengan build tempatan; credential sengaja tidak disalin ke laporan | M |
| 2 | Jangan simpan password plaintext dalam localStorage atau UI reveal/copy | Kebocoran daripada browser profile/devtools/backup | `AuthContext.tsx`, `AccountSyncPanel.tsx` | M |
| 3 | Scope setiap outbox mutation kepada user/workspace dan uji pertukaran akaun | Data user A boleh dihantar ketika user B aktif | `src/sync/syncEngine.ts`, `src/domain/types.ts` | L |
| 4 | Ingest tombstone dan buang/mark rekod tempatan ketika pull | Rekod dipadam muncul semula pada device lain | `src/sync/syncEngine.ts` | M |
| 5 | Propagate semua error bulk upload; status sync hanya berjaya selepas semua langkah sah | Sync boleh mendakwa data selamat padahal gagal | `src/sync/syncEngine.ts` | M |
| 6 | Jadikan write + outbox atomik atau tambah reconciliation scanner | Crash boleh tinggalkan perubahan lokal yang tak pernah sync | `src/sync/dexieHooks.ts` | L |
| 7 | Lengkapkan lifecycle Calendar event | Pengguna tak boleh buka/edit/delete event dari kalendar | `src/features/calendar/CalendarPage.tsx` | M |
| 8 | Sambungkan setting 12/24 jam kepada formatter sebenar | Preference tidak memberi kesan | `src/features/settings/SettingsPage.tsx` | S |
| 9 | Bawa `recordId` dari Quick Search dan fokus item sasaran | Search jump ke list sahaja | `src/app/QuickSearchModal.tsx` | M |
| 10 | Selaraskan Overview dan exit transition dengan benchmark yang diluluskan | Rhythm desktop/motion kurang rapat | screenshot `midnight-1440-overview.png`; `src/index.css`, `src/app/RouteTransition.tsx` | M |

## Keputusan yang perlukan owner

- Tentukan sama ada Cloud Sync ialah ciri rasmi untuk pengguna, supaya privacy notice “no cloud sync” boleh disemak dengan fakta produk.
- Sediakan staging Supabase atau test project isolated sebelum QA auth, RLS, two-device convergence dan deletion round-trip.
- Pilih sasaran parity Tavola yang disukai: komposisi dashboard dan tempo motion perlu keputusan visual owner; laporan ini hanya mencadangkan arah, tidak menyalin aset/kod.

Semua cadangan belum dilaksanakan. Audit berhenti di sini untuk semakan owner; tiada source edit, push, merge atau deploy.
