# Nemo Cloud Sync Architecture (Sprint 5 Specification)

## 1. Executive Summary & Core Philosophy

Nemo follows a strict **Offline-First / Local-First** hybrid architecture:
- **Local Guest (Zero Barrier):** 100% functionality without an account, zero network calls, all data persisted in IndexedDB via Dexie.
- **Signed-in User (Optional Cloud Identity):** Enables cross-device continuity via Supabase Auth & PostgreSQL. Signing in is strictly opt-in and does NOT automatically push local data without explicit user consent.
- **Demo Mode Isolation:** Fictional exploration data is pinned to `nemo_db_demo` and is permanently excluded from cloud sync.

```
+-------------------------------------------------------------------------+
|                              NEMO CLIENT                                |
|                                                                         |
|  +--------------------+    Sync Mutex     +--------------------------+  |
|  | Local Dexie DB     | <===============> | Sync Engine Adapter      |  |
|  | (Primary Authority)|                   | (Background Queue Worker)|  |
|  +--------------------+                   +--------------------------+  |
|            |                                            |               |
|            v                                            v               |
|  +--------------------+                   +--------------------------+  |
|  | UI Reactive Hooks  |                   | Offline Mutation Queue   |  |
|  | (useLiveQuery)     |                   | (Dexie `sync_mutations`) |  |
|  +--------------------+                   +--------------------------+  |
+---------------------------------------------------------|---------------+
                                                          | HTTPS / WSS
                                                          v
                                            +--------------------------+
                                            | Supabase Cloud Platform  |
                                            | - Auth (PKCE / OTP)      |
                                            | - PostgreSQL (RLS)       |
                                            | - Realtime Channels      |
                                            | - Edge Functions         |
                                            +--------------------------+
```

---

## 2. Sync Engine Components & Lifecycles

### 2.1 Entity Tracking Metadata
Every syncable entity in Nemo (projects, tasks, milestones, assignments, semesters, subjects, goals, metrics) will include sync envelope attributes:
- `id`: Stable UUIDv4 (generated client-side, uniform across local and cloud).
- `user_id`: UUID of the authenticated owner (NULL in local guest mode).
- `client_updated_at`: ISO 8601 timestamp of client modification.
- `server_updated_at`: TIMESTAMPTZ managed exclusively by Postgres triggers.
- `version`: Integer sequence monotonically incremented on each mutation.
- `is_deleted`: Boolean tombstone flag (hard deletes are disallowed in sync).

### 2.2 Offline Mutation Queue (`sync_mutations` table in IndexedDB)
Whenever a user mutates data while authenticated with Sync enabled:
1. Transaction writes to local entity table (instant UI feedback via `useLiveQuery`).
2. Mutation payload is appended to `sync_mutations`:
   ```typescript
   interface SyncMutation {
     id: string; // UUID
     entityType: 'project' | 'task' | 'assignment' | 'milestone' | 'goal' | 'settings';
     entityId: string;
     operation: 'UPSERT' | 'DELETE';
     payload: Record<string, unknown>;
     clientTimestamp: string;
     retryCount: number;
     status: 'pending' | 'in_flight' | 'failed';
   }
   ```
3. Sync worker processes queue with exponential backoff (`2s`, `4s`, `8s`, `16s`, max `60s`).
4. On server acknowledgement, mutation record is purged from the local queue.

---

## 3. Online/Offline Transition Strategy

- **Browser Network Events:** The engine listens to `navigator.onLine`, `window.addEventListener('online')`, and periodic WebSocket heartbeats.
- **Backoff & Jitter:** Network reconnections trigger queue draining with a randomized 0–1.5s jitter to prevent thundering herd issues across multiple open tabs.
- **Web Lock API (`navigator.locks`):** Ensures only a single browser tab acts as the primary Sync Leader, preventing duplicate uploads or conflicting parallel pushes.

---

## 4. Initial Sync & Dataset Merging Protocol

When a user signs in for the first time with existing local data:
1. **Pre-flight Check:** Probe Supabase for existing cloud records for this `user_id`.
2. **Scenario A (Fresh Cloud Account):**
   - User prompted: *"Upload your local data to your new cloud account?"*
   - On consent, a local backup JSON is created automatically in IndexedDB.
   - Local records are tagged with `user_id` and batch-pushed to Supabase.
3. **Scenario B (Cloud Account Has Data):**
   - Prompt user with explicit options:
     - **Option 1: Merge** (Keep both; newer timestamp wins; conflicting titles get duplicate copy suffix).
     - **Option 2: Replace Local** (Download cloud workspace; stash local data as a recoverable timestamped backup).
     - **Option 3: Keep Local Separate** (Stay in Local Guest mode).
4. No silent destructive overwrites are permitted under any condition.

---

## 5. Security & Key Management

- **Client Configuration:** Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` are exposed in frontend environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Never In Code:** `SERVICE_ROLE_KEY` is strictly prohibited from frontend code and Vite bundles.
- **Row-Level Security (RLS):** Every PostgreSQL table enforces `auth.uid() = user_id`.
