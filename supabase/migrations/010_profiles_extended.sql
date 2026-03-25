-- ============================================================
-- PROFILES — extend with display fields
-- ============================================================

-- (columns display_name, bio, avatar_url now defined in 005_admin.sql)

-- ── Avatar storage bucket ────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "auth upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

create policy "owner update avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());
