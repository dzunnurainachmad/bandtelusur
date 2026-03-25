-- ============================================================
-- AI CALL LOGS
-- ============================================================

create table ai_logs (
  id            uuid        primary key default gen_random_uuid(),
  route         text        not null,
  model         text        not null,
  latency_ms    integer,
  input_tokens  integer,
  output_tokens integer,
  prompt_version text,
  band_id        uuid        references bands(id) on delete set null,
  created_at     timestamptz default now()
);

create index on ai_logs(route);
create index on ai_logs(created_at desc);
create index on ai_logs(band_id);
create index on ai_logs(prompt_version);
