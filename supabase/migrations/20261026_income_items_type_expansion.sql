-- Supabase Migration: Expand income_items_type_check constraint
-- Version: 20261026_income_items_type_expansion
-- Additive & backward-compatible union of legacy and new domain categories:
-- Legacy: 'salary_fixed', 'freelance_project', 'passive_investment', 'business', 'other'
-- Domain: 'monthly_salary', 'freelance_project', 'business_sales', 'passive_other'

ALTER TABLE public.income_items
  DROP CONSTRAINT IF EXISTS income_items_type_check;

ALTER TABLE public.income_items
  ADD CONSTRAINT income_items_type_check
  CHECK (type IN (
    'salary_fixed',
    'freelance_project',
    'passive_investment',
    'business',
    'other',
    'monthly_salary',
    'business_sales',
    'passive_other'
  ));
