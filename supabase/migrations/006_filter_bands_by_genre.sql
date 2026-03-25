-- ============================================================
-- FILTER BANDS BY GENRE (server-side pagination)
-- ============================================================

drop function if exists filter_bands_by_genre(int[], int, int, boolean, text, int, int);

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
