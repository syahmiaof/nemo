# Nemo Sprint 5.4 — Executive Remediation Report

Tarikh: 2026-10-21  
Branch: `sprint54-astra-remediation`  
Scope: 12 dapatan asal Sprint 5.3; local-first application, Supabase access read-only untuk metadata sahaja.

## Status pemilik

Pembaikan source dan regression checks selesai. Full verification terakhir: Vitest 115/115 (23 fail), TypeScript pass, production build pass, dan Playwright 50/50 (25 Desktop Chrome + 25 Pixel 7 emulation).

Keselamatan P0 masih menjadi **release gate**: code path yang menyimpan/mendedahkan password telah dibuang dan migration pembetulan disediakan, tetapi historical credential pernah masuk Git history. Owner perlu rotate credential dan revoke session secara manual. Migration belum dijalankan pada production. Jangan promote sehingga tindakan itu selesai dan cloud auth diuji di staging.

## Apa yang dibaiki

- Auth tidak lagi menyimpan password plain text pada browser; panel akaun tidak boleh reveal/copy; admin perlu masukkan password secara eksplisit.
- Sync outbox dan entity write kini transactional serta owner-scoped. Legacy queue tanpa owner dikarantin dan tidak dipush automatik. Tombstone, failed sync, dan partial bulk upload diberi keputusan/error yang tepat.
- Calendar event editing, quick search focus, clock preference, privacy copy, serta variasi bahasa Ask Nemo diliputi ujian.
- Route transition menunggu stagger keluar selesai, menerima navigasi pantas, dan membersihkan GSAP inline opacity pada reduced motion. Overview chart tidak lagi memanjang ikut panel focus.
- Ujian Playwright lama diselaraskan dengan label dan tingkah laku UI semasa; tiada test dibuang atau diskip.

## Release recommendation

**NO-GO untuk production promotion buat masa ini.** Dua perkara perlu owner/environment: rotate credential terdedah + revoke session; sediakan staging untuk migrasi auth/sync dan ujian dua akaun/peranti. Lihat [Remaining Risks](REMAINING_RISKS.md) dan [Security Remediation](SECURITY_REMEDIATION_REPORT.md).

Tiada push, merge, deploy, atau Supabase write dibuat. Source changes akan dipisahkan kepada local commits yang mudah direview dan dipulihkan.

## Bukti dan had

- 48 screenshot current-state untuk 8 route × Midnight/Daylight/Aurora × desktop/mobile berada di `docs/qa/artifacts/sprint54/`.
- Screenshot Sprint 5.3 lama tidak digunakan sebagai bukti route kerana beberapa tangkapan berlaku sebelum intro selesai.
- Ujian sync remote menggunakan mock dan fake IndexedDB. Antigravity melaporkan tiada staging Supabase project; tidak ada user row dibaca.
- Vite build berjaya, tetapi main JS bundle ~1.05 MB menghasilkan chunk-size warning. Tiada frame-time/GPU benchmark dibuat.

## Dokumen berkaitan

- [Defect resolution matrix](DEFECT_RESOLUTION_MATRIX.md)
- [Security remediation](SECURITY_REMEDIATION_REPORT.md)
- [Functional repairs](FUNCTIONAL_REPAIR_REPORT.md)
- [CSS and GSAP refinement](CSS_GSAP_REFINEMENT_REPORT.md)
- [Playwright regression](PLAYWRIGHT_REGRESSION_REPORT.md)
- [Mobile visual verification](MOBILE_VISUAL_VERIFICATION.md)
- [Remaining risks](REMAINING_RISKS.md)
