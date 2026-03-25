-- ============================================================
-- SCHEMA
-- ============================================================

create extension if not exists vector;

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
  username               text not null unique,
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
  updated_at             timestamptz default now(),
  constraint band_username_format check (username ~ '^[a-z0-9_]{3,30}$')
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
create index on bands(username);
create index on bands(is_looking_for_members);
create index on band_genres(genre_id);

