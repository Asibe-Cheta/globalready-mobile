-- ============================================================
-- GlobalReady: Jobs & In-Demand Roles Database Setup
-- Run this SQL in Supabase SQL Editor
-- ============================================================

-- 1. Create in_demand_roles table
CREATE TABLE IF NOT EXISTS in_demand_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank INTEGER NOT NULL,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'code',
  accent_color TEXT NOT NULL DEFAULT '#3b82f6',
  reason TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE in_demand_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active in_demand_roles"
  ON in_demand_roles FOR SELECT
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_in_demand_roles_rank ON in_demand_roles (rank);

-- 2. Seed initial 10 in-demand roles
INSERT INTO in_demand_roles (rank, title, icon, accent_color, reason) VALUES
  (1, 'Software Developer', 'code', '#3b82f6', 'Critical for building and maintaining digital infrastructure globally. High volume of visa sponsorships.'),
  (2, 'Data Scientist', 'analytics', '#a855f7', 'Businesses need specialized talent to turn big data into actionable insights for competitive advantage.'),
  (3, 'Cybersecurity Analyst', 'shield', '#ef4444', 'Rising global cyber threats have made security a top priority for every major corporation and government.'),
  (4, 'Cloud Engineer', 'cloud', '#06b6d4', 'Mass migration to AWS, Azure, and GCP has outpaced the available pool of certified cloud professionals.'),
  (5, 'DevOps Specialist', 'settings', '#f59e0b', 'Companies are desperate for specialists who can bridge the gap between development and operations for faster shipping.'),
  (6, 'AI/Machine Learning Engineer', 'psychology', '#6366f1', 'The Generative AI explosion has created an unprecedented demand for engineers who can build and fine-tune models.'),
  (7, 'UI/UX Designer', 'design-services', '#ec4899', 'Digital products now compete on experience. Companies need designers who understand user behavior and accessibility.'),
  (8, 'Full Stack Engineer', 'layers', '#10b981', 'Startups and tech giants alike value the versatility of engineers who can handle both frontend and backend tasks.'),
  (9, 'Mobile App Developer', 'smartphone', '#f97316', 'Global mobile-first trends ensure steady demand for iOS and Android specialists in fintech and e-commerce.'),
  (10, 'IT Systems Architect', 'account-tree', '#8b5cf6', 'Senior-level expertise is needed to design complex systems that are scalable, secure, and cost-efficient.');

-- 3. Ensure jobs table has correct RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Anyone can read active jobs'
  ) THEN
    CREATE POLICY "Anyone can read active jobs"
      ON jobs FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- 4. Ensure saved_jobs has correct RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can insert their saved_jobs'
  ) THEN
    CREATE POLICY "Users can insert their saved_jobs"
      ON saved_jobs FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can read their saved_jobs'
  ) THEN
    CREATE POLICY "Users can read their saved_jobs"
      ON saved_jobs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can delete their saved_jobs'
  ) THEN
    CREATE POLICY "Users can delete their saved_jobs"
      ON saved_jobs FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Create RPCs for incrementing job counters
CREATE OR REPLACE FUNCTION increment_job_views(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET view_count = COALESCE(view_count, 0) + 1 WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_job_applications(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET application_count = COALESCE(application_count, 0) + 1 WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
