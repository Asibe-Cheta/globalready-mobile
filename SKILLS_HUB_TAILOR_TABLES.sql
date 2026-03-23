-- Skills Hub & Tailor CV tables
-- Run this SQL in your Supabase SQL Editor

-- Courses catalog
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course registrations
CREATE TABLE IF NOT EXISTS public.course_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CV records
CREATE TABLE IF NOT EXISTS public.cvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'built', -- 'built' | 'uploaded' | 'tailored'
  cv_data JSONB,
  payment_status TEXT DEFAULT 'pending', -- 'pending' | 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills Hub draft progress (optional)
CREATE TABLE IF NOT EXISTS public.skills_hub_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_route TEXT,
  selected_path TEXT,
  reason TEXT,
  access TEXT,
  urgency TEXT,
  availability TEXT,
  skills JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS skills_hub_progress_user_id_idx ON public.skills_hub_progress (user_id);

-- Tailor CV draft progress (optional)
CREATE TABLE IF NOT EXISTS public.tailor_cv_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_route TEXT,
  job_title TEXT,
  job_description TEXT,
  analysis_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tailor_cv_sessions_user_id_idx ON public.tailor_cv_sessions (user_id);

-- RLS policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_hub_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailor_cv_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Anyone can view active courses"
  ON public.courses FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can manage own course registrations" ON public.course_registrations;
CREATE POLICY "Users can manage own course registrations"
  ON public.course_registrations FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cvs" ON public.cvs;
CREATE POLICY "Users can manage own cvs"
  ON public.cvs FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own skills hub progress" ON public.skills_hub_progress;
CREATE POLICY "Users can manage own skills hub progress"
  ON public.skills_hub_progress FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tailor cv sessions" ON public.tailor_cv_sessions;
CREATE POLICY "Users can manage own tailor cv sessions"
  ON public.tailor_cv_sessions FOR ALL
  USING (auth.uid() = user_id);
