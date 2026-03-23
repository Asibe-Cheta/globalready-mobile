-- Work Abroad assessment draft storage upgrades

DO $$
BEGIN
  -- Add current_step if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'current_step'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN current_step INTEGER DEFAULT 1;
  END IF;

  -- Add last_route if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'last_route'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN last_route TEXT;
  END IF;

  -- Add profession if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'profession'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN profession TEXT;
  END IF;

  -- Add tech_domain if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'tech_domain'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN tech_domain BOOLEAN;
  END IF;

  -- Add healthcare_domain if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'healthcare_domain'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN healthcare_domain BOOLEAN;
  END IF;

  -- Add certificates_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'certificates_status'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN certificates_status TEXT;
  END IF;

  -- Add current_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'current_status'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN current_status TEXT;
  END IF;
END $$;

-- Ensure updated_at exists for resume ordering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'assessments'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Indexes for resume queries
CREATE INDEX IF NOT EXISTS assessments_user_status_updated_idx
  ON public.assessments (user_id, status, updated_at DESC);

-- RLS policies (safe to re-run)
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own assessments" ON public.assessments;
CREATE POLICY "Users can manage own assessments"
  ON public.assessments FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION public.set_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_assessments_updated_at ON public.assessments;
CREATE TRIGGER set_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assessments_updated_at();
