-- =====================================================
-- Fix RLS Policies for AiEO Database
-- Run this in your AiEO Supabase SQL editor
-- =====================================================

-- First, let's check if RLS is enabled on the views
-- Views don't have RLS directly, but the underlying tables do

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('companies', 'profiles', 'posts', 'post_likes', 'post_comments', 'post_shares')
ORDER BY tablename;

-- Enable RLS on all tables if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON post_likes;
DROP POLICY IF EXISTS "Enable read access for all users" ON post_comments;
DROP POLICY IF EXISTS "Enable read access for all users" ON post_shares;

-- Create new policies that allow read access for all users
CREATE POLICY "Enable read access for all users" ON companies
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON profiles
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON posts
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON post_likes
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON post_comments
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON post_shares
FOR SELECT USING (true);

-- Test the views to make sure they work
SELECT COUNT(*) FROM v_post_engagement LIMIT 1;
SELECT COUNT(*) FROM v_likes_detailed LIMIT 1;

-- Check if there are any data issues
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

