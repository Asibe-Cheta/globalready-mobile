-- Avatar storage bucket + RLS policies (Supabase)
-- Run in Supabase SQL editor

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can manage own avatars" on storage.objects;
create policy "Users can manage own avatars"
  on storage.objects for all
  using (bucket_id = 'avatars' and auth.uid() = owner)
  with check (bucket_id = 'avatars' and auth.uid() = owner);
