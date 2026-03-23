-- Admin API Setup Migration
-- Run this SQL in your Supabase SQL Editor to set up admin infrastructure

-- ============================================================
-- 1. Expand courses table with additional fields
-- ============================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS instructor TEXT,
  ADD COLUMN IF NOT EXISTS instructor_avatar TEXT,
  ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS syllabus JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prerequisites TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- ============================================================
-- 2. Expand course_registrations with status tracking
-- ============================================================
ALTER TABLE public.course_registrations
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS primary_goal TEXT,
  ADD COLUMN IF NOT EXISTS consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ============================================================
-- 3. Create payments table (if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cv_id UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT 'stripe',
  reference TEXT,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON public.payments (created_at DESC);

-- ============================================================
-- 4. Add admin_emails table for forwarding notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Insert default admin email setting (update with actual admin emails)
INSERT INTO public.admin_settings (key, value)
VALUES ('admin_emails', '["admin@globalready.tech"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 5. Admin RLS policies (service_role bypasses these anyway,
--    but we also allow admin users via a role check)
-- ============================================================

-- Allow admin to manage all courses (including inactive)
DROP POLICY IF EXISTS "Admin can manage all courses" ON public.courses;
CREATE POLICY "Admin can manage all courses"
  ON public.courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Allow admin to view all course_registrations
DROP POLICY IF EXISTS "Admin can view all registrations" ON public.course_registrations;
CREATE POLICY "Admin can view all registrations"
  ON public.course_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Allow admin to view all payments
DROP POLICY IF EXISTS "Admin can view all payments" ON public.payments;
CREATE POLICY "Admin can view all payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND (raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- ============================================================
-- 6. Dashboard views (for aggregated stats)
-- ============================================================

-- Dashboard overview stats
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users_30d', (
      SELECT COUNT(*) FROM auth.users
      WHERE last_sign_in_at > NOW() - INTERVAL '30 days'
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(amount), 0) FROM public.payments
      WHERE status = 'successful'
    ),
    'total_orders', (
      SELECT COUNT(*) FROM public.payments
      WHERE status = 'successful'
    ),
    'total_cvs', (SELECT COUNT(*) FROM public.cvs),
    'cvs_paid', (
      SELECT COUNT(*) FROM public.cvs
      WHERE payment_status = 'paid'
    ),
    'total_enrollments', (SELECT COUNT(*) FROM public.course_registrations),
    'total_courses', (SELECT COUNT(*) FROM public.courses WHERE is_active = true),
    'total_assessments', (SELECT COUNT(*) FROM public.assessments WHERE status = 'completed'),
    'avg_order_value', (
      SELECT COALESCE(AVG(amount), 0) FROM public.payments
      WHERE status = 'successful'
    ),
    'conversion_rate', (
      CASE
        WHEN (SELECT COUNT(*) FROM auth.users) > 0
        THEN ROUND(
          (SELECT COUNT(*)::numeric FROM public.payments WHERE status = 'successful')
          / (SELECT COUNT(*)::numeric FROM auth.users) * 100, 1
        )
        ELSE 0
      END
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Revenue over time (last 30 days, grouped by day)
CREATE OR REPLACE FUNCTION public.admin_revenue_over_time(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT
      DATE(created_at) as date,
      SUM(amount) as revenue,
      COUNT(*) as orders
    FROM public.payments
    WHERE status = 'successful'
      AND created_at > NOW() - (days_back || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  ) t INTO result;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Skills/learning insights
CREATE OR REPLACE FUNCTION public.admin_skills_insights()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_skills_tracked', (
      SELECT COUNT(DISTINCT skill)
      FROM public.skills_hub_progress,
      LATERAL jsonb_array_elements_text(COALESCE(skills, '[]'::jsonb)) AS skill
    ),
    'active_learners', (
      SELECT COUNT(DISTINCT user_id) FROM public.skills_hub_progress
      WHERE updated_at > NOW() - INTERVAL '30 days'
    ),
    'path_distribution', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT selected_path, COUNT(*) as count
        FROM public.skills_hub_progress
        WHERE selected_path IS NOT NULL
        GROUP BY selected_path
        ORDER BY count DESC
      ) t
    ),
    'course_popularity', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          c.id,
          c.title,
          c.category,
          COUNT(cr.id) as enrollments,
          SUM(CASE WHEN cr.completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed,
          CASE
            WHEN COUNT(cr.id) > 0
            THEN ROUND(
              SUM(CASE WHEN cr.completed_at IS NOT NULL THEN 1 ELSE 0 END)::numeric
              / COUNT(cr.id)::numeric * 100, 1
            )
            ELSE 0
          END as completion_rate
        FROM public.courses c
        LEFT JOIN public.course_registrations cr ON cr.course_id = c.id
        WHERE c.is_active = true
        GROUP BY c.id, c.title, c.category
        ORDER BY enrollments DESC
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- User growth over time
CREATE OR REPLACE FUNCTION public.admin_user_growth(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT
      DATE(created_at) as date,
      COUNT(*) as new_users
    FROM auth.users
    WHERE created_at > NOW() - (days_back || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  ) t INTO result;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ============================================================
-- 7. Auto-update triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS courses_updated_at ON public.courses;
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS course_registrations_updated_at ON public.course_registrations;
CREATE TRIGGER course_registrations_updated_at
  BEFORE UPDATE ON public.course_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
