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

-- ── Set first admin manually ──────────────────────────────────
-- update profiles set role = 'admin' where email = 'your@email.com';

-- View: bands with province, city, genres, and owner info
create view bands_view as
select
  b.id,
  b.user_id,
  b.name,
  b.bio,
  b.formed_year,
  b.province_id,
  b.city_id,
  b.contact_wa,
  b.contact_email,
  b.instagram,
  b.youtube,
  b.spotify,
  b.youtube_music,
  b.apple_music,
  b.bandcamp,
  b.photo_url,
  b.is_looking_for_members,
  b.created_at,
  b.updated_at,
  p.name  as province_name,
  p.slug  as province_slug,
  c.name  as city_name,
  c.slug  as city_slug,
  coalesce(
    json_agg(json_build_object('id', g.id, 'name', g.name, 'slug', g.slug))
    filter (where g.id is not null), '[]'
  ) as genres,
  b.username,
  pr.display_name as owner_display_name,
  pr.username     as owner_username
from bands b
left join provinces  p  on p.id  = b.province_id
left join cities     c  on c.id  = b.city_id
left join profiles   pr on pr.id = b.user_id
left join band_genres bg on bg.band_id = b.id
left join genres     g  on g.id  = bg.genre_id
group by b.id, p.name, p.slug, c.name, c.slug, pr.display_name, pr.username;
