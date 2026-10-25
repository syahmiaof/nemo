-- ============================================================================
-- Migration: 20261025_vision_board_schema.sql
-- Description: Vision Board Items schema with RLS and updated_at trigger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vision_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_thumbnail_url TEXT,
  horizon TEXT NOT NULL CHECK (horizon IN ('short_term', 'mid_term', 'long_term', 'north_star')),
  category TEXT NOT NULL CHECK (category IN ('wealth_finance', 'career_tech', 'travel_adventure', 'health_lifestyle', 'personal_spiritual', 'other')),
  target_date TEXT,
  estimated_cost NUMERIC(12,2),
  linked_goal_id TEXT,
  linked_savings_goal_id TEXT,
  why_it_matters TEXT,
  status TEXT NOT NULL DEFAULT 'dreaming' CHECK (status IN ('dreaming', 'in_progress', 'manifested')),
  manifested_at TIMESTAMPTZ,
  "order" INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vision_items_user ON public.vision_items(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vision_items_horizon ON public.vision_items(user_id, horizon);
CREATE INDEX IF NOT EXISTS idx_vision_items_category ON public.vision_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_vision_items_status ON public.vision_items(user_id, status);

ALTER TABLE public.vision_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vision_items' AND policyname = 'vision_items_owner_access'
  ) THEN
    CREATE POLICY "vision_items_owner_access"
      ON public.vision_items
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id AND public.is_approved_owner())
      WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vision_items_updated_at'
    ) THEN
      CREATE TRIGGER trg_vision_items_updated_at
        BEFORE UPDATE ON public.vision_items
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
  END IF;
END $$;
