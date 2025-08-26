-- Verify table existence and permissions
-- Run this in your Supabase SQL editor

-- Check if tables exist in information_schema
SELECT
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('aieo_sentiment_metrics', 'aieo_weekly_rankings');

-- Check table privileges for anon and authenticated roles
SELECT
    schemaname,
    tablename,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE tablename IN ('aieo_sentiment_metrics', 'aieo_weekly_rankings')
AND grantee IN ('anon', 'authenticated');

-- Try to select from the tables to test access
SELECT
    'Testing aieo_sentiment_metrics access' as test,
    COUNT(*) as record_count
FROM public.aieo_sentiment_metrics;

SELECT
    'Testing aieo_weekly_rankings access' as test,
    COUNT(*) as record_count
FROM public.aieo_weekly_rankings;

-- Show sample data to verify structure
SELECT
    execution_date,
    aggregate_metrics
FROM public.aieo_sentiment_metrics
ORDER BY execution_date DESC
LIMIT 2;

SELECT
    ranking_value,
    report_week
FROM public.aieo_weekly_rankings
ORDER BY report_week DESC
LIMIT 2;
