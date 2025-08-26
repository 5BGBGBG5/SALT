-- Debug the engagements table to understand its structure
-- Run this in your Supabase SQL editor

-- Check table structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'engagements'
ORDER BY ordinal_position;

-- Check sample data
SELECT
    id,
    engaged_at,
    company_name,
    post_url
FROM public.engagements
ORDER BY engaged_at DESC
LIMIT 5;

-- Check engagement types
SELECT
    engagement_type,
    COUNT(*) as count
FROM public.engagements
GROUP BY engagement_type;

-- Check if there are non-null company names
SELECT
    COUNT(*) as total_engagements,
    COUNT(company_name) as engagements_with_company,
    COUNT(DISTINCT company_name) as unique_companies
FROM public.engagements;
