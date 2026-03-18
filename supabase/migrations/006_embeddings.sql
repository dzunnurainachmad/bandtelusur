-- ============================================================
-- EMBEDDINGS & SEMANTIC SEARCH (pgvector)
-- ============================================================

-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Add embedding column to bands
alter table bands
  add column if not exists embedding vector(1536);

-- Index for fast similarity search
create index if not exists bands_embedding_idx
  on bands using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── Semantic search: find bands by query embedding ──────────
create or replace function search_bands_semantic(
  query_embedding vector(1536),
  match_threshold float default 0.3,
  match_count int default 10
)
returns setof bands_view
language plpgsql
as $$
begin
  return query
  select bv.*
  from bands b
  join bands_view bv on bv.id = b.id
  where b.embedding is not null
    and 1 - (b.embedding <=> query_embedding) >= match_threshold
  order by b.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ── Similar bands: find bands similar to a given band ───────
-- Uses RETURNS SETOF bands_view so columns auto-match the view
drop function if exists get_similar_bands(uuid, int);

create or replace function get_similar_bands(
  band_id uuid,
  match_count int default 6
)
returns setof bands_view
language plpgsql
as $$
declare
  source_embedding vector(1536);
begin
  select b.embedding into source_embedding
  from bands b
  where b.id = band_id;

  if source_embedding is null then
    return;
  end if;

  return query
  select bv.*
  from bands b
  join bands_view bv on bv.id = b.id
  where b.id != band_id
    and b.embedding is not null
  order by b.embedding <=> source_embedding
  limit match_count;
end;
$$;
