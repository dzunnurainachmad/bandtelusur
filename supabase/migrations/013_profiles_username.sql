-- ============================================================
-- PROFILES — add username slug
-- ============================================================

-- (column username + constraint now defined in 005_admin.sql)

create index if not exists profiles_username_idx on profiles(username);
