# Nemo Authentication & Cloud Security Report (Sprint 5)

## 1. Security Scope & Objectives

The goal of Sprint 5 security engineering was to ensure that Nemo's transition from pure-local storage to hybrid cloud sync remains 100% private to the owner (`syahmiaof123@gmail.com`), with zero possibility of data leakage to unauthorized third parties or public internet scrapers.

---

## 2. Row Level Security (RLS) Verification

Every table in Supabase PostgreSQL has RLS enabled:
- `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;`

### 2.1 The `is_approved_owner()` Server-Enforced Boundary
```sql
CREATE OR REPLACE FUNCTION public.is_approved_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_email TEXT;
BEGIN
  caller_email := NULLIF(current_setting('request.jwt.claims', true)::json ->> 'email', '');
  IF caller_email IS NULL THEN
    caller_email := (SELECT email FROM auth.users WHERE id = auth.uid());
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.app_owners
    WHERE lower(email) = lower(caller_email)
      AND is_approved = TRUE
  );
END;
$$;
```

### 2.2 Attack Surface Assessment
1. **Unauthenticated / Anonymous Access:**
   - Attempt: Query `supabase.from('projects').select('*')` without JWT.
   - Result: Returns empty array `[]` (Denied by RLS).
2. **Third-Party Registered User:**
   - Attempt: Attacker signs up with `intruder@gmail.com`, obtains valid JWT, attempts to read or insert into `projects`.
   - Result: `public.is_approved_owner()` evaluates to `false`. RLS blocks both read and write queries.
3. **Client-Side Secret Leakage:**
   - Audited all frontend source code. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used.
   - `SERVICE_ROLE_KEY` is completely absent from all source files, bundles, and git commits.
4. **Demo Mode Airgap:**
   - Dexie sync hooks are conditioned on `getWorkspaceMode() === 'real'`.
   - Fictional exploration in `nemo_db_demo` never triggers `syncEngine.enqueueMutation`.

---

## 3. Storage Privacy

- Bucket: `workspace_assets` (Private, public access = `false`).
- Policy: `workspace_assets_owner_access` requires authenticated JWT matching owner ID and `is_approved_owner()`.
