# Post Ideas Table Setup Instructions

## Problem
The LinkedIn Competitor Posts page is showing "Error Ideas: An unknown error occurred" because the `post_ideas` table doesn't exist in the database.

## Solution
You need to create the `post_ideas` table in your Supabase database.

### Steps:

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (URL: https://ratjciwgkqncadcpjjcw.supabase.co)

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Create the Table**
   - Copy and paste the SQL code below into the SQL Editor
   - Click "Run" to execute

### SQL Code to Run:

```sql
-- =====================================================
-- POST IDEAS TABLE
-- =====================================================
-- This table stores content ideas generated from competitor post analysis

DROP TABLE IF EXISTS post_ideas CASCADE;

CREATE TABLE post_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    hook TEXT NULL,
    week_of_date DATE NOT NULL, -- YYYY-MM-DD format
    outline TEXT NULL,
    angle TEXT NULL,
    persona TEXT NULL,
    inspired_by_posts TEXT[] NULL, -- Array of post URLs that inspired this idea
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for post_ideas
CREATE INDEX idx_post_ideas_week_of_date ON post_ideas(week_of_date);
CREATE INDEX idx_post_ideas_title ON post_ideas(title);
CREATE INDEX idx_post_ideas_created_at ON post_ideas(created_at);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_post_ideas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_ideas_updated_at
    BEFORE UPDATE ON post_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_post_ideas_updated_at();

-- Enable Row Level Security
ALTER TABLE post_ideas ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- You may want to restrict this based on your authentication setup
CREATE POLICY "Allow all operations on post_ideas" ON post_ideas
    FOR ALL USING (true) WITH CHECK (true);

-- Add some sample data for testing
INSERT INTO post_ideas (title, hook, week_of_date, outline, angle, persona, inspired_by_posts) VALUES 
(
    'The Future of Remote Work: What Leaders Need to Know',
    'Remote work isn''t just a trend anymore—it''s the new reality. Here''s what forward-thinking leaders are doing to stay ahead.',
    '2024-01-15',
    '1. Share statistics on remote work adoption
2. Discuss challenges leaders face
3. Provide 3 actionable strategies
4. Include a call-to-action for engagement',
    'Educational/Thought Leadership',
    'Business Leaders, HR Professionals',
    ARRAY['https://linkedin.com/posts/sample1', 'https://linkedin.com/posts/sample2']
),
(
    '5 Mistakes That Are Killing Your LinkedIn Engagement',
    'Your LinkedIn posts are getting zero engagement? You''re probably making one of these 5 critical mistakes.',
    '2024-01-15',
    '1. Hook with a bold statement
2. List the 5 mistakes with brief explanations
3. Provide quick fixes for each
4. End with a question to drive comments',
    'Problem/Solution',
    'Marketing Professionals, Content Creators',
    ARRAY['https://linkedin.com/posts/sample3']
),
(
    'From Startup to Scale-up: Lessons Learned in 24 Months',
    'Two years ago, we were a 5-person startup. Today, we''re 50+ employees. Here''s what I wish I knew then.',
    '2024-01-22',
    '1. Personal story opening
2. Share 3-4 key lessons with specific examples
3. Include metrics/numbers where possible
4. Offer to help others in similar situations',
    'Personal Story/Experience',
    'Entrepreneurs, Startup Founders',
    ARRAY['https://linkedin.com/posts/sample4', 'https://linkedin.com/posts/sample5']
);
```

4. **Verify the Table was Created**
   - Go to "Table Editor" in the left sidebar
   - You should see the `post_ideas` table listed
   - Click on it to see the sample data

5. **Test the Application**
   - Go back to your application at http://localhost:3000/reports/competitor-content
   - Click on the "Post Ideas" tab
   - You should now see the 3 sample post ideas displayed

## What This Will Fix:
- The "Error Ideas: An unknown error occurred" message will disappear
- The Post Ideas tab will show actual content instead of being empty
- You'll see 3 sample post ideas with titles, hooks, outlines, etc.

## After Setup:
Once the table is created and working, you can:
- Add more post ideas through the Supabase dashboard
- Modify the sample data
- Build features to add post ideas directly from your application
