-- Recreate safely
drop materialized view if exists public.mv_post_likes;

create materialized view public.mv_post_likes as
select
  pr.id            as profile_id,
  pr.profile_url,
  pr.full_name,
  pr.company_name,
  pr.occupation,
  po.id            as post_id,
  po.post_url,
  po.author_name,
  po.post_content,
  po.post_timestamp,
  e.engaged_at     as liked_at
from public.engagements e
join public.profiles  pr on pr.id = e.profile_id
join public.posts     po on po.id = e.post_id
where e.engagement_type = 'like'
with no data;

-- Helpful partial indexes for common filters
create index if not exists idx_mv_post_likes_post_url
  on public.mv_post_likes (post_url);

create index if not exists idx_mv_post_likes_liked_at
  on public.mv_post_likes (liked_at desc);

grant select on public.mv_post_likes to anon, authenticated;

-- When ready to use or on a schedule:
-- refresh materialized view concurrently public.mv_post_likes;


