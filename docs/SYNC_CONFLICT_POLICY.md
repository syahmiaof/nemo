# Nemo Sync Conflict Resolution Policy (Sprint 5)

## 1. Principles of Data Preservation

In a personal productivity tool, silent loss of notes, tasks, or assignment progress is unacceptable.
Nemo's sync conflict policy adheres to three core rules:
1. **Never Silently Overwrite User Text:** If two devices edit notes or task details concurrently while offline, the local edit must not vanish into thin air.
2. **Determinism:** If conflict resolution runs independently on two devices, both must converge to the same mathematical end-state.
3. **Transparent Notification:** Any structural divergence generates an item under *Settings → Account & Sync → Conflict Review*.

---

## 2. Resolution Strategies by Entity & Field Type

| Entity | Conflict Scenario | Resolution Strategy | Post-Action |
| :--- | :--- | :--- | :--- |
| **Task / Assignment Status** | Device A marks `done`, Device B edits `title` | **Field-Level Merge:** Title takes B's edit, status takes `done`. Both changes survive. | No user intervention needed. |
| **Task / Project Notes** | Simultaneous offline edits with conflicting paragraphs | **Three-Way Text Append:** Keep server version; append conflicting local edits under `--- Local Conflict Draft (YYYY-MM-DD HH:mm) ---`. | Flagged in UI for review. |
| **Concurrent Deletion vs Update** | Device A deletes Task 123, Device B updates Task 123 dueDate | **Resurrection on Update:** If `client_updated_at(B) > client_deleted_at(A)`, unmark tombstone `is_deleted = false` with B's new due date. | Logged in sync audit trail. |
| **Today's Focus Slots (Max 3)** | Two devices select different focus tasks totaling > 3 | **Priority & Timestamp Sort:** Rank by highest priority first, then latest `updatedAt`. Top 3 remain focus; remainder drop to normal backlog. | User toast: "Focus list synchronized." |
| **Settings / Theme** | Last-Write-Wins (LWW) based on `client_updated_at`. | Simple scalar LWW. | Active tab updates instantly. |

---

## 3. Conflict State Machine

```
[Local Mutation Created] ───> [Sync Engine Probes Cloud]
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │ Remote Version Match?                             │
           ▼ YES                                               ▼ NO (Higher Remote Version)
    [Direct Upsert]                                    [Detect Divergence]
           │                                                   │
           ▼                                                   ▼
     [Sync Success]                                  [Apply Field Policy]
                                                               │
                                       ┌───────────────────────┴───────────────────────┐
                                       ▼ Clean Merge                                   ▼ Text Collision
                                [Write Merged Version]                        [Write Remote + Append Draft]
                                       │                                               │
                                       ▼                                               ▼
                                 [Sync Success]                              [Enqueue Conflict Alert]
```

---

## 4. Disaster Recovery & Snapshot Safety

Before applying any remote sync pull that alters more than 5 entities:
1. A snapshot of local IndexedDB is compressed and saved into `localStorage.getItem('nemo_pre_sync_snapshot')` or a dedicated Dexie recovery table.
2. If referential integrity fails during merge, the transaction is rolled back and the local workspace remains in *Offline, Changes Pending* state.
