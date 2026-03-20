-- ============================================================
-- SAVED BANDS — users can bookmark bands they like
-- ============================================================

create table if not exists saved_bands (
  user_id    uuid references auth.users(id) on delete cascade not null,
  band_id    uuid references bands(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, band_id)
);

alter table saved_bands enable row level security;

create policy "Users can view own saved bands"
  on saved_bands for select
  using (auth.uid() = user_id);

create policy "Users can save bands"
  on saved_bands for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave bands"
  on saved_bands for delete
  using (auth.uid() = user_id);
