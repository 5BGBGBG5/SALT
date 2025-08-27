-- Grant permissions for all AIEO tables
-- Run this in your Supabase SQL editor

-- Grant permissions to anon and authenticated users for all required tables
GRANT SELECT ON public.ai_responses TO anon, authenticated;
GRANT SELECT ON public.aieo_sentiment_metrics TO anon, authenticated;
GRANT SELECT ON public.aieo_weekly_rankings TO anon, authenticated;

-- Check what tables actually exist in your database

-- 1. List all tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check specifically for AI/analytics related tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (table_name LIKE '%ai%' OR table_name LIKE '%response%' OR table_name LIKE '%metric%' OR table_name LIKE '%ranking%')
ORDER BY table_name;

-- 3. If ai_responses exists, check its structure and data
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_responses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check for sample data in ai_responses (if it exists)
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT prompt_text) as unique_prompts,
    MIN(execution_date) as earliest_date,
    MAX(execution_date) as latest_date
FROM public.ai_responses;

-- 5. Show sample data structure (if table exists)
SELECT 
    id,
    LEFT(prompt_text, 50) || '...' as prompt_preview,
    jsonb_object_keys(model_responses) as available_models,
    execution_date
FROM public.ai_responses
ORDER BY timestamp DESC
LIMIT 3;
