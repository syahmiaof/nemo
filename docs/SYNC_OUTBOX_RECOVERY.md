# Sync outbox ownership and recovery

The active mutation outbox is stored in the same IndexedDB database as workspace records. Each mutation created while signed in carries that account's user ID. The sync engine only pushes rows whose owner matches the current account.

Rows created before owner attribution was introduced stay ownerless. On the first sync cycle, legacy `NemoSync` rows are copied into the workspace outbox without changing or deleting their original records. These copies are quarantined: signing in does not assign them to the current account, and the engine never pushes them. This prevents old local changes from leaking into whichever account happens to sign in next.

To sync the current workspace after choosing the intended account, open **Settings → Account & Sync → Upload local workspace to cloud** and explicitly consent to the upload. This uploads the current local records through the existing bulk-upload flow and reports table-level failures. It does not relabel or replay legacy ownerless mutations. Those legacy bytes remain available locally for manual recovery; there is currently no per-row reassignment UI. Do not assign an owner based only on the currently signed-in session.

Remote deletes are pulled from tombstone-enabled tables. The deployed `workspace_assets` table has no `is_deleted` column, so asset deletion uses a physical remote delete and cannot propagate as an offline tombstone until the remote schema is deliberately extended in a separately approved migration.

Verification stays local and deterministic: mocked Supabase responses and fake IndexedDB cover account filtering, legacy preservation/quarantine, tombstone application, surfaced sync errors, bulk-upload partial counts, and atomic local-write/outbox rollback. No staging Supabase project is available; do not use production as a test target.
