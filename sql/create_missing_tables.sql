-- Create missing tables for AiEO dashboard
-- Run this in your Supabase SQL editor

-- Create aieo_weekly_rankings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.aieo_weekly_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ranking_value INTEGER NOT NULL,
    report_week DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create aieo_sentiment_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.aieo_sentiment_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_date DATE NOT NULL,
    aggregate_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT ON public.aieo_weekly_rankings TO anon, authenticated;
GRANT SELECT ON public.aieo_sentiment_metrics TO anon, authenticated;

-- Insert sample data for testing
INSERT INTO public.aieo_sentiment_metrics (execution_date, aggregate_metrics) VALUES
('2025-08-20', '{"average_sentiment": 7.2, "total_posts": 45, "positive_posts": 28, "negative_posts": 8, "neutral_posts": 9}'),
('2025-08-21', '{"average_sentiment": 7.8, "total_posts": 52, "positive_posts": 35, "negative_posts": 6, "neutral_posts": 11}'),
('2025-08-22', '{"average_sentiment": 6.9, "total_posts": 38, "positive_posts": 22, "negative_posts": 10, "neutral_posts": 6}'),
('2025-08-23', '{"average_sentiment": 8.1, "total_posts": 61, "positive_posts": 42, "negative_posts": 7, "neutral_posts": 12}'),
('2025-08-24', '{"average_sentiment": 7.5, "total_posts": 47, "positive_posts": 30, "negative_posts": 9, "neutral_posts": 8}'),
('2025-08-25', '{"average_sentiment": 8.3, "total_posts": 55, "positive_posts": 38, "negative_posts": 5, "neutral_posts": 12}'),
('2025-08-26', '{"average_sentiment": 7.9, "total_posts": 49, "positive_posts": 33, "negative_posts": 7, "neutral_posts": 9}')
ON CONFLICT DO NOTHING;

INSERT INTO public.aieo_weekly_rankings (ranking_value, report_week) VALUES
(3, '2025-08-20'),
(2, '2025-08-21'),
(1, '2025-08-22'),
(4, '2025-08-23'),
(2, '2025-08-24'),
(1, '2025-08-25'),
(3, '2025-08-26')
ON CONFLICT DO NOTHING;

-- Verify tables exist and have data
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_live_tup as live_rows
FROM pg_stat_user_tables
WHERE tablename IN ('aieo_sentiment_metrics', 'aieo_weekly_rankings');
