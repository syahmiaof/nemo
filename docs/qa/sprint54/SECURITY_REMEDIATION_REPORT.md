# Sprint 5.4 — Security Remediation

## P0 root cause and containment

The audit found a client-side owner-password fallback, password persistence in browser `localStorage`, UI controls that could reveal/copy it, and a default password in the member-creation RPC. These expose an authentication secret to browser storage/source and make it unsafe to treat source removal as sufficient after the value entered Git history.

The client now removes the legacy storage key on provider startup, performs authentication through Supabase Auth, and no longer writes/reveals/copies the password. Admin member creation requires a newly entered password and its success message does not echo the value. A forward correction migration removes the insecure default from the RPC without resetting existing accounts. No credential value or hash is included here.

## Evidence

- `tests/unit/auth_context_security.test.tsx`: startup removes legacy plaintext storage; sign-in/password update do not cache or expose credentials.
- `tests/unit/admin_members_security.test.tsx`: explicit password required; success UI does not echo it.
- Supabase tests use mocks and local fixtures. No user rows were selected and no production write was made.
- `supabase/migrations/20261021170000_remove_default_member_password.sql` is prepared but not applied.

## Owner actions before release

1. Rotate the credential that was exposed in historical source/migration and revoke affected sessions using the owner's normal Supabase administration process. Codex did not choose or set a replacement password.
2. Confirm whether Git history rewrite is required by organizational policy. Rewriting shared history needs coordinated approval; no history rewrite was performed.
3. Apply and verify the correction migration in staging, then production under the normal migration process.
4. Use disposable staging accounts to test sign-in, password change, owner/admin authorization, RLS, and member lifecycle.

Antigravity reported the connected Supabase project is production-only, with no staging project or disposable user accounts available. Its metadata report says RLS is enabled on 14 tables. These facts were not independently verified through SQL or user-row access.

## Remaining security limits

- Removing the active source path does not erase historical Git objects, prior browser profiles, screenshots, or existing password state.
- The correction migration affects the RPC implementation for future calls; it does not rotate current users' passwords.
- Production auth/RLS and storage policy were not exercised in this remediation run.
