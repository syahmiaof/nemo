# Nemo Cross-Device Synchronization Verification Protocol (Sprint 5)

## 1. Scope & Verification Strategy

This document describes the verified cross-device sync workflow between Device A (Laptop) and Device B (Mobile Phone) for the owner (`syahmiaof123@gmail.com`).

---

## 2. Tested Journey & Expected Behaviors

### Step 1: Laptop Initial Sync
1. Open Nemo on Laptop (`https://nemo.syahmiaof.my` or local build).
2. Existing local workspace data resides in Dexie IndexedDB (`nemo_db`).
3. Click `<SyncIndicator />` in top header or navigate to *Settings → Account & Sync*.
4. Enter owner email `syahmiaof123@gmail.com` and click "Hantar Kod OTP".
5. Enter received 6-digit code.
6. Click "Muat Naik Semua Data Tempatan ke Awan".
7. All 10 entity stores (projects, tasks, semesters, subjects, assignments, milestones, goals, events, focus) are batch-upserted into Supabase PostgreSQL.

### Step 2: Mobile Phone Onboarding
1. Open Nemo in Safari or Chrome on Mobile Phone.
2. Navigate to *Settings → Account & Sync*.
3. Enter `syahmiaof123@gmail.com` and authenticate via OTP.
4. The sync engine automatically issues `pullRemoteDelta()`.
5. All cloud projects, tasks, and settings are replicated into mobile IndexedDB.
6. PWA functions 100% offline with zero network latency.

### Step 3: Offline Mutation & Reconnect
1. On phone, switch to Airplane Mode.
2. Mark a task as completed and create a new task.
3. Mutations are queued in `syncDb.syncMutations` (status: `pending`).
4. Reconnect to internet.
5. Network `online` event fires; sync engine locks mutex and flushes pending mutations to Supabase.
6. Open laptop: laptop pulls updated records and reconciles non-destructively.
