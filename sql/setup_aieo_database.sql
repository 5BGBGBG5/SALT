-- =====================================================
-- AiEO Database Setup for LinkedIn Data
-- Run this in your AiEO Supabase SQL editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. COMPANIES TABLE
-- =====================================================
DROP TABLE IF EXISTS companies CASCADE;

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core identifiers
    linkedin_company_id BIGINT UNIQUE,
    main_company_id BIGINT,
    linkedin_company_slug VARCHAR(255),
    
    -- Basic company information
    company_name VARCHAR(500),
    name VARCHAR(500), -- Alternative name field from scraped data
    tagline TEXT,
    description TEXT,
    
    -- URLs and links
    company_website VARCHAR(500),
    domain VARCHAR(255),
    linkedin_company_url VARCHAR(500),
    slugged_url VARCHAR(500),
    sales_navigator_link VARCHAR(500),
    logo_url TEXT,
    banner_url TEXT,
    
    -- Location information
    location VARCHAR(500),
    headquarter VARCHAR(500),
    company_address TEXT,
    phone VARCHAR(100),
    
    -- Company details
    company_industry VARCHAR(255),
    industry_code INTEGER,
    company_size VARCHAR(100),
    founded_year INTEGER,
    specialities TEXT,
    
    -- Metrics
    follower_count INTEGER,
    employees_on_linkedin INTEGER,
    total_employee_count INTEGER,
    
    -- Growth metrics
    growth_6_month VARCHAR(100),
    growth_1_year VARCHAR(100),
    growth_2_year VARCHAR(100),
    average_tenure VARCHAR(100),
    
    -- Employee distribution by department (counts)
    dist_sales INTEGER,
    dist_operations INTEGER,
    dist_support INTEGER,
    dist_engineering INTEGER,
    dist_information_technology INTEGER,
    dist_quality_assurance INTEGER,
    dist_marketing INTEGER,
    dist_business_development INTEGER,
    dist_administrative INTEGER,
    dist_finance INTEGER,
    dist_research INTEGER,
    dist_program_project_management INTEGER,
    dist_accounting INTEGER,
    dist_military_protective_services INTEGER,
    dist_human_resources INTEGER,
    dist_arts_design INTEGER,
    dist_product_management INTEGER,
    dist_media_communication INTEGER,
    dist_real_estate INTEGER,
    dist_purchasing INTEGER,
    dist_consulting INTEGER,
    dist_education INTEGER,
    dist_community_social_services INTEGER,
    dist_healthcare_services INTEGER,
    dist_legal INTEGER,
    dist_entrepreneurship INTEGER,
    
    -- Employee distribution by department (percentages)
    dist_sales_pct DECIMAL(5,2),
    dist_operations_pct DECIMAL(5,2),
    dist_support_pct DECIMAL(5,2),
    dist_engineering_pct DECIMAL(5,2),
    dist_information_technology_pct DECIMAL(5,2),
    dist_quality_assurance_pct DECIMAL(5,2),
    dist_marketing_pct DECIMAL(5,2),
    dist_business_development_pct DECIMAL(5,2),
    dist_administrative_pct DECIMAL(5,2),
    dist_finance_pct DECIMAL(5,2),
    dist_research_pct DECIMAL(5,2),
    dist_program_project_management_pct DECIMAL(5,2),
    dist_accounting_pct DECIMAL(5,2),
    dist_military_protective_services_pct DECIMAL(5,2),
    dist_human_resources_pct DECIMAL(5,2),
    dist_arts_design_pct DECIMAL(5,2),
    dist_product_management_pct DECIMAL(5,2),
    dist_media_communication_pct DECIMAL(5,2),
    dist_real_estate_pct DECIMAL(5,2),
    dist_purchasing_pct DECIMAL(5,2),
    dist_consulting_pct DECIMAL(5,2),
    dist_education_pct DECIMAL(5,2),
    dist_community_social_services_pct DECIMAL(5,2),
    dist_healthcare_services_pct DECIMAL(5,2),
    dist_legal_pct DECIMAL(5,2),
    dist_entrepreneurship_pct DECIMAL(5,2),
    
    -- Admin and verification
    is_admin BOOLEAN DEFAULT FALSE,
    verified_page_date DATE,
    
    -- Metadata
    query_used TEXT,
    scraped_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for companies
CREATE INDEX idx_companies_linkedin_id ON companies(linkedin_company_id);
CREATE INDEX idx_companies_main_id ON companies(main_company_id);
CREATE INDEX idx_companies_name ON companies(company_name);
CREATE INDEX idx_companies_industry ON companies(company_industry);
CREATE INDEX idx_companies_size ON companies(company_size);
CREATE INDEX idx_companies_location ON companies(location);
CREATE INDEX idx_companies_follower_count ON companies(follower_count DESC);
CREATE INDEX idx_companies_employee_count ON companies(total_employee_count DESC);

-- =====================================================
-- 2. PROFILES TABLE (People)
-- =====================================================
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linkedin_profile_id BIGINT UNIQUE NOT NULL,
    linkedin_profile_slug VARCHAR(255),
    linkedin_profile_urn VARCHAR(500),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(500) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255),
    headline TEXT,
    description TEXT,
    location VARCHAR(500),
    profile_image_url TEXT,
    linkedin_profile_url VARCHAR(500),
    
    -- Current job information
    current_company_id UUID REFERENCES companies(id),
    current_job_title VARCHAR(500),
    current_job_description TEXT,
    current_job_date_range VARCHAR(255),
    current_job_location VARCHAR(500),
    
    -- Previous job information
    previous_company_name VARCHAR(500),
    previous_company_slug VARCHAR(255),
    previous_job_title VARCHAR(500),
    previous_job_description TEXT,
    previous_job_date_range VARCHAR(255),
    previous_job_location VARCHAR(500),
    
    -- Education information
    school_name VARCHAR(500),
    school_degree VARCHAR(500),
    school_date_range VARCHAR(255),
    school_description TEXT,
    school_url VARCHAR(500),
    
    -- Professional information
    skills_label TEXT,
    followers_count INTEGER,
    connections_count INTEGER,
    connection_degree VARCHAR(50),
    is_hiring_badge BOOLEAN DEFAULT FALSE,
    is_open_to_work_badge BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    scraper_profile_id BIGINT,
    scraper_full_name VARCHAR(500),
    refreshed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_linkedin_id ON profiles(linkedin_profile_id);
CREATE INDEX idx_profiles_company_id ON profiles(current_company_id);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);
CREATE INDEX idx_profiles_first_name ON profiles(first_name);
CREATE INDEX idx_profiles_last_name ON profiles(last_name);

-- =====================================================
-- 3. POSTS TABLE
-- =====================================================
DROP TABLE IF EXISTS posts CASCADE;

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_url VARCHAR(500) UNIQUE NOT NULL,
    post_urn VARCHAR(500),
    author_name VARCHAR(500),
    author_url VARCHAR(500),
    author_profile_id UUID REFERENCES profiles(id),
    author_company_id UUID REFERENCES companies(id),
    
    -- Post content
    post_type VARCHAR(100), -- 'Image', 'Video (LinkedIn Source)', 'Text', etc.
    post_content TEXT,
    image_url TEXT,
    video_url TEXT,
    
    -- Engagement metrics
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    repost_count INTEGER DEFAULT 0,
    
    -- Post metadata
    action VARCHAR(100), -- 'Post', 'Share', etc.
    post_date VARCHAR(100), -- Original relative date from scraping
    post_timestamp TIMESTAMPTZ,
    scraped_timestamp TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for posts
CREATE INDEX idx_posts_author_profile ON posts(author_profile_id);
CREATE INDEX idx_posts_author_company ON posts(author_company_id);
CREATE INDEX idx_posts_post_timestamp ON posts(post_timestamp);
CREATE INDEX idx_posts_type ON posts(post_type);

-- =====================================================
-- 4. POST_LIKES TABLE
-- =====================================================
DROP TABLE IF EXISTS post_likes CASCADE;

CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    member_id BIGINT, -- LinkedIn member ID
    reaction_type VARCHAR(50), -- 'like', 'love', 'insightful', 'celebrate', etc.
    like_timestamp TIMESTAMPTZ,
    
    -- Denormalized fields for performance (optional)
    liker_name VARCHAR(500),
    liker_occupation VARCHAR(500),
    liker_degree VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    liker_company_name TEXT NULL,
    liker_company_url TEXT NULL,
    liker_job_title TEXT NULL,
    company_source TEXT NULL,
    
    -- Ensure one reaction per person per post
    UNIQUE(post_id, profile_id)
);

-- Create indexes for post_likes
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_profile ON post_likes(profile_id);
CREATE INDEX idx_post_likes_reaction ON post_likes(reaction_type);
CREATE INDEX idx_post_likes_timestamp ON post_likes(like_timestamp);
CREATE INDEX idx_post_likes_member_id ON post_likes(member_id);

-- =====================================================
-- 5. POST_COMMENTS TABLE
-- =====================================================
DROP TABLE IF EXISTS post_comments CASCADE;

CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    member_id BIGINT, -- LinkedIn member ID
    comment_text TEXT,
    comment_timestamp TIMESTAMPTZ,
    
    -- Denormalized fields for performance
    commenter_name VARCHAR(500),
    commenter_occupation VARCHAR(500),
    commenter_degree VARCHAR(50),
    commenter_company_name TEXT NULL,
    commenter_company_url TEXT NULL,
    commenter_job_title TEXT NULL,
    company_source TEXT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one comment per person per post (optional constraint)
    UNIQUE(post_id, profile_id)
);

-- Create indexes for post_comments
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_comments_profile ON post_comments(profile_id);
CREATE INDEX idx_post_comments_timestamp ON post_comments(comment_timestamp);
CREATE INDEX idx_post_comments_member_id ON post_comments(member_id);

-- =====================================================
-- 6. POST_SHARES TABLE
-- =====================================================
DROP TABLE IF EXISTS post_shares CASCADE;

CREATE TABLE post_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    member_id BIGINT, -- LinkedIn member ID
    share_timestamp TIMESTAMPTZ,
    share_text TEXT NULL, -- Optional text added when sharing
    
    -- Denormalized fields for performance
    sharer_name VARCHAR(500),
    sharer_occupation VARCHAR(500),
    sharer_degree VARCHAR(50),
    sharer_company_name TEXT NULL,
    sharer_company_url TEXT NULL,
    sharer_job_title TEXT NULL,
    company_source TEXT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one share per person per post (optional constraint)
    UNIQUE(post_id, profile_id)
);

-- Create indexes for post_shares
CREATE INDEX idx_post_shares_post ON post_shares(post_id);
CREATE INDEX idx_post_shares_profile ON post_shares(profile_id);
CREATE INDEX idx_post_shares_timestamp ON post_shares(share_timestamp);
CREATE INDEX idx_post_shares_member_id ON post_shares(member_id);

-- =====================================================
-- 7. HELPER VIEWS
-- =====================================================

-- View: Post engagement with company details
CREATE OR REPLACE VIEW v_post_engagement AS
SELECT
  pl.post_id,
  pl.id as engagement_id,
  'like' as engagement_type,
  pl.reaction_type,
  pl.like_timestamp as engagement_timestamp,
  COALESCE(pl.liker_name, prof.full_name) as engager_name,
  prof.headline as engager_headline,
  prof.location as engager_location,
  COALESCE(pl.liker_job_title, prof.current_job_title) as engager_job_title,
  COALESCE(pl.liker_company_name, c.company_name) as engager_company_name,
  c.company_industry as engager_company_industry,
  c.company_size as engager_company_size,
  c.headquarter as engager_company_location,
  c.total_employee_count as engager_company_employees,
  COALESCE(pl.liker_company_url, c.linkedin_company_url) as engager_company_url,
  prof.linkedin_profile_url,
  p.post_url,
  p.post_content,
  p.post_type,
  p.author_name as post_author,
  p.like_count,
  p.comment_count,
  p.repost_count,
  prof.first_name,
  prof.last_name
FROM post_likes pl
JOIN posts p ON pl.post_id = p.id
JOIN profiles prof ON pl.profile_id = prof.id
LEFT JOIN companies c ON prof.current_company_id = c.id

UNION ALL

SELECT
  pc.post_id,
  pc.id as engagement_id,
  'comment' as engagement_type,
  pc.comment_text as reaction_type, -- Use comment_text for reaction_type for comments
  pc.comment_timestamp as engagement_timestamp,
  COALESCE(pc.commenter_name, prof.full_name) as engager_name,
  prof.headline as engager_headline,
  prof.location as engager_location,
  COALESCE(pc.commenter_job_title, prof.current_job_title) as engager_job_title,
  COALESCE(pc.commenter_company_name, c.company_name) as engager_company_name,
  c.company_industry as engager_company_industry,
  c.company_size as engager_company_size,
  c.headquarter as engager_company_location,
  c.total_employee_count as engager_company_employees,
  COALESCE(pc.commenter_company_url, c.linkedin_company_url) as engager_company_url,
  prof.linkedin_profile_url,
  p.post_url,
  p.post_content,
  p.post_type,
  p.author_name as post_author,
  p.like_count,
  p.comment_count,
  p.repost_count,
  prof.first_name,
  prof.last_name
FROM post_comments pc
JOIN posts p ON pc.post_id = p.id
JOIN profiles prof ON pc.profile_id = prof.id
LEFT JOIN companies c ON prof.current_company_id = c.id

UNION ALL

SELECT
  ps.post_id,
  ps.id as engagement_id,
  'share' as engagement_type,
  COALESCE(ps.share_text, 'Shared') as reaction_type, -- Using share_text or default
  ps.share_timestamp as engagement_timestamp,
  COALESCE(ps.sharer_name, prof.full_name) as engager_name,
  prof.headline as engager_headline,
  prof.location as engager_location,
  COALESCE(ps.sharer_job_title, prof.current_job_title) as engager_job_title,
  COALESCE(ps.sharer_company_name, c.company_name) as engager_company_name,
  c.company_industry as engager_company_industry,
  c.company_size as engager_company_size,
  c.headquarter as engager_company_location,
  c.total_employee_count as engager_company_employees,
  COALESCE(ps.sharer_company_url, c.linkedin_company_url) as engager_company_url,
  prof.linkedin_profile_url,
  p.post_url,
  p.post_content,
  p.post_type,
  p.author_name as post_author,
  p.like_count,
  p.comment_count,
  p.repost_count,
  prof.first_name,
  prof.last_name
FROM post_shares ps
JOIN posts p ON ps.post_id = p.id
JOIN profiles prof ON ps.profile_id = prof.id
LEFT JOIN companies c ON prof.current_company_id = c.id;

-- View: Likes with full person and company details
CREATE OR REPLACE VIEW v_likes_detailed AS
SELECT
    pl.id as like_id,
    pl.reaction_type,
    pl.like_timestamp,
    
    -- Post details
    p.post_url,
    p.post_content,
    p.post_type,
    p.author_name as post_author,
    
    -- Liker profile details
    prof.first_name,
    prof.last_name,
    prof.full_name as liker_name,
    prof.headline as liker_headline,
    prof.location as liker_location,
    prof.current_job_title,
    prof.linkedin_profile_url,
    
    -- Liker company details (now primarily from post_likes, with fallback/additional from companies)
    COALESCE(pl.liker_company_name, c.company_name) as liker_company_name,
    pl.liker_company_url,
    pl.liker_job_title,
    c.company_industry as liker_company_industry,
    c.company_size as liker_company_size,
    c.headquarter as liker_company_location,
    c.total_employee_count as liker_company_employees
    
FROM post_likes pl
JOIN posts p ON pl.post_id = p.id
JOIN profiles prof ON pl.profile_id = prof.id
LEFT JOIN companies c ON prof.current_company_id = c.id;

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- Create policies (allow authenticated users to read all data)
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

-- =====================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment these lines to add sample data for testing
/*
-- Insert sample company
INSERT INTO companies (company_name, company_industry, company_size, total_employee_count, location) 
VALUES ('Sample Company Inc', 'Technology', '51-200', 150, 'San Francisco, CA');

-- Insert sample profile
INSERT INTO profiles (linkedin_profile_id, first_name, last_name, headline, location) 
VALUES (12345, 'John', 'Doe', 'Software Engineer', 'San Francisco, CA');

-- Insert sample post
INSERT INTO posts (post_url, post_content, author_name, post_type) 
VALUES ('https://linkedin.com/posts/sample', 'This is a sample post content', 'John Doe', 'Text');

-- Insert sample like
INSERT INTO post_likes (post_id, profile_id, reaction_type, like_timestamp, liker_name) 
SELECT p.id, prof.id, 'like', NOW(), 'Jane Smith'
FROM posts p, profiles prof 
WHERE p.post_url = 'https://linkedin.com/posts/sample' 
AND prof.first_name = 'John' 
LIMIT 1;
*/

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'profiles', 'posts', 'post_likes', 'post_comments', 'post_shares')
ORDER BY tablename;

-- Check if views were created successfully
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('v_post_engagement', 'v_likes_detailed')
ORDER BY viewname;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'profiles', 'posts', 'post_likes', 'post_comments', 'post_shares')
ORDER BY table_name, ordinal_position;

