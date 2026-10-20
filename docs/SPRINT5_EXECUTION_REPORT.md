# Nemo Sprint 5 Execution Report: Private Cloud Sync & Multi-Agent Architecture

## 1. Executive Summary

Sprint 5 successfully implemented genuine cross-device synchronization between Nemo's offline-first local IndexedDB storage and the owner's Supabase project (`koiugvkflppdvafpszrk`) in Sydney (`ap-southeast-2`).

- **Target Architecture:** Local-First Hybrid. All reads and writes hit IndexedDB via Dexie instantly. Offline operations remain 100% functional without internet connectivity.
- **Private Single-Owner Mode:** Exclusively approved for `syahmiaof123@gmail.com`. Server-enforced via PostgreSQL `SECURITY DEFINER` function `public.is_approved_owner()`. Unapproved accounts and anonymous queries are denied access by Row Level Security (RLS) on all 14 tables.
- **Outbox & Sync Engine:** Dexie hooks capture local mutations into a dedicated `nemo_sync` outbox store (`syncMutations`) without polluting or blocking domain transactions. Sync engine pushes outbox mutations with exponential backoff and pulls remote delta changes upon reconnect.
- **Conflict Resolution:** Non-destructive field-level merges (status + title/details both preserved), 3-way notes draft append on concurrent text edits, and deterministic Last-Write-Wins (LWW) for scalar properties.
- **Visual Refinements:**
  - Removed exact label `Personal workspace · Saved on this device` and surrounding bar.
  - Top header refined to Tavola benchmark with discrete `<SyncIndicator />`.
  - Added full **Account & Sync** panel in Settings.
- **Test Results:** 80 passing unit tests (16 test files, 100% green, 0 regressions). Production build succeeded.

---

## 2. Remote Database & Storage Configuration

- **Database:** PostgreSQL on Supabase (`koiugvkflppdvafpszrk`)
- **Region:** Oceania / Sydney (`ap-southeast-2`)
- **Tables Deployed:**
  1. `public.app_owners` (single-owner whitelist seeded with `syahmiaof123@gmail.com`)
  2. `public.profiles`
  3. `public.projects`
  4. `public.tasks`
  5. `public.milestones`
  6. `public.semesters`
  7. `public.subjects`
  8. `public.assignments`
  9. `public.calendar_events`
  10. `public.goals`
  11. `public.goal_task_links`
  12. `public.focus_selections`
  13. `public.workspace_assets`
  14. `public.sync_audit_log`
- **Primary Keys:** String `TEXT PRIMARY KEY` to seamlessly interoperate with client-generated entity IDs (`proj_...`, `task_...`, UUIDs).
- **Triggers:** Automated `BEFORE UPDATE` trigger `set_updated_at()` applied across all mutable tables.
- **Storage:** Private storage bucket `workspace_assets` configured with owner-locked RLS policy.

---

## 3. Security Boundary & RLS Policies

All user tables enforce:
```sql
CREATE POLICY "<table_name>_owner_access"
  ON public.<table_name> FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());
```
Any user authenticated with an email other than `syahmiaof123@gmail.com` receives `false` from `public.is_approved_owner()` and is completely denied SELECT, INSERT, UPDATE, and DELETE queries at the database layer.

---

## 4. Verification Evidence

- **Unit Test Suite:**
  - `tests/unit/sync_engine.test.ts`: Passed (5 tests)
  - `tests/unit/auth_security.test.ts`: Passed (4 tests)
  - Full suite: 16 test files, 80 tests passed in 22.86s.
- **Production Build:**
  - `tsc -b && vite build` succeeded in 21.48s.
- **Git Branch:** `sprint5-private-cloud-sync` preserved cleanly without uncommitted conflicts.
