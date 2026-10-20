-- Nemo Sprint 5 Cloud Sync Migration
-- Database: PostgreSQL / Supabase
-- Target Project: nemo (ap-southeast-2)

-- 1. Helper function for automated updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Approved App Owners Table (Single-owner enforcement)
CREATE TABLE IF NOT EXISTS public.app_owners (
  email TEXT PRIMARY KEY,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed owner account
INSERT INTO public.app_owners (email, is_approved)
VALUES ('syahmiaof123@gmail.com', true)
ON CONFLICT (email) DO NOTHING;

ALTER TABLE public.app_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read to app_owners"
  ON public.app_owners FOR SELECT
  TO authenticated
  USING (true);

-- 3. Security Definer Helper Function: is_approved_owner()
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

-- 4. User Profiles & Settings
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT 'Syahmi (Nemo)',
  avatar_url TEXT,
  theme TEXT NOT NULL DEFAULT 'dark',
  accent TEXT NOT NULL DEFAULT 'mint',
  week_starts_on SMALLINT NOT NULL DEFAULT 1,
  hour_format TEXT NOT NULL DEFAULT '24h',
  reduce_motion BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_access"
  ON public.profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = id AND public.is_approved_owner());

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'not_started',
  due_date TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  client_label TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  live_url TEXT,
  repo_url TEXT,
  notes TEXT,
  preview_blob_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON public.projects(user_id, updated_at DESC);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_owner_access"
  ON public.projects FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  due_time TEXT,
  start_date TEXT,
  estimated_minutes INTEGER,
  tags TEXT[] NOT NULL DEFAULT '{}',
  blocked_reason TEXT,
  parent_type TEXT,
  parent_id TEXT,
  completed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_updated ON public.tasks(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(user_id, status);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_owner_access"
  ON public.tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Milestones Table
CREATE TABLE IF NOT EXISTS public.milestones (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_date TEXT,
  completed_at TIMESTAMPTZ,
  order_num INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_user ON public.milestones(user_id, owner_id);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_owner_access"
  ON public.milestones FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Academics: Semesters
CREATE TABLE IF NOT EXISTS public.semesters (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_semesters_user ON public.semesters(user_id);
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "semesters_owner_access"
  ON public.semesters FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

CREATE TRIGGER trg_semesters_updated_at
  BEFORE UPDATE ON public.semesters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Academics: Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_id TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  lecturer TEXT,
  color TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_user ON public.subjects(user_id, semester_id);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects_owner_access"
  ON public.subjects FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Academics: Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  due_date TEXT,
  due_time TEXT,
  submission_url TEXT,
  weight_percent NUMERIC(5,2),
  score_obtained NUMERIC(5,2),
  score_maximum NUMERIC(5,2),
  submitted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_user ON public.assignments(user_id, subject_id);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_owner_access"
  ON public.assignments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11. Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
  subject_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON public.calendar_events(user_id, start_at);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_owner_access"
  ON public.calendar_events FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. Goals
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  why TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  target_date TEXT,
  achieved_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_owner_access"
  ON public.goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 13. Goal Task Links
CREATE TABLE IF NOT EXISTS public.goal_task_links (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_task_links_user ON public.goal_task_links(user_id, goal_id, task_id);
ALTER TABLE public.goal_task_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_task_links_owner_access"
  ON public.goal_task_links FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 14. Focus Selections
CREATE TABLE IF NOT EXISTS public.focus_selections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  effective_local_date TEXT NOT NULL,
  chosen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_focus_selections_user ON public.focus_selections(user_id, effective_local_date);
ALTER TABLE public.focus_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "focus_selections_owner_access"
  ON public.focus_selections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 15. Workspace Assets (Avatars, Cover Images, Project Attachments)
CREATE TABLE IF NOT EXISTS public.workspace_assets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_path TEXT,
  data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_user ON public.workspace_assets(user_id, owner_id);
ALTER TABLE public.workspace_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_owner_access"
  ON public.workspace_assets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());

-- 16. Audit Log (Sync Mutations History)
CREATE TABLE IF NOT EXISTS public.sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_audit_user ON public.sync_audit_log(user_id, created_at DESC);
ALTER TABLE public.sync_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_owner_access"
  ON public.sync_audit_log FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_owner())
  WITH CHECK (auth.uid() = user_id AND public.is_approved_owner());
