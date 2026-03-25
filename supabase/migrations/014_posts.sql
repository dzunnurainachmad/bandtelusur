-- Posts: users can create gig announcements or general posts, tagging bands

create table posts (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  type         text        not null default 'general' check (type in ('gig', 'general')),
  title        text        not null,
  body         text,
  event_date   timestamptz,
  location     text,
  ticket_price text,
  ticket_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table post_band_tags (
  post_id uuid not null references posts(id) on delete cascade,
  band_id uuid not null references bands(id) on delete cascade,
  primary key (post_id, band_id)
);

create index on posts(user_id);
create index on posts(created_at desc);
create index on post_band_tags(band_id);
create index on post_band_tags(post_id);

-- View: posts enriched with author info
create view posts_view as
  select
    p.id,
    p.user_id,
    p.type,
    p.title,
    p.body,
    p.event_date,
    p.location,
    p.ticket_price,
    p.ticket_url,
    p.created_at,
    p.updated_at,
    pr.display_name as author_display_name,
    pr.username     as author_username,
    pr.avatar_url   as author_avatar_url
  from posts p
  left join profiles pr on pr.id = p.user_id;

-- Auto-update updated_at
create or replace function update_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on posts
  for each row execute procedure update_posts_updated_at();
