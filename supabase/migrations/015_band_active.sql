-- supabase/migrations/015_band_active.sql

-- 1. Add is_active column
alter table bands add column is_active boolean not null default true;

-- 2. Recreate bands_view to include is_active
create or replace view bands_view as
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
  b.is_active,
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

-- 3. Update filter_bands_by_genre to only return active bands
create or replace function filter_bands_by_genre(
  genre_ids int[],
  province_filter int default null,
  city_filter int default null,
  looking_for_members boolean default null,
  search_term text default null,
  page_offset int default 0,
  page_limit int default 13
)
returns setof bands_view
language plpgsql
as $$
begin
  return query
  select bv.*
  from bands_view bv
  where bv.id in (
    select distinct bg.band_id
    from band_genres bg
    join bands b on b.id = bg.band_id
    where bg.genre_id = any(genre_ids)
      and b.is_active = true
      and (province_filter is null or b.province_id = province_filter)
      and (city_filter is null or b.city_id = city_filter)
      and (looking_for_members is null or b.is_looking_for_members = looking_for_members)
      and (search_term is null or b.name ilike '%' || search_term || '%')
  )
  order by bv.created_at desc
  offset page_offset
  limit page_limit;
end;
$$;

-- 4. Update count_bands_by_genre to count only active bands
create or replace function count_bands_by_genre(
  genre_ids int[],
  province_filter int default null,
  city_filter int default null,
  looking_for_members boolean default null,
  search_term text default null
)
returns bigint
language plpgsql
as $$
declare
  total bigint;
begin
  select count(distinct bg.band_id) into total
  from band_genres bg
  join bands b on b.id = bg.band_id
  where bg.genre_id = any(genre_ids)
    and b.is_active = true
    and (province_filter is null or b.province_id = province_filter)
    and (city_filter is null or b.city_id = city_filter)
    and (looking_for_members is null or b.is_looking_for_members = looking_for_members)
    and (search_term is null or b.name ilike '%' || search_term || '%');

  return total;
end;
$$;
