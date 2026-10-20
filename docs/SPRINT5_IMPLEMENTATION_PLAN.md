# Nemo Sprint 5 Implementation Plan (Cloud Identity & Multi-Device Sync)

## 1. Phased Roadmap

| Phase | Milestone | Deliverables | Gate |
| :--- | :--- | :--- | :--- |
| **Phase 5.1** | Supabase Project Setup & Auth Scaffolding | Supabase Client init, `@supabase/supabase-js`, PKCE auth flows (OTP magic links, email auth). | Auth unit tests; zero leaks of secret keys. |
| **Phase 5.2** | PostgreSQL Schema & Migration Runner | Tables created (`profiles`, `projects`, `tasks`, `semesters`, `subjects`, `assignments`), RLS security policies enabled. | Cross-user query rejection tests. |
| **Phase 5.3** | Dexie Mutation Queue & Sync Adapter | `sync_mutations` table in IndexedDB, worker loop with exponential backoff and Web Lock concurrency. | Offline queue drained on network recovery. |
| **Phase 5.4** | Conflict Resolver & Merge Engine | Field-level merge functions, notes append conflict policy, and recovery snapshots. | Vitest conflict matrix verification. |
| **Phase 5.5** | UI Controls (*Settings → Account & Sync*) | Account status badge, Sign in / Sign up modal, "Enable Sync" explicit consent toggle, Force Sync, Conflict Review panel. | Responsive layout, dark/light/aurora theme fidelity. |
| **Phase 5.6** | Multi-Device Realtime Verification | Playwright two-browser concurrency tests, offline disconnect/reconnect simulation. | Realtime update propagation within 800ms. |

---

## 2. Configuration Needed from Project Owner

To activate Sprint 5 when ready, the repository owner must provide two public environment variables in `.env` (or Vercel Dashboard):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

> [!CAUTION]
> Never place the Supabase `service_role` secret key in any frontend file, repository commit, or client-side build config.

---

## 3. Strict Pre-Requisite for Enabling Sync
Under no circumstances will remote syncing be activated during Sprint 4. The entire codebase remains offline-first until Sprint 5 execution is formally ordered by the product owner.
