-- Phase 2 Database Setup
-- Run this SQL in your Supabase SQL Editor

-- 1. Ensure jobs table has proper structure
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo_url TEXT,
  country TEXT NOT NULL,
  city TEXT,
  job_type TEXT, -- 'full-time' | 'part-time' | 'contract' | 'remote'
  sector TEXT NOT NULL, -- 'Technology' | 'Healthcare' | 'Engineering' | etc.
  visa_sponsorship TEXT DEFAULT 'UNKNOWN', -- 'YES' | 'NO' | 'UNKNOWN'
  salary_range TEXT, -- e.g., "$50k - $80k"
  requirements JSONB, -- ["5+ years experience", "Bachelor's degree"]
  description TEXT NOT NULL,
  apply_url TEXT NOT NULL,
  posted_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing jobs table (if table already exists)
DO $$ 
BEGIN
  -- Add posted_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'posted_date') THEN
    ALTER TABLE public.jobs ADD COLUMN posted_date TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add expires_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'expires_at') THEN
    ALTER TABLE public.jobs ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  -- Add is_featured if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'is_featured') THEN
    ALTER TABLE public.jobs ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;

  -- Add view_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'view_count') THEN
    ALTER TABLE public.jobs ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;

  -- Add application_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'application_count') THEN
    ALTER TABLE public.jobs ADD COLUMN application_count INTEGER DEFAULT 0;
  END IF;

  -- Add company_logo_url if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'company_logo_url') THEN
    ALTER TABLE public.jobs ADD COLUMN company_logo_url TEXT;
  END IF;

  -- Add city if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'city') THEN
    ALTER TABLE public.jobs ADD COLUMN city TEXT;
  END IF;

  -- Add job_type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'job_type') THEN
    ALTER TABLE public.jobs ADD COLUMN job_type TEXT;
  END IF;

  -- Add salary_range if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'salary_range') THEN
    ALTER TABLE public.jobs ADD COLUMN salary_range TEXT;
  END IF;

  -- Add requirements if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'jobs' 
                 AND column_name = 'requirements') THEN
    ALTER TABLE public.jobs ADD COLUMN requirements JSONB;
  END IF;

  -- Set default for posted_date on existing rows if it's null
  UPDATE public.jobs SET posted_date = COALESCE(posted_date, created_at, NOW()) WHERE posted_date IS NULL;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_country ON public.jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_sector ON public.jobs(sector);
CREATE INDEX IF NOT EXISTS idx_jobs_visa ON public.jobs(visa_sponsorship);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_posted ON public.jobs(posted_date DESC);

-- RLS Policy for jobs
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;
CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (is_active = true);

-- 2. Assessment results table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 2: Targeting
  target_country TEXT NOT NULL,
  job_sector TEXT NOT NULL,
  current_status TEXT, -- 'student' | 'employed' | 'unemployed'
  
  -- Step 3: Experience & Education
  years_experience INTEGER,
  education_level TEXT, -- 'high_school' | 'bachelors' | 'masters' | 'phd'
  field_of_study TEXT,
  
  -- Step 4: Language & History
  languages JSONB, -- [{language: "English", proficiency: "Fluent"}]
  has_applied_before BOOLEAN,
  previous_applications JSONB,
  
  -- Step 5: Results
  match_score INTEGER, -- 0-100
  skill_gaps JSONB, -- [{skill: "AWS", priority: "HIGH"}]
  recommended_actions JSONB,
  eligibility_status TEXT, -- 'strong' | 'moderate' | 'weak'
  
  status TEXT DEFAULT 'incomplete', -- 'incomplete' | 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy for assessments
DROP POLICY IF EXISTS "Users can manage own assessments" ON public.assessments;
CREATE POLICY "Users can manage own assessments"
  ON public.assessments FOR ALL
  USING (auth.uid() = user_id);

-- 3. Functions for job counters
CREATE OR REPLACE FUNCTION increment_job_views(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.jobs
  SET view_count = view_count + 1
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_job_applications(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.jobs
  SET application_count = application_count + 1
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure saved_jobs table exists (if not already created)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- RLS Policy for saved_jobs
DROP POLICY IF EXISTS "Users can manage own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can manage own saved jobs"
  ON public.saved_jobs FOR ALL
  USING (auth.uid() = user_id);
