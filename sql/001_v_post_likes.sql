-- Drop the old view first
DROP VIEW IF EXISTS public.v_post_likes;

-- Create new view based on actual table structure
CREATE OR REPLACE VIEW public.v_post_likes AS
SELECT
  e.id as engagement_id,
  e.profile_url,
  e.company_name,
  e.post_url,
  e.engaged_at as liked_at,
  e.created_at
FROM public.engagements e
WHERE e.engagement_type = 'like';

GRANT SELECT ON public.v_post_likes TO anon, authenticated;


