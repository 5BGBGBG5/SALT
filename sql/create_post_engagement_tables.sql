-- =====================================================
-- POST ENGAGEMENT TABLES (Comments and Shares)
-- =====================================================

-- =====================================================
-- 1. POST_COMMENTS TABLE
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
-- 2. POST_SHARES TABLE
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
-- 3. COMPREHENSIVE POST ENGAGEMENT VIEW
-- =====================================================
DROP VIEW IF EXISTS v_post_engagement CASCADE;

CREATE VIEW v_post_engagement AS
SELECT 
    -- Post information
    p.id as post_id,
    p.post_url,
    p.post_content,
    p.post_type,
    p.post_timestamp,
    p.author_name as post_author,
    p.like_count,
    p.comment_count,
    p.repost_count,
    
    -- Engagement type and details
    'like' as engagement_type,
    pl.id as engagement_id,
    pl.reaction_type,
    pl.like_timestamp as engagement_timestamp,
    
    -- Profile information
    pl.liker_name as engager_name,
    pl.liker_occupation as engager_occupation,
    pl.liker_degree as engager_degree,
    pl.liker_company_name as engager_company_name,
    pl.liker_company_url as engager_company_url,
    pl.liker_job_title as engager_job_title,
    pl.company_source,
    
    -- Company information (from profiles table)
    c.company_industry as engager_company_industry,
    c.company_size as engager_company_size,
    c.location as engager_company_location,
    c.total_employee_count as engager_company_employees,
    
    -- Profile details
    prof.first_name,
    prof.last_name,
    prof.linkedin_profile_url,
    prof.headline as engager_headline,
    prof.location as engager_location

FROM posts p
JOIN post_likes pl ON p.id = pl.post_id
LEFT JOIN profiles prof ON pl.profile_id = prof.id
LEFT JOIN companies c ON prof.current_company_id = c.id

UNION ALL

SELECT 
    -- Post information
    p.id as post_id,
    p.post_url,
    p.post_content,
    p.post_type,
    p.post_timestamp,
    p.author_name as post_author,
    p.like_count,
    p.comment_count,
    p.repost_count,
    
    -- Engagement type and details
    'comment' as engagement_type,
    pc.id as engagement_id,
    pc.comment_text as reaction_type, -- Using comment_text for reaction_type
    pc.comment_timestamp as engagement_timestamp,
    
    -- Profile information
    pc.commenter_name as engager_name,
    pc.commenter_occupation as engager_occupation,
    pc.commenter_degree as engager_degree,
    pc.commenter_company_name as engager_company_name,
    pc.commenter_company_url as engager_company_url,
    pc.commenter_job_title as engager_job_title,
    pc.company_source,
    
    -- Company information (from profiles table)
    c.company_industry as engager_company_industry,
    c.company_size as engager_company_size,
    c.location as engager_company_location,
    c.total_employee_count as engager_company_employees,
    
    -- Profile details
    prof.first_name,
    prof.last_name,
    prof.linkedin_profile_url,
    prof.headline as engager_headline,
    prof.location as engager_location

FROM posts p
JOIN post_comments pc ON p.id = pc.post_id
LEFT JOIN profiles prof ON pc.profile_id = prof.id
LEFT JOIN companies c ON prof.current_company_id = c.id

UNION ALL

SELECT 
    -- Post information
    p.id as post_id,
    p.post_url,
    p.post_content,
    p.post_type,
    p.post_timestamp,
    p.author_name as post_author,
    p.like_count,
    p.comment_count,
    p.repost_count,
    
    -- Engagement type and details
    'share' as engagement_type,
    ps.id as engagement_id,
    COALESCE(ps.share_text, 'Shared') as reaction_type, -- Using share_text or default
    ps.share_timestamp as engagement_timestamp,
    
    -- Profile information
    ps.sharer_name as engager_name,
    ps.sharer_occupation as engager_occupation,
    ps.sharer_degree as engager_degree,
    ps.sharer_company_name as engager_company_name,
    ps.sharer_company_url as engager_company_url,
    ps.sharer_job_title as engager_job_title,
    ps.company_source,
    
    -- Company information (from profiles table)
    c.company_industry as engager_company_industry,
    c.company_size as engager_company_size,
    c.location as engager_company_location,
    c.total_employee_count as engager_company_employees,
    
    -- Profile details
    prof.first_name,
    prof.last_name,
    prof.linkedin_profile_url,
    prof.headline as engager_headline,
    prof.location as engager_location

FROM posts p
JOIN post_shares ps ON p.id = ps.post_id
LEFT JOIN profiles prof ON ps.profile_id = prof.id
LEFT JOIN companies c ON prof.current_company_id = c.id;

-- Note: Indexes cannot be created on views in PostgreSQL
-- The underlying tables (post_likes, post_comments, post_shares) already have appropriate indexes

-- =====================================================
-- 4. SAMPLE DATA INSERTION (for testing)
-- =====================================================
-- Uncomment these lines to add sample data for testing

/*
INSERT INTO post_comments (post_id, profile_id, member_id, comment_text, comment_timestamp, commenter_name, commenter_occupation, commenter_company_name, commenter_job_title)
SELECT 
    p.id,
    pl.profile_id,
    pl.member_id,
    'Great post! Thanks for sharing this insight.' as comment_text,
    pl.like_timestamp + interval '1 hour' as comment_timestamp,
    pl.liker_name,
    pl.liker_occupation,
    pl.liker_company_name,
    pl.liker_job_title
FROM post_likes pl
JOIN posts p ON pl.post_id = p.id
WHERE pl.like_timestamp > NOW() - interval '30 days'
LIMIT 50;

INSERT INTO post_shares (post_id, profile_id, member_id, share_timestamp, share_text, sharer_name, sharer_occupation, sharer_company_name, sharer_job_title)
SELECT 
    p.id,
    pl.profile_id,
    pl.member_id,
    pl.like_timestamp + interval '2 hours' as share_timestamp,
    'Sharing this valuable content with my network!' as share_text,
    pl.liker_name,
    pl.liker_occupation,
    pl.liker_company_name,
    pl.liker_job_title
FROM post_likes pl
JOIN posts p ON pl.post_id = p.id
WHERE pl.like_timestamp > NOW() - interval '30 days'
LIMIT 30;
*/
