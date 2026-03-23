-- Add profile fields for CV prefill
-- Run in Supabase SQL editor

alter table public.profiles
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists linkedin text,
  add column if not exists portfolio text,
  add column if not exists avatar_url text,
  add column if not exists welcome_sent_at timestamptz;
