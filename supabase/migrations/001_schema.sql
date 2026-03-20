-- ============================================================
-- SCHEMA
-- ============================================================

-- Provinces
create table provinces (
  id   serial primary key,
  name text not null,
  slug text not null unique
);

-- Cities
create table cities (
  id          serial primary key,
  name        text not null,
  slug        text not null,
  province_id integer not null references provinces(id) on delete cascade,
  unique (slug, province_id)
);

-- Genres
create table genres (
  id   serial primary key,
  name text not null unique,
  slug text not null unique
);

-- Bands / Projects
create table bands (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete set null,
  name                   text not null,
  bio                    text,
  formed_year            integer,
  province_id            integer references provinces(id),
  city_id                integer references cities(id),
  contact_wa             text,
  contact_email          text,
  instagram              text,
  youtube                text,
  spotify                text,
  youtube_music          text,
  apple_music            text,
  bandcamp               text,
  photo_url              text,
  is_looking_for_members boolean default false,
  embedding              vector(1536),
  insights               jsonb,
  insights_cached_at     timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Band <-> Genre (many-to-many)
create table band_genres (
  band_id  uuid    references bands(id)  on delete cascade,
  genre_id integer references genres(id) on delete cascade,
  primary key (band_id, genre_id)
);

-- Indexes
create index on bands(user_id);
create index on bands(province_id);
create index on bands(city_id);
create index on bands(is_looking_for_members);
create index on band_genres(genre_id);

-- View: bands with province, city, genres
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
  ) as genres
from bands b
left join provinces  p  on p.id  = b.province_id
left join cities     c  on c.id  = b.city_id
left join band_genres bg on bg.band_id = b.id
left join genres     g  on g.id  = bg.genre_id
group by b.id, p.name, p.slug, c.name, c.slug;
