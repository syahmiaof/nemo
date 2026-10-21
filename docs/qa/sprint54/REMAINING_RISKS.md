# Sprint 5.4 — Remaining Risks and Owner Actions

## Release blockers

1. **Exposed historical credential:** active client persistence/reveal paths are removed, but historical Git objects can still contain the old secret. Owner must rotate it and revoke sessions; no replacement was selected. See `SECURITY_REMEDIATION_REPORT.md`.
2. **No staging Supabase project:** Antigravity reports the connected project is production-only and no disposable test accounts exist. Do not validate migrations, member RPC, RLS, account isolation or cross-device sync against real production users.
3. **Migration pending:** `20261021170000_remove_default_member_password.sql` has not been applied. Test in staging, then follow the owner's production release process.

## Sync and data recovery limits

- `workspace_assets` is reported to lack `is_deleted`; offline tombstone propagation for assets requires a deliberate remote schema migration. Existing asset delete is physical.
- Legacy outbox rows without account ownership remain quarantined and are never auto-assigned. The recovery path is explicit “Upload local workspace to cloud” consent or manual recovery; there is no per-row reassignment UI.
- IndexedDB crash durability and error paths are covered with fake IndexedDB/mocks, not process-kill tests or real network retries between two devices.
- Sync conflict, duplicate prevention and remote asset upload/download were not independently verified against Supabase staging.

## Product and platform follow-up

- Quick Search task, assignment and event selection have browser assertions; project/goal/milestone selection branches need dedicated E2E assertions.
- Full physical-device tests and WebKit/iOS emulation remain separate. No GPU/frame-time profile was recorded.
- Screenshot captures are at 390×844 and 1440×900. Responsive assertions cover 320–1440, but the specific overview comparison at 1280/1920 and focus-card counts 1–3 remains follow-up evidence.
- Main production JS bundle is ~1.05 MB minified and triggers Vite's 500 KB chunk warning. Consider route-level code splitting after the security release gate.
- Automated contrast checks against every state, screen-reader testing and 10,000-record browser interaction latency were not run in this turn. Existing unit stress fixtures only test synthetic mapping/partition budgets, not end-to-end UI latency.

## Release recommendation

Keep production promotion blocked until the owner completes credential rotation/session revocation and the migration/sync flows pass in an isolated staging project. No production write or deployment was performed.
