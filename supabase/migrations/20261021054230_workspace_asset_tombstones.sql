-- Add a durable delete marker so offline devices can learn about removed assets.
-- Existing rows remain active. Rollback is additive-only: ALTER TABLE ... DROP COLUMN is safe
-- only after the application no longer depends on asset tombstones.
ALTER TABLE public.workspace_assets
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

