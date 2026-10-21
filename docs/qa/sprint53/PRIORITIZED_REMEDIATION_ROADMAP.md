# Remediation Roadmap untuk Antigravity

Audit ini tidak melaksanakan pembaikan. Batch di bawah direka supaya reviewer boleh authorize secara berasingan dan mengurangkan risiko pada data pengguna.

## Batch 0 — Credential containment (P0)

- Keluarkan fallback password dari client source/build; hentikan password plaintext `localStorage`; buang reveal/copy UI jika tidak ada reka bentuk auth yang memerlukan.
- Putuskan/rotate credential yang berada dalam source/build sebelum sesi ini. Jangan paparkan nilai dalam issue/log.
- Uji auth flow dan storage pada staging. Search built bundle untuk credential/fallback identifiers.
- Gate: tiada credential statik dalam source/dist; session sahaja disimpan mengikut provider; reset credential disahkan owner.

## Batch 1 — Sync integrity (P1, perlukan Supabase staging)

- Owner-scope outbox mutation; reject user mismatch.
- Apply remote tombstone secara lokal dan pastikan pull/push idempotent.
- Semak `.error` untuk setiap operasi bulk; hanya status up-to-date apabila semua pull/push/profile steps berjaya.
- Commit domain mutation + outbox secara atomic atau reconciliation scan semasa boot.
- Test dua user, dua device, offline, reconnect, partial failure, duplicate retry, delete dan migration.

## Batch 2 — Interaction completion (P2)

- Calendar event: open/edit/delete dari row, keyboard and touch; persistence.
- Clock format: sambung `hourFormat` kepada satu shared formatter bagi header, calendar dan time labels.
- Quick Search: include typed entity id and open detail/highlight result.
- Copy privacy: jelaskan local mode dan optional sync berdasarkan feature state sebenar.
- Ask Nemo: perluas phrase variants, empty-state behavior dan clarify unsupported query; test semua answer count ke repository.

## Batch 3 — Design/motion polish (P2)

- Stabilkan Overview chart/stack rhythm dan desktop nav proportions ikut owner-approved reference board.
- Orchestrate route exit/entry tanpa tween cancellation pada rapid navigation; tambah GSAP reduced-motion handling.
- Jajarkan component motion timings dan theme styling drawer; kawal blur area.
- Acceptance: screenshots 3 tema 320/390/768/1440, Playwright rapid nav, reduced motion, visual diff, Chrome trace low-end phone.

## Batch 4 — QA harness & performance (supporting)

- Kemas kini Playwright assertions terhadap current banner/tab; tambah journeys create-edit-delete-persistence dan cross-module links.
- Tambah E2E calendar events, search deep-link, preferences, restore, task relationships.
- Generate 100/1k/5k/10k local seed; ukur navigation/filter/chart/calendar, bundle route split dan perf budgets.
- A11y automate contrast and axe, kemudian keyboard and screen reader manual checklist.

Urutan disyorkan: Batch 0 segera, Batch 1 hanya selepas staging disahkan, Batch 2 dan 4 bebas, Batch 3 selepas keputusan komposisi/motion owner. Tiada batch perlukan source edit sebelum keputusan owner.
