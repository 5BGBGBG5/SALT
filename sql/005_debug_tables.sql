-- Debug queries to check table structures and data
-- Run these in your Supabase SQL editor to diagnose issues

-- 1. Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('aieo_sentiment_metrics', 'aieo_weekly_rankings', 'sentiment_history')
ORDER BY table_name, ordinal_position;

-- 2. Check if tables exist and have data
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables 
WHERE tablename IN ('aieo_sentiment_metrics', 'aieo_weekly_rankings', 'sentiment_history');

-- 3. Check current data in each table
SELECT 'aieo_sentiment_metrics' as table_name, COUNT(*) as count FROM public.aieo_sentiment_metrics
UNION ALL
SELECT 'aieo_weekly_rankings' as table_name, COUNT(*) as count FROM public.aieo_weekly_rankings
UNION ALL
SELECT 'sentiment_history' as table_name, COUNT(*) as count FROM public.sentiment_history;

-- 4. Check sample rows from each table
SELECT 'aieo_sentiment_metrics' as table_name, * FROM public.aieo_sentiment_metrics LIMIT 3;
SELECT 'aieo_weekly_rankings' as table_name, * FROM public.aieo_weekly_rankings LIMIT 3;
SELECT 'sentiment_history' as table_name, * FROM public.sentiment_history LIMIT 3;
