-- =====================================================
-- LinkedIn Data Schema for Supabase PostgreSQL
-- Enhanced with Comprehensive Company Data
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. COMPANIES TABLE (Enhanced with detailed metrics)
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
-- 4. POST_LIKES TABLE (Junction table)
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
-- 5. COMPANY_METRICS TABLE (Time-series data)
-- =====================================================
DROP TABLE IF EXISTS company_metrics CASCADE;

CREATE TABLE company_metrics (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

-- Snapshot date
metric_date DATE NOT NULL,

-- Metrics at this point in time
follower_count INTEGER,
employee_count INTEGER,
employees_on_linkedin INTEGER,

-- Growth rates
growth_6_month VARCHAR(100),
growth_1_year VARCHAR(100),
growth_2_year VARCHAR(100),

created_at TIMESTAMPTZ DEFAULT NOW(),

-- One snapshot per company per date
UNIQUE(company_id, metric_date)
);

CREATE INDEX idx_company_metrics_company ON company_metrics(company_id);
CREATE INDEX idx_company_metrics_date ON company_metrics(metric_date DESC);

-- =====================================================
-- 6. HELPER VIEWS
-- =====================================================

-- View: Post engagement with company details
CREATE OR REPLACE VIEW v_post_engagement AS
SELECT
p.id as post_id,
p.post_url,
p.post_content,
p.post_type,
p.like_count,
p.comment_count,
p.repost_count,
p.post_timestamp,
p.author_name,
c.company_name as author_company_name,
c.company_industry as author_company_industry,
c.company_size as author_company_size
FROM posts p
LEFT JOIN companies c ON p.author_company_id = c.id;

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

-- View: Company engagement summary with metrics
CREATE OR REPLACE VIEW v_company_engagement AS
SELECT
c.company_name,
c.company_industry,
c.company_size,
c.total_employee_count,
c.follower_count,
c.growth_1_year,
COUNT(DISTINCT pl.profile_id) as unique_employees_engaging,
COUNT(pl.id) as total_engagements,
COUNT(DISTINCT pl.post_id) as unique_posts_engaged,
CASE
WHEN c.employees_on_linkedin > 0
THEN ROUND((COUNT(DISTINCT pl.profile_id)::DECIMAL / c.employees_on_linkedin) * 100, 2)
ELSE NULL
END as engagement_rate_pct
FROM companies c
JOIN profiles prof ON prof.current_company_id = c.id
JOIN post_likes pl ON pl.profile_id = prof.id
GROUP BY c.id, c.company_name, c.company_industry, c.company_size,
c.total_employee_count, c.follower_count, c.growth_1_year, c.employees_on_linkedin;

-- View: Company department distribution summary
CREATE OR REPLACE VIEW v_company_departments AS
SELECT
company_name,
company_industry,
company_size,
total_employee_count,

-- Top departments by percentage
GREATEST(
COALESCE(dist_sales_pct, 0),
COALESCE(dist_engineering_pct, 0),
COALESCE(dist_operations_pct, 0),
COALESCE(dist_marketing_pct, 0),
COALESCE(dist_support_pct, 0)
) as max_department_pct,

CASE
WHEN dist_sales_pct = GREATEST(
COALESCE(dist_sales_pct, 0),
COALESCE(dist_engineering_pct, 0),
COALESCE(dist_operations_pct, 0),
COALESCE(dist_marketing_pct, 0),
COALESCE(dist_support_pct, 0)
) THEN 'Sales'
WHEN dist_engineering_pct = GREATEST(
COALESCE(dist_sales_pct, 0),
COALESCE(dist_engineering_pct, 0),
COALESCE(dist_operations_pct, 0),
COALESCE(dist_marketing_pct, 0),
COALESCE(dist_support_pct, 0)
) THEN 'Engineering'
WHEN dist_operations_pct = GREATEST(
COALESCE(dist_sales_pct, 0),
COALESCE(dist_engineering_pct, 0),
COALESCE(dist_operations_pct, 0),
COALESCE(dist_marketing_pct, 0),
COALESCE(dist_support_pct, 0)
) THEN 'Operations'
WHEN dist_marketing_pct = GREATEST(
COALESCE(dist_sales_pct, 0),
COALESCE(dist_engineering_pct, 0),
COALESCE(dist_operations_pct, 0),
COALESCE(dist_marketing_pct, 0),
COALESCE(dist_support_pct, 0)
) THEN 'Marketing'
ELSE 'Support'
END as dominant_department,

dist_sales_pct,
dist_engineering_pct,
dist_operations_pct,
dist_marketing_pct,
dist_support_pct
FROM companies
WHERE total_employee_count IS NOT NULL;

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to calculate company engagement score
CREATE OR REPLACE FUNCTION calculate_company_engagement_score(company_id_param UUID)
RETURNS TABLE(
engagement_score DECIMAL,
total_engagements INTEGER,
unique_engagers INTEGER,
engagement_rate DECIMAL
) AS $$
BEGIN
RETURN QUERY
SELECT
CASE
WHEN c.employees_on_linkedin > 0
THEN ROUND((COUNT(DISTINCT pl.profile_id)::DECIMAL / c.employees_on_linkedin) * 100, 2)
ELSE 0
END as engagement_score,
COUNT(pl.id)::INTEGER as total_engagements,
COUNT(DISTINCT pl.profile_id)::INTEGER as unique_engagers,
CASE
WHEN COUNT(DISTINCT p.id) > 0
THEN ROUND(COUNT(pl.id)::DECIMAL / COUNT(DISTINCT p.id), 2)
ELSE 0
END as engagement_rate
FROM companies c
LEFT JOIN profiles prof ON prof.current_company_id = c.id
LEFT JOIN post_likes pl ON pl.profile_id = prof.id
LEFT JOIN posts p ON pl.post_id = p.id
WHERE c.id = company_id_param
GROUP BY c.id, c.employees_on_linkedin;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. ROW LEVEL SECURITY (Optional - for Supabase)
-- =====================================================

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
-- Example: Allow authenticated users to read all data
CREATE POLICY "Enable read access for all users" ON companies
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON profiles
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON posts
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON post_likes
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON company_metrics
FOR SELECT USING (true);

-- =====================================================
-- 9. SAMPLE QUERIES
-- =====================================================

/*
-- Find companies with highest engagement rates
SELECT
company_name,
company_industry,
company_size,
total_employee_count,
(SELECT * FROM calculate_company_engagement_score(id)).*
FROM companies
WHERE employees_on_linkedin > 0
ORDER BY (SELECT engagement_score FROM calculate_company_engagement_score(id)) DESC
LIMIT 10;

-- Analyze engagement by company department distribution
SELECT
cd.dominant_department,
COUNT(DISTINCT c.id) as company_count,
AVG(ce.engagement_rate_pct) as avg_engagement_rate,
AVG(c.follower_count) as avg_followers
FROM v_company_departments cd
JOIN companies c ON c.company_name = cd.company_name
LEFT JOIN v_company_engagement ce ON ce.company_name = c.company_name
GROUP BY cd.dominant_department
ORDER BY avg_engagement_rate DESC;

-- Track company growth and engagement correlation
SELECT
c.company_name,
c.growth_1_year,
c.follower_count,
COUNT(DISTINCT pl.profile_id) as unique_engagers,
COUNT(pl.id) as total_likes
FROM companies c
JOIN profiles p ON p.current_company_id = c.id
JOIN post_likes pl ON pl.profile_id = p.id
WHERE c.growth_1_year IS NOT NULL
GROUP BY c.id, c.company_name, c.growth_1_year, c.follower_count
ORDER BY c.growth_1_year DESC;

-- Get detailed company metrics with department breakdown
SELECT
company_name,
company_industry,
total_employee_count,
ROUND(dist_sales_pct, 1) || '%' as sales,
ROUND(dist_engineering_pct, 1) || '%' as engineering,
ROUND(dist_marketing_pct, 1) || '%' as marketing,
ROUND(dist_operations_pct, 1) || '%' as operations,
growth_1_year as "1yr_growth",
follower_count
FROM companies
WHERE total_employee_count IS NOT NULL
ORDER BY total_employee_count DESC;
*/
