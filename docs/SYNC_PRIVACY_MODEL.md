# Nemo Sync Privacy & Security Model (Sprint 5)

## 1. Local Privacy First

- **Zero Phoning Home by Default:** Nemo operates 100% offline without signing in. No tracking pixels, no telemetry beacons, no analytics endpoints.
- **Demo Workspace Airgap:** `nemo_db_demo` is completely physically isolated from cloud sync. It is impossible to upload demo records to an authenticated Supabase account.

---

## 2. Authenticated Data In Transit & At Rest

- **Transport Security:** All communication with Supabase uses TLS 1.3 over HTTPS/WSS.
- **At-Rest Encryption:** Cloud database records are encrypted using AES-256 by PostgreSQL on the managed Supabase host.
- **No Claim of E2EE Without Custom Vault:** Nemo does not falsely claim "End-to-End Encryption" unless client-side key derivation (e.g. WebCrypto PBKDF2/AES-GCM with a user-owned passphrase) is explicitly implemented and audited. Communication and storage security are enterprise-grade managed TLS and database-level encryption.

---

## 3. Account Lifecycle & Data Erasure

- **Sign Out Options:**
  1. *Keep local copy on this device* (recommended for personal laptops).
  2. *Wipe local cache upon sign-out* (mandatory for public/shared computers).
- **Delete Account (Right to Be Forgotten):**
  - Triggering "Delete Cloud Account" executes a cascade delete on Supabase:
    `DELETE FROM auth.users WHERE id = auth.uid()`
  - PostgreSQL foreign keys with `ON DELETE CASCADE` instantly wipe all cloud profiles, projects, tasks, assignments, and goals.
  - The local database presents an explicit confirmation whether to retain the data locally or purge local storage as well.
