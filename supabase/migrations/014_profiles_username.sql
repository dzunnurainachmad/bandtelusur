-- ============================================================
-- PROFILES — add username slug
-- ============================================================

alter table profiles
  add column if not exists username text unique;

-- Format: lowercase letters, numbers, underscore — 3 to 30 chars
alter table profiles
  add constraint username_format
  check (username ~ '^[a-z0-9_]{3,30}$');

create index if not exists profiles_username_idx on profiles(username);
