-- Run this in Supabase SQL editor (Dashboard > SQL Editor)
-- Adds a persistent flag to track whether a user has used their free interview session.
-- Once set to TRUE it is never reset, even if sessions are deleted.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_interview_used BOOLEAN NOT NULL DEFAULT FALSE;
