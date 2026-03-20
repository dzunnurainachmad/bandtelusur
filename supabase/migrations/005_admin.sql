-- ============================================================
-- ADMIN & USER PROFILES
-- ============================================================

-- Profiles: stores role & ban status for every user
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  role          text default 'user' check (role in ('user', 'admin')),
  is_banned     boolean default false,
  banned_reason text,
  banned_at     timestamptz,
  display_name  text,
  bio           text,
  avatar_url    text,
  username      text unique,
  created_at    timestamptz default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

-- Auto-create profile on signup (works for email & OAuth)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Backfill profiles for users who signed up before this migration
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ── RLS on profiles ──────────────────────────────────────────
alter table profiles enable row level security;

create policy "public read profiles"
  on profiles for select using (true);

create policy "admin update profiles"
  on profiles for update
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── bands insert: authenticated + not banned ──────────────────
create policy "auth insert bands"
  on bands for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from profiles
      where id = auth.uid() and is_banned = true
    )
  );

-- ── bands delete: owner or admin ──────────────────────────────
create policy "owner or admin delete bands"
  on bands for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── bands update: admin can update any band ───────────────────
create policy "admin update any band"
  on bands for update
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── Set first admin manually ──────────────────────────────────
-- update profiles set role = 'admin' where email = 'your@email.com';
