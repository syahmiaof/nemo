# Auth, Sync, Local Data & Offline Audit

## Keputusan keselamatan

**Jangan gunakan cloud sync production untuk regression test misi ini.** Tiada Supabase write dilakukan. Isu credential client-side dianggap P0 dan perlu ditangani sebagai repair security batch sebelum memberi kepercayaan pada multi-device sync.

## Temuan source-confirmed

1. `src/features/auth/AuthContext.tsx:25-39,145-178` ada fallback credential di source client dan password aktif/ditukar disimpan di localStorage. `AccountSyncPanel.tsx:231-275` membenarkan reveal/copy password. Nilai credential sengaja tidak disalin ke laporan, screenshot atau output. Production JS asset mempunyai nama yang sama dengan build audit lokal, jadi kod berisiko ini nampak deployed pada asset semasa; jangan log masuk untuk “mengesahkan” credential.
2. `SyncMutation` tiada owner id (`src/domain/types.ts:202-213`). `setAuthenticatedUser(null)` menukar identity state tetapi queue dikekalkan (`src/sync/syncEngine.ts:69-92`); push iterates pending mutations dan menggunakan user semasa (`:217-301`). Risiko cross-account.
3. Push tombstone sebagai `is_deleted=true`, pull query menapis `is_deleted=false` dan tiada pemprosesan tombstone (`:265-274,312-447`). Device kedua boleh simpan rekod yang telah dipadam.
4. `executeSyncCycle` boleh set status up-to-date selepas pull path yang skip errors; `uploadAllLocalData` mengabaikan error `.upsert`, menaikkan kiraan dan melaporkan berjaya (`:176-200,526-640`).
5. Dexie hook menjadual enqueue outbox selepas write melalui `setTimeout(0)` dan catch/ignore failure (`src/sync/dexieHooks.ts:24-47`). Kerosakan/close pada sela masa ini boleh meninggalkan record tempatan tiada mutation queue. Laporan durability lama menyebut scanner; implementation semasa yang diperiksa tidak mengesahkan tuntutan tersebut.

## Yang belum diuji

Auth login/logout/session restore/expiry, Supabase RLS, conflict resolution, offline queue/reconnect, two-device convergence, schema/migration production, restore ke workspace aktif dan sync latency — semua **BLOCKED / NOT RUN** kerana staging isolated credentials/project tidak dibuktikan tersedia. Build dan smoke production yang dilakukan hanya GET. Ujian ini tidak boleh dianggap bukti security certification.

## Syarat staging untuk acceptance

Gunakan projek Supabase staging berasingan dengan dua akaun test yang tiada kaitan owner. Uji account switching ketika outbox pending, tombstone per entity, inject network/database errors, relaunch antara Dexie commit/enqueue, retry/idempotency, RLS antara akaun, dan compare dua device. Sediakan test seed/disposable records dan bersihkan hanya workspace staging.
