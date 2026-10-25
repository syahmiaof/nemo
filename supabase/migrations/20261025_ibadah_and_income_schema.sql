-- Supabase Migration: Ibadah Hub and Income Streams Schema
-- Version: 20261025_ibadah_and_income_schema

-- 1. Income Streams
CREATE TABLE IF NOT EXISTS public.income_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'salary_fixed' CHECK (type IN ('salary_fixed', 'freelance_project', 'passive_investment', 'business', 'other')),
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  date_received TEXT,
  month_year TEXT,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_items_user ON public.income_items(user_id, updated_at DESC);
ALTER TABLE public.income_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own income items"
  ON public.income_items
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 2. Alter Debts to support lumpsum_flexible debt type
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS debt_type TEXT DEFAULT 'installment';

-- 3. Ibadah Daily Logs
CREATE TABLE IF NOT EXISTS public.ibadah_daily_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  prayers JSONB NOT NULL DEFAULT '{}'::jsonb,
  sunnah_prayers JSONB NOT NULL DEFAULT '{}'::jsonb,
  quran_pages_read INTEGER NOT NULL DEFAULT 0,
  quran_juzuk_read INTEGER,
  quran_last_surah TEXT,
  quran_last_ayah INTEGER,
  quran_tadabbur_notes TEXT,
  dhikr_count INTEGER NOT NULL DEFAULT 0,
  sedekah_subuh_done BOOLEAN NOT NULL DEFAULT FALSE,
  fasting_status TEXT NOT NULL DEFAULT 'none' CHECK (fasting_status IN ('none', 'fardhu_ramadhan', 'qadha', 'sunnah_monday_thursday', 'sunnah_ayyamul_bidh', 'sunnah_other', 'nazar')),
  daily_reflection TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ibadah_daily_logs_user_date ON public.ibadah_daily_logs(user_id, date);
ALTER TABLE public.ibadah_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ibadah logs"
  ON public.ibadah_daily_logs
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 4. Qadha' Prayers
CREATE TABLE IF NOT EXISTS public.qadha_prayers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prayer_type TEXT NOT NULL CHECK (prayer_type IN ('subuh', 'zohor', 'asar', 'maghrib', 'isyak')),
  count_remaining INTEGER NOT NULL DEFAULT 0,
  count_completed INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_qadha_prayers_user_type ON public.qadha_prayers(user_id, prayer_type);
ALTER TABLE public.qadha_prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own qadha prayers"
  ON public.qadha_prayers
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 5. Qadha' Fasting & Fidyah
CREATE TABLE IF NOT EXISTS public.qadha_fastings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_hijri INTEGER NOT NULL,
  year_gregorian INTEGER NOT NULL,
  days_missed INTEGER NOT NULL DEFAULT 0,
  days_qadha_done INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  years_delayed INTEGER NOT NULL DEFAULT 0,
  fidyah_rate_per_day NUMERIC(10,2) NOT NULL DEFAULT 4.00,
  is_fidyah_paid BOOLEAN NOT NULL DEFAULT FALSE,
  fidyah_paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  fidyah_paid_at TEXT,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qadha_fastings_user ON public.qadha_fastings(user_id, year_gregorian DESC);
ALTER TABLE public.qadha_fastings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own qadha fastings"
  ON public.qadha_fastings
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());
