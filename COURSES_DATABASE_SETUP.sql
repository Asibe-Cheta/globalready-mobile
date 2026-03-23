-- ============================================================
-- GlobalReady: Courses & Virtual Sessions Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- -------------------------------------------------------
-- STEP 1: Add new columns to the courses table
-- -------------------------------------------------------
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS path_category TEXT DEFAULT 'tech_career',
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'code',
  ADD COLUMN IF NOT EXISTS tint_color TEXT DEFAULT '#0d6cf2',
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- -------------------------------------------------------
-- STEP 2: Create the virtual_sessions table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.virtual_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Free Orientation Session',
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'GMT',
  location TEXT DEFAULT 'Virtual Room',
  meeting_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.virtual_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.virtual_sessions;
CREATE POLICY "Anyone can view active sessions"
  ON public.virtual_sessions FOR SELECT
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_virtual_sessions_course ON public.virtual_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_virtual_sessions_date ON public.virtual_sessions(session_date);

-- -------------------------------------------------------
-- STEP 3: Seed the 10 courses
-- Uses INSERT ... WHERE NOT EXISTS to avoid duplicates.
-- Safe to re-run if courses already exist.
-- -------------------------------------------------------

-- ── Side Hustle ─────────────────────────────────────────
INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'Side Hustle Hub',
  'High-Income Paths',
  'Learn high-demand digital skills to start earning and funding your career journey.',
  'side_hustle',
  'bolt',
  '#f59e0b',
  1,
  '4–8 weeks',
  'beginner',
  true,
  true,
  '[
    {"title":"Module 1: Vibe Coding & No-Code","description":"Build functional web apps and tools without writing traditional code.","icon":"extension","accent":"#0d6cf2"},
    {"title":"Module 2: AI & Digital Products","description":"Leverage AI to create and launch profitable digital assets and automated workflows.","icon":"smart-toy","accent":"#34d399"},
    {"title":"Module 3: Content Creation & Video Editing","description":"Master high-impact storytelling, short-form video, and viral content strategies.","icon":"video-library","accent":"#f59e0b"},
    {"title":"Module 4: Virtual Assistance & Ops","description":"Professional management, email systems, and remote executive support mastery.","icon":"support-agent","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Side Hustle Hub');

-- ── Tech Career Paths ────────────────────────────────────
INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'Software Development',
  'Build web and mobile apps that scale globally.',
  'Build web and mobile apps that scale globally.',
  'tech_career',
  'code',
  '#0d6cf2',
  1,
  '6–12 months',
  'beginner',
  true,
  true,
  '[
    {"title":"Module 1: Programming Foundations","description":"Core JavaScript/TypeScript concepts, data structures, and problem-solving.","icon":"code","accent":"#0d6cf2"},
    {"title":"Module 2: Frontend Development","description":"Build responsive web apps with React, state management, and UI systems.","icon":"web","accent":"#34d399"},
    {"title":"Module 3: Backend Development","description":"APIs, databases, authentication, and scalable service architecture.","icon":"dns","accent":"#f59e0b"},
    {"title":"Module 4: Mobile & Deployment","description":"Ship apps with React Native, CI/CD, and production readiness.","icon":"phone-iphone","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Software Development');

INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'Agile Project Management',
  'Lead high-performing teams with Agile and Scrum.',
  'Learn to lead high-performing teams using global Agile and Scrum frameworks.',
  'tech_career',
  'groups',
  '#34d399',
  2,
  '3–6 months',
  'intermediate',
  true,
  false,
  '[
    {"title":"Module 1: Scrum & Kanban Fundamentals","description":"Grasp the core principles of iterative development and visual workflow management.","icon":"layers","accent":"#0d6cf2"},
    {"title":"Module 2: Strategic Product Backlog Management","description":"Master prioritization techniques and user story mapping for high-value delivery.","icon":"assignment","accent":"#34d399"},
    {"title":"Module 3: Leading Agile Ceremonies & Sprints","description":"Facilitate effective dailies, reviews, and retrospectives to foster improvement.","icon":"groups","accent":"#f59e0b"},
    {"title":"Module 4: Certification Prep (PSM/CSM)","description":"Prepare for global Scrum Master certifications with mock exams and guidance.","icon":"workspace-premium","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Agile Project Management');

INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'AI Engineering',
  'Build the future by mastering machine learning and LLMs.',
  'Build the future by mastering machine learning and large language models.',
  'tech_career',
  'smart-toy',
  '#a855f7',
  3,
  '6–12 months',
  'intermediate',
  true,
  true,
  '[
    {"title":"Module 1: Python for AI & Data Science","description":"Master the essential libraries including NumPy, Pandas, and Matplotlib for data manipulation.","icon":"terminal","accent":"#0d6cf2"},
    {"title":"Module 2: Machine Learning Fundamentals","description":"Supervised and unsupervised learning, regression models, and classification algorithms.","icon":"psychology","accent":"#34d399"},
    {"title":"Module 3: Deep Learning & Neural Networks","description":"Architecting CNNs and RNNs using modern frameworks like PyTorch and TensorFlow.","icon":"hub","accent":"#f59e0b"},
    {"title":"Module 4: Building with LLMs & GenAI","description":"Prompt engineering, RAG architectures, and fine-tuning open-source language models.","icon":"auto-awesome","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'AI Engineering');

INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'DevOps Engineering',
  'Streamline deployments and keep systems reliable at scale.',
  'Streamline deployments and keep systems reliable at scale.',
  'tech_career',
  'cloud',
  '#0ea5e9',
  4,
  '6–12 months',
  'intermediate',
  true,
  false,
  '[
    {"title":"Module 1: Cloud Fundamentals","description":"Core concepts across AWS, Azure, and GCP including networking and storage.","icon":"cloud","accent":"#0ea5e9"},
    {"title":"Module 2: CI/CD Automation","description":"Build pipelines with GitHub Actions, GitLab CI, and deployment strategies.","icon":"autorenew","accent":"#34d399"},
    {"title":"Module 3: Infrastructure as Code","description":"Provision and manage infrastructure with Terraform and configuration management.","icon":"settings","accent":"#f59e0b"},
    {"title":"Module 4: Monitoring & Reliability","description":"Observability tooling, SRE practices, and incident response planning.","icon":"analytics","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'DevOps Engineering');

INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'Data Analysis & PowerBI',
  'Turn complex data into actionable business insights.',
  'Turn complex data into actionable business insights with industry-standard tools.',
  'tech_career',
  'bar-chart',
  '#10b981',
  5,
  '3–6 months',
  'beginner',
  true,
  false,
  '[
    {"title":"Module 1: Advanced Excel & Data Cleaning","description":"Master complex formulas, power query, and automated data preparation workflows.","icon":"table-chart","accent":"#0d6cf2"},
    {"title":"Module 2: SQL for Data Analytics","description":"Write efficient queries, join datasets, and extract meaningful patterns from databases.","icon":"storage","accent":"#10b981"},
    {"title":"Module 3: PowerBI Visualization & Dashboards","description":"Create interactive reports and learn the fundamentals of DAX for advanced metrics.","icon":"insert-chart","accent":"#f59e0b"},
    {"title":"Module 4: Business Intelligence Strategy","description":"Bridge the gap between data and decision-making by telling stories with numbers.","icon":"trending-up","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Data Analysis & PowerBI');

INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'Cybersecurity',
  'Protect digital assets and defend against global cyber threats.',
  'Master the skills to protect digital assets and defend against global cyber threats.',
  'tech_career',
  'security',
  '#ef4444',
  6,
  '6–12 months',
  'intermediate',
  true,
  false,
  '[
    {"title":"Module 1: Network Security & Defense","description":"Fundamentals of networking, firewalls, and securing distributed infrastructure.","icon":"lan","accent":"#0d6cf2"},
    {"title":"Module 2: Ethical Hacking & Pentesting","description":"Advanced techniques for identifying vulnerabilities and systematic penetration testing.","icon":"terminal","accent":"#ef4444"},
    {"title":"Module 3: Security Operations & Incident Response","description":"Real-time monitoring, threat hunting, and professional remediation strategies.","icon":"bolt","accent":"#f59e0b"},
    {"title":"Module 4: Governance, Risk & Compliance","description":"Regulatory frameworks, risk management, and international cybersecurity standards.","icon":"policy","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Cybersecurity');

INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'Database Administration',
  'Manage, secure, and optimize mission-critical data systems.',
  'Manage, secure, and optimize mission-critical data systems.',
  'tech_career',
  'storage',
  '#64748b',
  7,
  '3–6 months',
  'intermediate',
  true,
  false,
  '[
    {"title":"Module 1: Database Fundamentals","description":"Relational models, schema design, and normalization best practices.","icon":"storage","accent":"#0d6cf2"},
    {"title":"Module 2: SQL Performance & Optimization","description":"Indexing strategies, query tuning, and monitoring tools.","icon":"analytics","accent":"#34d399"},
    {"title":"Module 3: Security & Access Control","description":"Role-based access, encryption, and compliance standards.","icon":"security","accent":"#f59e0b"},
    {"title":"Module 4: Backup & Recovery","description":"Disaster recovery planning, replication, and high availability.","icon":"restore","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Database Administration');

-- ── Language Training ────────────────────────────────────
INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'German Language (A1–B2)',
  'Standardized German training for relocation and work abroad.',
  'Explore our standardized German language training levels designed for your success abroad.',
  'language',
  'translate',
  '#f59e0b',
  1,
  '6–18 months',
  'beginner',
  true,
  true,
  '[
    {"title":"A1: Beginner","description":"For beginners with no prior knowledge. Learn to introduce yourself and handle simple daily interactions.","icon":"school","accent":"#0d6cf2"},
    {"title":"A2: Basic Communication","description":"Master basic sentences and frequently used expressions related to areas of most immediate relevance.","icon":"chat","accent":"#22c55e"},
    {"title":"B1: Intermediate Usage","description":"Understand main points of clear standard input on familiar matters and handle most travel situations.","icon":"language","accent":"#f59e0b"},
    {"title":"B2: Professional Proficiency","description":"Communicate fluently and spontaneously for professional and academic contexts without strain.","icon":"workspace-premium","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'German Language (A1–B2)');

INSERT INTO public.courses (
  title, subtitle, description, path_category, icon, tint_color,
  display_order, duration, level, is_active, featured, syllabus
)
SELECT
  'IELTS Preparation',
  'Achieve your target band score for work, study, and global relocation.',
  'Achieve your target band score for work, study, and global relocation.',
  'language',
  'menu-book',
  '#0d6cf2',
  2,
  '2–4 months',
  'beginner',
  true,
  false,
  '[
    {"title":"Phase 1: Master the Listening Module","description":"Techniques for all 4 parts, including accent familiarization and note-taking.","icon":"hearing","accent":"#0d6cf2"},
    {"title":"Phase 2: High-Scoring Reading Tactics","description":"Skimming, scanning, and identifying key information under time pressure.","icon":"menu-book","accent":"#22c55e"},
    {"title":"Phase 3: Academic & General Writing","description":"Master Task 1 and Task 2 with advanced vocabulary and cohesive structures.","icon":"edit-note","accent":"#f59e0b"},
    {"title":"Phase 4: Fluent Speaking & Interview Prep","description":"Build confidence with real mock tests and personalized feedback on pronunciation.","icon":"record-voice-over","accent":"#a855f7"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'IELTS Preparation');

-- -------------------------------------------------------
-- STEP 4: (Optional) Update existing courses that were
-- already in the DB (e.g., inserted without path_category)
-- Run this block if courses exist but lack the new columns.
-- Adjust WHERE conditions to match your existing course titles.
-- -------------------------------------------------------
/*
UPDATE public.courses SET
  path_category = 'side_hustle', icon = 'bolt', tint_color = '#f59e0b', display_order = 1
WHERE title = 'Side Hustle Hub' AND path_category IS NULL;

UPDATE public.courses SET
  path_category = 'tech_career', icon = 'code', tint_color = '#0d6cf2', display_order = 1
WHERE title = 'Software Development' AND path_category IS NULL;
-- (etc. for each course)
*/

-- -------------------------------------------------------
-- STEP 5: (Optional) Add a sample virtual session
-- Replace the course title with the exact title you inserted,
-- and set a real future date in ISO format.
-- -------------------------------------------------------
/*
INSERT INTO public.virtual_sessions (course_id, session_date, timezone, location)
SELECT id, '2026-03-15T16:00:00Z', 'GMT', 'Virtual Room'
FROM public.courses
WHERE title = 'Agile Project Management'
LIMIT 1;
*/

-- -------------------------------------------------------
-- Verification query — run after the inserts to confirm:
-- -------------------------------------------------------
SELECT title, path_category, icon, tint_color, display_order
FROM public.courses
WHERE is_active = true
ORDER BY path_category, display_order;
