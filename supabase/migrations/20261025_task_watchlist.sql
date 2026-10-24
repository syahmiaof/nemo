-- Migration: Add is_watchlist support to public.tasks
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_watchlist BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tasks_user_watchlist 
ON public.tasks(user_id, is_watchlist);
