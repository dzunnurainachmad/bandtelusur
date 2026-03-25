-- ============================================================
-- SAVED BANDS — users can bookmark bands they like
-- ============================================================

create table if not exists saved_bands (
  user_id    uuid references auth.users(id) on delete cascade not null,
  band_id    uuid references bands(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, band_id)
);

