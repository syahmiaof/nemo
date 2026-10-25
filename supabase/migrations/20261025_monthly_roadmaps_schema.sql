-- ==============================================================================
-- NEMO PRODUCTION MIGRATION: MONTHLY JOURNEY ROADMAP DOMAIN TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.monthly_roadmaps (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  theme text NOT NULL,
  primary_goal text NOT NULL,
  strategy text NOT NULL,
  mascot text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  completed_at timestamptz,
  notes text,
  version integer NOT NULL DEFAULT 1,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_monthly_roadmaps_user_year_month UNIQUE (user_id, year, month)
);

-- Indices for rapid sync delta querying
CREATE INDEX IF NOT EXISTS idx_monthly_roadmaps_user_updated
  ON public.monthly_roadmaps (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_monthly_roadmaps_user_year
  ON public.monthly_roadmaps (user_id, year, month);

-- Enable Row Level Security (RLS)
ALTER TABLE public.monthly_roadmaps ENABLE ROW LEVEL SECURITY;

-- Owner-only policy enforcing approved ownership
DROP POLICY IF EXISTS "monthly_roadmaps_owner_access" ON public.monthly_roadmaps;
CREATE POLICY "monthly_roadmaps_owner_access"
  ON public.monthly_roadmaps
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- Automatically update updated_at timestamp on record modification
DROP TRIGGER IF EXISTS trg_monthly_roadmaps_updated_at ON public.monthly_roadmaps;
CREATE TRIGGER trg_monthly_roadmaps_updated_at
  BEFORE UPDATE ON public.monthly_roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
