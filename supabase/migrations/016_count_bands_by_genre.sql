-- ============================================================
-- COUNT BANDS BY GENRE (mirrors filter_bands_by_genre logic)
-- ============================================================

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
    and (province_filter is null or b.province_id = province_filter)
    and (city_filter is null or b.city_id = city_filter)
    and (looking_for_members is null or b.is_looking_for_members = looking_for_members)
    and (search_term is null or b.name ilike '%' || search_term || '%');

  return total;
end;
$$;
