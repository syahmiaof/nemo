-- ============================================================================
-- Migration: 20261024_finance_schema.sql
-- Description: Financial Profile, Monthly Commitments, Debts, Debt Payments,
--              Wishlist Items, Savings Goals, and Savings Deposits
-- Security: Row Level Security (RLS) with approved owner verification
-- ============================================================================

-- 1. Financial Profiles
CREATE TABLE IF NOT EXISTS public.financial_profiles (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_income_gross NUMERIC(12,2),
  monthly_income_net NUMERIC(12,2) NOT NULL DEFAULT 0,
  payday_day_of_month INTEGER NOT NULL DEFAULT 25 CHECK (payday_day_of_month BETWEEN 1 AND 31),
  currency TEXT NOT NULL DEFAULT 'MYR',
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_profiles_user ON public.financial_profiles(user_id, updated_at DESC);
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own financial profiles"
  ON public.financial_profiles
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 2. Monthly Commitments (Bills & Subscriptions)
CREATE TABLE IF NOT EXISTS public.financial_commitments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('needs', 'utilities', 'lifestyle', 'protection', 'other')),
  due_day_of_month INTEGER NOT NULL CHECK (due_day_of_month BETWEEN 1 AND 31),
  is_paid_this_month BOOLEAN NOT NULL DEFAULT FALSE,
  last_paid_month_year TEXT,
  notes TEXT,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_commitments_user ON public.financial_commitments(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_commitments_category ON public.financial_commitments(user_id, category);
ALTER TABLE public.financial_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own commitments"
  ON public.financial_commitments
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 3. Debts & Liabilities
CREATE TABLE IF NOT EXISTS public.debts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  creditor TEXT NOT NULL,
  original_principal NUMERIC(12,2) NOT NULL,
  current_balance NUMERIC(12,2) NOT NULL,
  monthly_installment NUMERIC(12,2) NOT NULL,
  interest_rate_percent NUMERIC(5,2),
  target_payoff_date TEXT,
  priority TEXT NOT NULL DEFAULT 'snowball' CHECK (priority IN ('snowball', 'avalanche', 'normal')),
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debts_user ON public.debts(user_id, updated_at DESC);
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own debts"
  ON public.debts
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 4. Debt Payments
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id TEXT NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_user ON public.debt_payments(user_id, debt_id, updated_at DESC);
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own debt payments"
  ON public.debt_payments
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 5. Wishlist Items (Anti-Impulse Purchase Planner)
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_price NUMERIC(12,2) NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  store_url TEXT,
  is_bought BOOLEAN NOT NULL DEFAULT FALSE,
  bought_at TIMESTAMPTZ,
  cooling_off_days INTEGER NOT NULL DEFAULT 7,
  target_savings_goal_id TEXT,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON public.wishlist_items(user_id, updated_at DESC);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist items"
  ON public.wishlist_items
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 6. Target Savings Goals (Sinking Funds)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('travel', 'gadget', 'emergency', 'vehicle', 'other')),
  target_date TEXT,
  color TEXT NOT NULL DEFAULT '#38BDF8',
  icon TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id, updated_at DESC);
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own savings goals"
  ON public.savings_goals
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 7. Savings Deposits & Withdrawals
CREATE TABLE IF NOT EXISTS public.savings_deposits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  savings_goal_id TEXT NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_deposits_user ON public.savings_deposits(user_id, savings_goal_id, updated_at DESC);
ALTER TABLE public.savings_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own savings deposits"
  ON public.savings_deposits
  FOR ALL
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 8. Updated At Triggers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE TRIGGER trg_financial_profiles_updated_at
      BEFORE UPDATE ON public.financial_profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER trg_financial_commitments_updated_at
      BEFORE UPDATE ON public.financial_commitments
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER trg_debts_updated_at
      BEFORE UPDATE ON public.debts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER trg_debt_payments_updated_at
      BEFORE UPDATE ON public.debt_payments
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER trg_wishlist_items_updated_at
      BEFORE UPDATE ON public.wishlist_items
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER trg_savings_goals_updated_at
      BEFORE UPDATE ON public.savings_goals
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

    CREATE TRIGGER trg_savings_deposits_updated_at
      BEFORE UPDATE ON public.savings_deposits
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

