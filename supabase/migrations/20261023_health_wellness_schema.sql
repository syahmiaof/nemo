-- Nemo Sprint 6 Health & Wellness Relational Schema Migration
-- Database: PostgreSQL / Supabase
-- Target Project: nemo (ap-southeast-2)
-- Version: 20261023_health_wellness_schema
-- Description: Adds tables, RLS security policies, updated_at triggers, and composite
-- indexes for the Health & Wellness suite (Hydration, Diet, Workout Logs, Body Metrics).

-- ============================================================================
-- 1. Hydration Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hydration_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_updated ON public.hydration_logs(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON public.hydration_logs(user_id, date DESC);

ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hydration_logs_owner_access" ON public.hydration_logs;
CREATE POLICY "hydration_logs_owner_access"
  ON public.hydration_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

DROP TRIGGER IF EXISTS trg_hydration_logs_updated_at ON public.hydration_logs;
CREATE TRIGGER trg_hydration_logs_updated_at
  BEFORE UPDATE ON public.hydration_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. Diet Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diet_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  calories NUMERIC(8, 2) NOT NULL CHECK (calories >= 0),
  protein_g NUMERIC(6, 2) CHECK (protein_g >= 0),
  carbs_g NUMERIC(6, 2) CHECK (carbs_g >= 0),
  fat_g NUMERIC(6, 2) CHECK (fat_g >= 0),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diet_logs_user_updated ON public.diet_logs(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diet_logs_user_date ON public.diet_logs(user_id, date DESC);

ALTER TABLE public.diet_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diet_logs_owner_access" ON public.diet_logs;
CREATE POLICY "diet_logs_owner_access"
  ON public.diet_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

DROP TRIGGER IF EXISTS trg_diet_logs_updated_at ON public.diet_logs;
CREATE TRIGGER trg_diet_logs_updated_at
  BEFORE UPDATE ON public.diet_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. Workout Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  type TEXT NOT NULL CHECK (type IN ('running', 'jogging', 'cycling', 'strength', 'hiit', 'custom')),
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  distance_km NUMERIC(6, 2) CHECK (distance_km >= 0),
  calories_burned INTEGER CHECK (calories_burned >= 0),
  exercises JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_updated ON public.workout_logs(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, date DESC);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_logs_owner_access" ON public.workout_logs;
CREATE POLICY "workout_logs_owner_access"
  ON public.workout_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

DROP TRIGGER IF EXISTS trg_workout_logs_updated_at ON public.workout_logs;
CREATE TRIGGER trg_workout_logs_updated_at
  BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. Body Metrics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.body_metrics (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL CHECK (date ~ '^\d{4}-\d{2}-\d{2}$'),
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0),
  body_fat_percent NUMERIC(4, 1) CHECK (body_fat_percent >= 0 AND body_fat_percent <= 100),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_updated ON public.body_metrics(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date ON public.body_metrics(user_id, date DESC);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "body_metrics_owner_access" ON public.body_metrics;
CREATE POLICY "body_metrics_owner_access"
  ON public.body_metrics FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

DROP TRIGGER IF EXISTS trg_body_metrics_updated_at ON public.body_metrics;
CREATE TRIGGER trg_body_metrics_updated_at
  BEFORE UPDATE ON public.body_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
