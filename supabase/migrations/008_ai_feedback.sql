-- ============================================================
-- AI FEEDBACK (fine-tuning dataset)
-- ============================================================

create table ai_feedback (
  id         uuid        primary key default gen_random_uuid(),
  band_id    uuid        references bands(id) on delete set null,
  route      text        not null,
  input      jsonb       not null,
  output     jsonb       not null,
  rating     text        not null check (rating in ('good', 'bad')),
  created_at timestamptz default now()
);

create index on ai_feedback(route);
create index on ai_feedback(rating);
create index on ai_feedback(band_id);
