-- View: who liked which posts
create or replace view public.v_post_likes as
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
where e.engagement_type = 'like';

grant select on public.v_post_likes to anon, authenticated;


