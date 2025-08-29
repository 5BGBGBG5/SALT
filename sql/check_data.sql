-- =====================================================
-- Check Data in AiEO Database
-- Run this in your AiEO Supabase SQL editor
-- =====================================================

-- Check if tables have any data
SELECT 
    'companies' as table_name,
    COUNT(*) as record_count
FROM companies
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
    'posts' as table_name,
    COUNT(*) as record_count
FROM posts
UNION ALL
SELECT 
    'post_likes' as table_name,
    COUNT(*) as record_count
FROM post_likes
UNION ALL
SELECT 
    'post_comments' as table_name,
    COUNT(*) as record_count
FROM post_comments
UNION ALL
SELECT 
    'post_shares' as table_name,
    COUNT(*) as record_count
FROM post_shares;

-- Check if views return any data
SELECT 'v_post_engagement' as view_name, COUNT(*) as record_count FROM v_post_engagement;
SELECT 'v_likes_detailed' as view_name, COUNT(*) as record_count FROM v_likes_detailed;

-- Check a few sample records from each table
SELECT 'Sample companies' as info, COUNT(*) as count FROM companies LIMIT 5;
SELECT 'Sample profiles' as info, COUNT(*) as count FROM profiles LIMIT 5;
SELECT 'Sample posts' as info, COUNT(*) as count FROM posts LIMIT 5;
SELECT 'Sample post_likes' as info, COUNT(*) as count FROM post_likes LIMIT 5;

-- Check if there are any data type issues
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- Check if the view definition is correct
SELECT definition FROM pg_views WHERE viewname = 'v_post_engagement';

